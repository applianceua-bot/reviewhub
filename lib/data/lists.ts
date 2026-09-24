import 'server-only'
import { all } from '@/lib/db'

/**
 * Read queries for list pages. All take a brand id that the caller has
 * already authorised via lib/data/access.ts.
 */

export type Review = {
  id: number
  platform: string
  author: string | null
  rating: number | null
  text: string | null
  url: string | null
  published_at: string
  sentiment: 'positive' | 'neutral' | 'negative'
  suspicious: number
  suspicion_reason: string | null
  reply_status: 'none' | 'draft' | 'approved' | 'published'
  reply_text: string | null
  tracked: number
}

export function listReviews(brandId: number, filter: { suspicious?: boolean; platform?: string } = {}) {
  const where = ['r.brand_id = ?']
  const params: (string | number)[] = [brandId]
  if (filter.suspicious) where.push('r.suspicious = 1')
  if (filter.platform) {
    where.push('r.platform = ?')
    params.push(filter.platform)
  }
  return all<Review>(
    `SELECT r.*,
            EXISTS (SELECT 1 FROM removal_checks c WHERE c.link = r.url) AS tracked
       FROM reviews r
      WHERE ${where.join(' AND ')}
      ORDER BY r.published_at DESC, r.id DESC
      LIMIT 300`,
    ...params,
  )
}

export type RemovalCheck = {
  id: number
  brand_id: number
  brand: string
  date: string
  link: string
  platform: string
  process_raw: string | null
  review_type: 'real' | 'fake' | 'unknown'
  link_status: 'live' | 'removed' | 'unknown'
  last_checked: string | null
  reviewer_email: string | null
}

export type RemovalFilter = {
  brandIds: number[]
  platform?: string
  linkStatus?: string
  reviewType?: string
  month?: string
  search?: string
}

/** The removal-check journal for the given (already authorised) brands, newest first. */
export function listRemovalChecks(filter: RemovalFilter) {
  if (filter.brandIds.length === 0) return []
  const where = [`r.brand_id IN (${filter.brandIds.map(() => '?').join(',')})`]
  const params: (string | number)[] = [...filter.brandIds]
  const add = (sql: string, value: string | undefined) => {
    if (!value) return
    where.push(sql)
    params.push(value)
  }
  add('r.platform = ?', filter.platform)
  add('r.link_status = ?', filter.linkStatus)
  add('r.review_type = ?', filter.reviewType)
  add('substr(r.date, 1, 7) = ?', filter.month)
  if (filter.search) {
    where.push('(r.link LIKE ? OR r.reviewer_email LIKE ?)')
    params.push(`%${filter.search}%`, `%${filter.search}%`)
  }
  return all<RemovalCheck>(
    `SELECT r.id, r.brand_id, b.name AS brand, r.date, r.link, r.platform, r.process_raw, r.review_type,
            r.link_status, r.last_checked, r.reviewer_email
       FROM removal_checks r JOIN brands b ON b.id = r.brand_id
      WHERE ${where.join(' AND ')}
      ORDER BY r.date DESC, r.id DESC
      LIMIT 5000`,
    ...params,
  )
}

export function removalMonths(brandIds: number[]) {
  if (brandIds.length === 0) return []
  return all<{ month: string }>(
    `SELECT DISTINCT substr(date, 1, 7) AS month FROM removal_checks
      WHERE brand_id IN (${brandIds.map(() => '?').join(',')}) ORDER BY month DESC`,
    ...brandIds,
  ).map((r) => r.month)
}

export type Mention = {
  id: number
  platform: string
  url: string | null
  title: string
  date: string
  sentiment: 'positive' | 'neutral' | 'negative'
  status: 'needs_response' | 'responded' | 'monitoring' | 'resolved'
  matched_keyword: string | null
}

export function listMentions(brandId: number) {
  return all<Mention>(
    'SELECT id, platform, url, title, date, sentiment, status, matched_keyword FROM mentions WHERE brand_id = ? ORDER BY date DESC, id DESC',
    brandId,
  )
}

export function listKeywords(brandId: number) {
  return all<{ id: number; keyword: string; active: number; hits: number }>(
    `SELECT k.id, k.keyword, k.active,
            (SELECT COUNT(*) FROM mentions m WHERE m.brand_id = k.brand_id AND m.matched_keyword = k.keyword) AS hits
       FROM brand_keywords k WHERE k.brand_id = ? ORDER BY k.keyword`,
    brandId,
  )
}

export type Task = {
  id: number
  platform: string | null
  kind: string
  title: string
  due_date: string | null
  assignee: string | null
  status: 'todo' | 'in_progress' | 'done'
}

export function listTasks(brandId: number) {
  return all<Task>(
    `SELECT id, platform, kind, title, due_date, assignee, status FROM tasks WHERE brand_id = ?
      ORDER BY CASE status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 ELSE 2 END, due_date IS NULL, due_date`,
    brandId,
  )
}

export type Campaign = {
  id: number
  platform: string
  name: string
  start_date: string
  invites_sent: number
  reviews_received: number
  status: 'planned' | 'active' | 'finished'
}

export function listCampaigns(brandId: number) {
  return all<Campaign>(
    'SELECT id, platform, name, start_date, invites_sent, reviews_received, status FROM campaigns WHERE brand_id = ? ORDER BY start_date DESC',
    brandId,
  )
}

/** Connection status without credentials — safe for any page. */
export function listConnectionStatus(brandId: number) {
  return all<{ platform: string; connected: number; business_id: string | null; last_sync: string | null; has_key: number }>(
    `SELECT platform, connected, business_id, last_sync, api_key IS NOT NULL AS has_key
       FROM connections WHERE brand_id = ?`,
    brandId,
  )
}

export function listEntries(brandId: number, limit = 60) {
  return all<{ id: number; platform: string; week_start: string; rating: number; review_count: number }>(
    'SELECT id, platform, week_start, rating, review_count FROM entries WHERE brand_id = ? ORDER BY week_start DESC, platform LIMIT ?',
    brandId,
    limit,
  )
}
