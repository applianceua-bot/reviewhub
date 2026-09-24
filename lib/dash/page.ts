import 'server-only'
import { requireAdmin, requireUser } from '@/lib/auth/session'
import { selectBrand } from '@/lib/data/access'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/**
 * Common setup for a brand-scoped page: checks the session (layouts alone
 * don't re-run on every navigation), resolves the selected brand the user is
 * allowed to see, and builds the "back" URL forms return to.
 */
export async function brandPage(searchParams: SearchParams, path: string, { admin = false } = {}) {
  const user = admin ? await requireAdmin() : await requireUser()
  const sp = await searchParams
  const { brands, brand } = selectBrand(user, sp.brand)
  const back = brand ? `${path}?brand=${brand.id}` : path
  return { user, brands, brand, back, sp, ok: first(sp.ok), error: first(sp.error) }
}

export { first as firstParam }
