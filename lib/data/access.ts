import 'server-only'
import { notFound } from 'next/navigation'
import { all, get } from '@/lib/db'
import type { SessionUser } from '@/lib/auth/session'

export type Brand = {
  id: number
  name: string
  domain: string | null
  niche: string | null
  target_rating: number
  is_demo: number
}

/** Brands a user may see: every brand for an admin, assigned brands for a client. */
export function accessibleBrands(user: SessionUser): Brand[] {
  if (user.role === 'admin') {
    return all<Brand>('SELECT * FROM brands ORDER BY name')
  }
  return all<Brand>(
    `SELECT b.* FROM brands b
       JOIN client_brands cb ON cb.brand_id = b.id
      WHERE cb.user_id = ?
      ORDER BY b.name`,
    user.id,
  )
}

export function canAccessBrand(user: SessionUser, brandId: number) {
  if (user.role === 'admin') return Boolean(get('SELECT 1 FROM brands WHERE id = ?', brandId))
  return Boolean(
    get('SELECT 1 FROM client_brands WHERE user_id = ? AND brand_id = ?', user.id, brandId),
  )
}

/**
 * Resolves the brand selected via ?brand=<id>. An id the user can't access
 * is a 404, so a client can't probe other clients' brands. With no id, the
 * first accessible brand is used.
 */
export function selectBrand(user: SessionUser, raw: string | string[] | undefined) {
  const brands = accessibleBrands(user)
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return { brands, brand: brands[0] ?? null }
  const brand = brands.find((b) => String(b.id) === value)
  if (!brand) notFound()
  return { brands, brand }
}
