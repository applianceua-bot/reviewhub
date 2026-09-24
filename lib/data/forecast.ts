import 'server-only'
import { all, get } from '@/lib/db'
import { addDays, weekStart } from '@/lib/dash/dates'
import { monthlyEquivalent } from '@/lib/dash/constants'
import type { PlanRow, PlatformFacts } from '@/lib/dash/forecast'

export type BrandFacts = {
  id: number
  name: string
  target: number
  isDemo: boolean
  /** Invitation → review conversion from this brand's campaigns, 0..1, or null without data. */
  conversion: number | null
  platforms: PlatformFacts[]
}

/** Everything the calculator needs, per brand, from the brand's own data. */
export function getBrandFacts(brandIds: number[]): BrandFacts[] {
  const since = addDays(weekStart(), -56)
  return brandIds.map((brandId) => {
    const brand = get<{ name: string; target_rating: number; is_demo: number }>(
      'SELECT name, target_rating, is_demo FROM brands WHERE id = ?',
      brandId,
    )!
    const latest = all<{ platform: string; rating: number; review_count: number; week_start: string }>(
      `SELECT e.platform, e.rating, e.review_count, e.week_start FROM entries e
        WHERE e.brand_id = ?
          AND e.week_start = (SELECT MAX(x.week_start) FROM entries x WHERE x.brand_id = e.brand_id AND x.platform = e.platform)
        ORDER BY e.review_count DESC`,
      brandId,
    )
    const subs = all<{ platform: string | null; amount: number; billing_cycle: string }>(
      "SELECT platform, amount, billing_cycle FROM subscriptions WHERE brand_id = ? AND status = 'active' AND currency = 'USD'",
      brandId,
    )
    const conv = get<{ sent: number; received: number }>(
      "SELECT COALESCE(SUM(invites_sent), 0) AS sent, COALESCE(SUM(reviews_received), 0) AS received FROM campaigns WHERE brand_id = ? AND status != 'planned'",
      brandId,
    )!

    const platforms = latest.map((l): PlatformFacts => {
      const before = get<{ rating: number; review_count: number; week_start: string }>(
        'SELECT rating, review_count, week_start FROM entries WHERE brand_id = ? AND platform = ? AND week_start <= ? ORDER BY week_start DESC LIMIT 1',
        brandId,
        l.platform,
        since,
      )
      const added = before ? l.review_count - before.review_count : 0
      const weeks = before ? Math.max(1, Math.round((Date.parse(l.week_start) - Date.parse(before.week_start)) / (7 * 864e5))) : 0
      const implied =
        before && added > 0
          ? Math.min(5, Math.max(1, (l.rating * l.review_count - before.rating * before.review_count) / added))
          : null
      const stars = all<{ rating: number; n: number }>(
        `SELECT rating, COUNT(*) AS n FROM reviews
          WHERE brand_id = ? AND platform = ? AND suspicious = 0 AND rating IS NOT NULL GROUP BY rating`,
        brandId,
        l.platform,
      )
      const starTotal = stars.reduce((s, r) => s + r.n, 0)
      const starShares =
        starTotal >= 5
          ? ([5, 4, 3, 2, 1].map((star) => Math.round(((stars.find((r) => r.rating === star)?.n ?? 0) / starTotal) * 100)) as PlatformFacts['starShares'])
          : null
      return {
        starShares,
        platform: l.platform,
        rating: l.rating,
        count: l.review_count,
        week: l.week_start,
        impliedAvg: implied,
        pace: weeks ? Math.max(0, added / weeks) : 0,
        subscription: subs
          .filter((s) => s.platform === l.platform)
          .reduce((sum, s) => sum + monthlyEquivalent(s.amount, s.billing_cycle), 0),
      }
    })

    return {
      id: brandId,
      name: brand.name,
      target: brand.target_rating,
      isDemo: Boolean(brand.is_demo),
      conversion: conv.sent > 0 ? conv.received / conv.sent : null,
      platforms,
    }
  })
}

export type SavedPlan = { conversion: number; rows: PlanRow[] }

export function getSavedPlans(brandIds: number[], quarter: string): Record<number, SavedPlan> {
  if (brandIds.length === 0) return {}
  const rows = all<{ brand_id: number; data: string }>(
    `SELECT brand_id, data FROM forecast_plans WHERE quarter = ? AND brand_id IN (${brandIds.map(() => '?').join(',')})`,
    quarter,
    ...brandIds,
  )
  const plans: Record<number, SavedPlan> = {}
  for (const r of rows) {
    try {
      plans[r.brand_id] = JSON.parse(r.data) as SavedPlan
    } catch {
      // A corrupt plan is ignored; the calculator falls back to defaults.
    }
  }
  return plans
}
