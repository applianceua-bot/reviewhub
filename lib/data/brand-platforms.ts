import 'server-only'
import { all } from '@/lib/db'
import { PLATFORMS } from '@/lib/dash/constants'

export type BrandPlatform = (typeof PLATFORMS)[number]

/**
 * A brand's platform keys in the order chosen for it in admin (drag-to-reorder
 * on the brands page). Brands that haven't been curated yet — created before
 * this feature, or simply not set up — fall back to whatever platforms
 * already have data, so nothing already entered disappears from the forms.
 */
export function brandPlatformKeys(brandId: number): string[] {
  const chosen = all<{ platform: string }>('SELECT platform FROM brand_platforms WHERE brand_id = ? ORDER BY sort_order', brandId)
  if (chosen.length > 0) return chosen.map((r) => r.platform)
  return all<{ platform: string }>(
    `SELECT platform FROM entries WHERE brand_id = ?
     UNION SELECT platform FROM reviews WHERE brand_id = ?
     UNION SELECT platform FROM removal_checks WHERE brand_id = ?`,
    brandId,
    brandId,
    brandId,
  ).map((r) => r.platform)
}

/** Same as brandPlatformKeys, resolved to full catalog entries (name, domain, color). */
export function brandPlatforms(brandId: number): BrandPlatform[] {
  const byKey = new Map(PLATFORMS.map((p) => [p.key, p]))
  return brandPlatformKeys(brandId)
    .map((key) => byKey.get(key))
    .filter((p): p is BrandPlatform => Boolean(p))
}
