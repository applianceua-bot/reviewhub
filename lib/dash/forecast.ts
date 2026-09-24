/**
 * Rating math for the calculator. Plain averages: the platform rating after
 * n new reviews averaging s is (R·C + s·n) / (C + n).
 */

export function projectRating(rating: number, count: number, added: number, avgNew: number) {
  const total = count + added
  return total > 0 ? (rating * count + avgNew * added) / total : rating
}

/** New reviews needed to reach `target`; 0 when already there, null when unreachable at this average. */
export function reviewsNeeded(rating: number, count: number, target: number, avgNew: number) {
  if (rating >= target) return 0
  if (avgNew <= target) return null
  return Math.ceil((count * (target - rating)) / (avgNew - target))
}

/** What happens to the rating if `oneStar` 1★ and `twoStar` 2★ reviews arrive. */
export function riskScenario(rating: number, count: number, oneStar: number, twoStar: number) {
  const added = oneStar + twoStar
  const newCount = count + added
  const ratingWithRisk = newCount > 0 ? (rating * count + oneStar + twoStar * 2) / newCount : rating
  return { ratingWithRisk, ratingDrop: rating - ratingWithRisk, newCount }
}

export type PlanRow = {
  platform: string
  enabled: boolean
  /** manual: reviews per month typed in; target: enough per month to hit the brand's target this quarter. */
  mode: 'manual' | 'target'
  perMonth: number
  avgNew: number
  /** Cost of sending one invitation (email/SMS service), USD. */
  invitePrice: number
  /** Cost of preparing one reply to a review, USD. */
  replyPrice: number
}

export type PlatformFacts = {
  platform: string
  rating: number
  count: number
  week: string
  /** Average of recently added reviews implied by rating movement, or null. */
  impliedAvg: number | null
  /** New reviews per week over the last 8 weeks. */
  pace: number
  /** Active subscription cost per month on this platform for the brand, USD. */
  subscription: number
  /** Share of 5★…1★ among real (not suspicious) reviews in the journal, or null without enough data. */
  starShares: [number, number, number, number, number] | null
}

/** Average new reviews must have so `count` + `added` reviews land exactly on `target`. */
export function requiredAverage(rating: number, count: number, target: number, added: number) {
  return added > 0 ? (target * (count + added) - rating * count) / added : null
}

/** Average of a 5★…1★ distribution given in percent. */
export function averageOfShares(shares: number[]) {
  const total = shares.reduce((s, x) => s + x, 0)
  return total > 0 ? shares.reduce((s, x, i) => s + x * (5 - i), 0) / total : null
}

export type PlanResult = {
  platform: string
  perMonth: number
  quarterReviews: number
  invitesPerMonth: number
  ratingNow: number
  ratingThen: number
  reachable: boolean
  costPerMonth: number
  costPerQuarter: number
}

export function computePlanRow(row: PlanRow, facts: PlatformFacts, target: number, conversion: number): PlanResult {
  let quarterReviews: number
  let reachable = true
  if (row.mode === 'target') {
    const needed = reviewsNeeded(facts.rating, facts.count, target, row.avgNew)
    reachable = needed !== null
    quarterReviews = needed ?? 0
  } else {
    quarterReviews = Math.max(0, Math.round(row.perMonth)) * 3
  }
  const perMonth = Math.ceil(quarterReviews / 3)
  const invitesPerMonth = conversion > 0 ? Math.ceil(perMonth / conversion) : 0
  const costPerMonth = facts.subscription + invitesPerMonth * row.invitePrice + perMonth * row.replyPrice
  return {
    platform: row.platform,
    perMonth,
    quarterReviews,
    invitesPerMonth,
    ratingNow: facts.rating,
    ratingThen: projectRating(facts.rating, facts.count, quarterReviews, row.avgNew),
    reachable,
    costPerMonth,
    costPerQuarter: costPerMonth * 3,
  }
}

export function defaultPlanRow(facts: PlatformFacts): PlanRow {
  return {
    platform: facts.platform,
    enabled: true,
    mode: 'manual',
    perMonth: Math.max(1, Math.round(facts.pace * 4.33)),
    avgNew: Math.round((facts.impliedAvg ?? 4.6) * 100) / 100,
    invitePrice: 0.05,
    replyPrice: 2,
  }
}
