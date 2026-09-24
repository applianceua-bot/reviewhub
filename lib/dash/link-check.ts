import 'server-only'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * Checks whether a review link still opens on the platform — ported from
 * repcontrol's lib/link-check.ts (generic HTTP check). 404/410 or a
 * "review removed" page means removed; blocks, rate limits and errors stay
 * "unknown" rather than guessing. Pages behind Cloudflare challenges
 * (often Trustpilot) come back "unknown" too.
 */

export type LinkStatus = 'live' | 'removed' | 'unknown'

const TIMEOUT_MS = 8000
const REMOVED_PHRASES = [
  'review not found',
  'review has been removed',
  'this review has been removed',
  'content not found',
  'page not found',
  "this page doesn't exist",
  'отзыв удален',
  'отзыв удалён',
]
const CHALLENGE_PHRASES = ['just a moment', 'checking your browser', 'attention required', 'cf-browser-verification']

function isPrivateAddress(ip: string) {
  if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip
  const parts = v4.split('.').map(Number)
  if (parts.length !== 4) return false
  const [a, b] = parts
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
}

/** Only public http(s) hosts — the server must not be steered into the local network. */
async function isPublicUrl(raw: string) {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  if (url.hostname === 'localhost') return false
  try {
    const addresses = isIP(url.hostname) ? [{ address: url.hostname }] : await lookup(url.hostname, { all: true })
    return addresses.length > 0 && addresses.every((a) => !isPrivateAddress(a.address))
  } catch {
    return false
  }
}

const MAX_REDIRECTS = 5

export async function checkLinkStatus(url: string): Promise<LinkStatus> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    // Redirects are followed by hand so every hop gets the same public-host check.
    let current = url
    let res: Response | null = null
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isPublicUrl(current))) return 'unknown'
      res = await fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      const location = res.headers.get('location')
      if (res.status < 300 || res.status >= 400 || !location) break
      current = new URL(location, current).toString()
      res = null
    }
    if (!res) return 'unknown'
    if (res.status === 404 || res.status === 410) return 'removed'
    if (!res.ok) return 'unknown'
    const lower = (await res.text().catch(() => '')).slice(0, 20000).toLowerCase()
    if (CHALLENGE_PHRASES.some((p) => lower.includes(p))) return 'unknown'
    if (REMOVED_PHRASES.some((p) => lower.includes(p))) return 'removed'
    return 'live'
  } catch {
    return 'unknown'
  } finally {
    clearTimeout(timer)
  }
}

/** Checks links with limited parallelism. */
export async function checkLinks<T extends { id: number; url: string }>(items: T[], concurrency = 5) {
  const results = new Map<number, LinkStatus>()
  let next = 0
  async function worker() {
    while (next < items.length) {
      const item = items[next++]
      results.set(item.id, await checkLinkStatus(item.url))
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}
