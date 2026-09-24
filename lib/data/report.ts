import 'server-only'
import { all, get } from '@/lib/db'
import { addDays, formatShort, quarterOf, weekStart, fromDateKey, today } from '@/lib/dash/dates'
import { snapshotAt, totalReviews, weightedRating, type EntryRow } from '@/lib/data/overview'

export type Period = { kind: 'week' | 'quarter'; offset: number; start: string; end: string; label: string }

/** Resolves ?period=week|quarter&offset=N (N periods back from the current one). */
export function resolvePeriod(kind: string | undefined, offsetRaw: string | undefined): Period {
  const offset = Math.min(Math.max(Number(offsetRaw) || 0, 0), 52)
  if (kind === 'quarter') {
    let q = quarterOf(today())
    for (let i = 0; i < offset; i++) q = quarterOf(addDays(q.start, -1))
    return { kind: 'quarter', offset, start: q.start, end: q.end, label: q.label }
  }
  const start = addDays(weekStart(fromDateKey(today())), -7 * offset)
  const end = addDays(start, 6)
  return { kind: 'week', offset, start, end, label: `${formatShort(start)} — ${formatShort(end)}` }
}

export type Report = {
  ratingStart: number | null
  ratingEnd: number | null
  newReviews: number
  platforms: { platform: string; ratingStart: number | null; ratingEnd: number; newReviews: number }[]
  reviews: { total: number; positive: number; neutral: number; negative: number; avgStars: number | null; suspicious: number }
  repliesPublished: number
  removal: { added: number; fakeRemoved: number; realRemoved: number; fakeLive: number }
  mentions: { total: number; negative: number; needsResponse: number }
  invitations: { sent: number; received: number }
  tasksDone: { title: string; due_date: string | null }[]
  expenses: { total: number; byCategory: { category: string; amount: number }[] } | null
}

export function getReport(brandId: number, period: Period, { includeExpenses = false } = {}): Report {
  const entries = all<EntryRow>(
    'SELECT platform, week_start, rating, review_count FROM entries WHERE brand_id = ? AND week_start <= ? ORDER BY week_start',
    brandId,
    period.end,
  )
  const before = snapshotAt(entries, addDays(period.start, -1))
  const after = snapshotAt(entries, period.end)

  const platforms = [...after.values()]
    .map((e) => {
      const prev = before.get(e.platform)
      return {
        platform: e.platform,
        ratingStart: prev?.rating ?? null,
        ratingEnd: e.rating,
        newReviews: prev ? Math.max(e.review_count - prev.review_count, 0) : 0,
      }
    })
    .sort((a, b) => b.newReviews - a.newReviews)

  const reviews = get<Report['reviews']>(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(sentiment = 'positive'), 0) AS positive,
            COALESCE(SUM(sentiment = 'neutral'), 0) AS neutral,
            COALESCE(SUM(sentiment = 'negative'), 0) AS negative,
            AVG(CASE WHEN suspicious = 0 THEN rating END) AS avgStars,
            COALESCE(SUM(suspicious), 0) AS suspicious
       FROM reviews WHERE brand_id = ? AND published_at BETWEEN ? AND ?`,
    brandId,
    period.start,
    period.end,
  )!

  const repliesPublished = get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM reviews WHERE brand_id = ? AND reply_status = 'published' AND published_at BETWEEN ? AND ?",
    brandId,
    period.start,
    period.end,
  )!.n

  // Removals confirmed by a check within the period, split by review type.
  const removal = get<Report['removal']>(
    `SELECT COALESCE(SUM(date BETWEEN ?1 AND ?2), 0) AS added,
            COALESCE(SUM(review_type = 'fake' AND link_status = 'removed' AND substr(last_checked, 1, 10) BETWEEN ?1 AND ?2), 0) AS fakeRemoved,
            COALESCE(SUM(review_type = 'real' AND link_status = 'removed' AND substr(last_checked, 1, 10) BETWEEN ?1 AND ?2), 0) AS realRemoved,
            COALESCE(SUM(review_type = 'fake' AND link_status != 'removed'), 0) AS fakeLive
       FROM removal_checks WHERE brand_id = ?3`,
    period.start,
    period.end,
    brandId,
  )!

  const mentions = get<Report['mentions']>(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(sentiment = 'negative'), 0) AS negative,
            COALESCE(SUM(status = 'needs_response'), 0) AS needsResponse
       FROM mentions WHERE brand_id = ? AND date BETWEEN ? AND ?`,
    brandId,
    period.start,
    period.end,
  )!

  const invitations = get<Report['invitations']>(
    `SELECT COALESCE(SUM(invites_sent), 0) AS sent, COALESCE(SUM(reviews_received), 0) AS received
       FROM campaigns WHERE brand_id = ? AND start_date <= ? AND status != 'planned'`,
    brandId,
    period.end,
  )!

  const tasksDone = all<{ title: string; due_date: string | null }>(
    "SELECT title, due_date FROM tasks WHERE brand_id = ? AND status = 'done' AND due_date BETWEEN ? AND ? ORDER BY due_date",
    brandId,
    period.start,
    period.end,
  )

  let expenses: Report['expenses'] = null
  if (includeExpenses) {
    const byCategory = all<{ category: string; amount: number }>(
      `SELECT category, SUM(amount) AS amount FROM expenses
        WHERE brand_id = ? AND date BETWEEN ? AND ? AND currency = 'USD' GROUP BY category`,
      brandId,
      period.start,
      period.end,
    )
    expenses = { total: byCategory.reduce((s, x) => s + x.amount, 0), byCategory }
  }

  return {
    ratingStart: weightedRating(before),
    ratingEnd: weightedRating(after),
    newReviews: before.size ? Math.max(totalReviews(after) - totalReviews(before), 0) : 0,
    platforms,
    reviews,
    repliesPublished,
    removal,
    mentions,
    invitations,
    tasksDone,
    expenses,
  }
}
