import { Onest } from 'next/font/google'

/**
 * Dashboard typeface. SalesOps uses DM Sans, which has no Cyrillic, so the
 * cabinet uses Onest — a close geometric grotesque that covers Russian.
 */
export const dashFont = Onest({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-dash',
  display: 'swap',
})
