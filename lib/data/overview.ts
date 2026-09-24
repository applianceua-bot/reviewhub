import 'server-only'
import { all, get } from '@/lib/db'
import { addDays, today, weekStart } from '@/lib/dash/dates'
import { platformName } from '@/lib/dash/constants'

export type EntryRow = { platform: string; week_start: string; rating: number; review_count: number }

export type PlatformSnapshot = {
  platform: string
  rating: number
  reviewCount: number
  ratingDelta: number | null
  newReviews: number
}

export type TrendPoint = { week: string; rating: number | null; newReviews: number }

export type ActivityItem = {
  date: string
  kind: 'review' | 'removal' | 'task' | 'mention'
  title: string
  detail: string
  tone: 'positive' | 'neutral' | 'negative' | 'brand'
}

export type Overview = {
  rating: number | null
  ratingDelta: number | null
  targetRating: number
  newReviews: number
  newReviewsPrev: number
  /** Fake reviews in «Проверка на удаление» and how many the platforms removed. */
  removal: { total: number; removed: number; pending: number }
  mentionsToAnswer: number
  replyRate: number | null
  sentiment: { positive: number; neutral: number; negative: number }
  platforms: PlatformSnapshot[]
  trend: TrendPoint[]
  activity: ActivityItem[]
}

/** Latest snapshot per platform at or before `week`. */
export function snapshotAt(entries: EntryRow[], week: string) {
  const latest = new Map<string, EntryRow>()
  for (const e of entries) {
    if (e.week_start > week) continue
    const prev = latest.get(e.platform)
    if (!prev || e.week_start > prev.week_start) latest.set(e.platform, e)
  }
  return latest
}

/** Review-count-weighted average rating across platforms. */
export function weightedRating(snapshot: Map<string, EntryRow>) {
  let sum = 0
  let weight = 0
  for (const e of snapshot.values()) {
    const w = Math.max(e.review_count, 1)
    sum += e.rating * w
    weight += w
  }
  return weight ? sum / weight : null
}

export function totalReviews(snapshot: Map<string, EntryRow>) {
  let total = 0
  for (const e of snapshot.values()) total += e.review_count
  return total
}

export function getOverview(brandId: number, weeks = 12): Overview {
  const brand = get<{ target_rating: number }>('SELECT target_rating FROM brands WHERE id = ?', brandId)
  const entries = all<EntryRow>(
    'SELECT platform, week_start, rating, review_count FROM entries WHERE brand_id = ? ORDER BY week_start',
    brandId,
  )

  const thisWeek = weekStart()
  const monthAgo = addDays(thisWeek, -28)
  const twoMonthsAgo = addDays(thisWeek, -56)

  const now = snapshotAt(entries, thisWeek)
  const before = snapshotAt(entries, monthAgo)
  const beforeThat = snapshotAt(entries, twoMonthsAgo)

  const rating = weightedRating(now)
  const ratingBefore = weightedRating(before)

  const platforms: PlatformSnapshot[] = [...now.values()]
    .map((e) => {
      const prev = before.get(e.platform)
      return {
        platform: e.platform,
        rating: e.rating,
        reviewCount: e.review_count,
        ratingDelta: prev ? e.rating - prev.rating : null,
        newReviews: prev ? Math.max(e.review_count - prev.review_count, 0) : 0,
      }
    })
    .sort((a, b) => b.reviewCount - a.reviewCount)

  const trend: TrendPoint[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const week = addDays(thisWeek, -7 * i)
    const snap = snapshotAt(entries, week)
    const prev = snapshotAt(entries, addDays(week, -7))
    trend.push({
      week,
      rating: weightedRating(snap),
      newReviews: prev.size ? Math.max(totalReviews(snap) - totalReviews(prev), 0) : 0,
    })
  }

  const removal = get<{ total: number; removed: number; pending: number }>(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(link_status = 'removed'), 0) AS removed,
            COALESCE(SUM(link_status != 'removed'), 0) AS pending
       FROM removal_checks WHERE brand_id = ? AND review_type = 'fake'`,
    brandId,
  )!

  const mentionsToAnswer = get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM mentions WHERE brand_id = ? AND status = 'needs_response'",
    brandId,
  )!.n

  const since = addDays(today(), -90)
  const replies = get<{ total: number; replied: number }>(
    `SELECT COUNT(*) AS total, COALESCE(SUM(reply_status = 'published'), 0) AS replied
       FROM reviews WHERE brand_id = ? AND published_at >= ? AND suspicious = 0`,
    brandId,
    since,
  )!

  const sentimentRows = all<{ sentiment: 'positive' | 'neutral' | 'negative'; n: number }>(
    `SELECT sentiment, COUNT(*) AS n FROM reviews
      WHERE brand_id = ? AND published_at >= ? GROUP BY sentiment`,
    brandId,
    since,
  )
  const sentiment = { positive: 0, neutral: 0, negative: 0 }
  for (const row of sentimentRows) sentiment[row.sentiment] = row.n

  return {
    rating,
    ratingDelta: rating !== null && ratingBefore !== null ? rating - ratingBefore : null,
    targetRating: brand?.target_rating ?? 4.5,
    newReviews: Math.max(totalReviews(now) - totalReviews(before), 0),
    newReviewsPrev: Math.max(totalReviews(before) - totalReviews(beforeThat), 0),
    removal,
    mentionsToAnswer,
    replyRate: replies.total ? replies.replied / replies.total : null,
    sentiment,
    platforms,
    trend,
    activity: getActivity(brandId),
  }
}

function getActivity(brandId: number, limit = 8): ActivityItem[] {
  const items: ActivityItem[] = []

  for (const r of all<{ published_at: string; platform: string; rating: number | null; author: string | null; sentiment: string; suspicious: number }>(
    `SELECT published_at, platform, rating, author, sentiment, suspicious FROM reviews
      WHERE brand_id = ? ORDER BY published_at DESC LIMIT ?`,
    brandId,
    limit,
  )) {
    items.push({
      date: r.published_at,
      kind: 'review',
      title: r.suspicious ? 'Подозрительный отзыв' : `Новый отзыв${r.rating ? ` · ${r.rating}★` : ''}`,
      detail: `${platformName(r.platform)}${r.author ? ` · ${r.author}` : ''}`,
      tone: r.suspicious ? 'negative' : (r.sentiment as ActivityItem['tone']),
    })
  }

  for (const r of all<{ last_checked: string; platform: string; review_type: string }>(
    `SELECT last_checked, platform, review_type FROM removal_checks
      WHERE brand_id = ? AND link_status = 'removed' AND last_checked IS NOT NULL
      ORDER BY last_checked DESC LIMIT ?`,
    brandId,
    limit,
  )) {
    items.push({
      date: r.last_checked.slice(0, 10),
      kind: 'removal',
      title: r.review_type === 'real' ? 'Площадка удалила настоящий отзыв' : 'Площадка удалила фейковый отзыв',
      detail: platformName(r.platform),
      tone: r.review_type === 'real' ? 'negative' : 'positive',
    })
  }

  for (const t of all<{ due_date: string | null; created_at: string; title: string; kind: string }>(
    `SELECT due_date, created_at, title, kind FROM tasks
      WHERE brand_id = ? AND status = 'done' ORDER BY COALESCE(due_date, created_at) DESC LIMIT ?`,
    brandId,
    limit,
  )) {
    items.push({
      date: t.due_date ?? t.created_at.slice(0, 10),
      kind: 'task',
      title: 'Задача выполнена',
      detail: t.title,
      tone: 'brand',
    })
  }

  return items.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit)
}
