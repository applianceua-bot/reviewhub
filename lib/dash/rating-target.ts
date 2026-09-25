/**
 * How many new reviews at `newRating` stars would lift a platform's
 * review-count-weighted average from `current` (over `count` existing
 * reviews) up to `target`. Same algebra as lib/data/overview.ts's
 * weightedRating: solve (current·count + newRating·x) / (count + x) = target for x.
 * Returns null when it's mathematically impossible — target is at or above
 * newRating, so no amount of reviews at that rating gets there.
 */
export function reviewsNeeded(current: number | null, count: number, target: number, newRating: number): number | null {
  if (current !== null && current >= target) return 0
  if (newRating <= target) return null
  if (current === null || count <= 0) return 1
  return Math.max(1, Math.ceil((count * (target - current)) / (newRating - target)))
}

/** Baseline share of 3★ mixed in even at a high average — a wall of only 5★/4★ reads as suspicious; real ratings almost always have a few 3★ in them. */
const THREE_STAR_SHARE = 0.08

/**
 * Splits `total` publications across 5★/4★/3★ so their own average is
 * exactly `avgRating` (clamped to 3–5). Below a 4★ average it mixes 4★+3★.
 * At or above 4★ it mixes all three, keeping a small organic-looking floor
 * of 3★ — capped by how much room the target leaves so the average still
 * lands exactly on `avgRating` (that room shrinks to zero as the target
 * approaches a literal 5.0, where "no 3★ at all" isn't a compromise, it's
 * the only way to hit that number).
 */
export function splitByAverage(total: number, avgRating: number) {
  if (total <= 0) return { n5: 0, n4: 0, n3: 0 }
  const avg = Math.max(3, Math.min(5, avgRating))
  if (avg >= 4) {
    const maxOrganicN3 = Math.floor((total * (5 - avg)) / 2)
    const n3 = Math.max(0, Math.min(maxOrganicN3, Math.round(total * THREE_STAR_SHARE)))
    const n5 = Math.max(0, Math.min(total - n3, Math.round(total * (avg - 4) + n3)))
    return { n5, n4: total - n3 - n5, n3 }
  }
  const n4 = Math.max(0, Math.min(total, Math.round(total * (avg - 3))))
  return { n5: 0, n4, n3: total - n4 }
}
