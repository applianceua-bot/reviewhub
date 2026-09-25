import type { MetadataRoute } from 'next'

/**
 * Defense in depth alongside the per-page `robots: { index: false }` on
 * /admin, /cabinet and /login — noindex still lets crawlers fetch those
 * pages, this stops well-behaved crawlers from requesting them at all.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/cabinet', '/login'],
    },
  }
}
