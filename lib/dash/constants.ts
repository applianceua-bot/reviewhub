/** Labels and lookups shared by the cabinet, the admin panel and the landing demo. */

import { reviewPlatforms, igamingPlatforms, cryptoPlatforms, fintechPlatforms, blogPlatforms } from '@/lib/site'

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)']

/**
 * Two platforms clients get reviewed on that the landing page's pricing
 * calculator doesn't sell publications for, so they live only here.
 */
const APP_STORE_PLATFORMS = [
  { id: 'appstore', name: 'App Store', domain: 'apple.com' },
  { id: 'googleplay', name: 'Google Play', domain: 'play.google.com' },
]

const CATEGORIES = [
  { label: 'Отзывы', platforms: reviewPlatforms },
  { label: 'iGaming', platforms: igamingPlatforms },
  { label: 'Crypto', platforms: cryptoPlatforms },
  { label: 'Fintech', platforms: fintechPlatforms },
  { label: 'Сообщества', platforms: blogPlatforms },
  { label: 'App Store', platforms: APP_STORE_PLATFORMS },
]

/**
 * Every platform selectable in the cabinet and admin panel's data-entry
 * forms. Built from lib/site.ts's platform catalog — the landing page's
 * pricing calculator and the "Площадки" section — so this list can't drift
 * out of sync with what's shown to prospects, plus APP_STORE_PLATFORMS above.
 * `category` groups the catalog when picking a brand's platforms (see
 * components/dash/admin/brand-platforms.tsx).
 */
export const PLATFORMS = CATEGORIES.flatMap((c) => c.platforms.map((p) => ({ ...p, category: c.label }))).map((p, i) => ({
  key: p.id,
  name: p.name,
  domain: p.domain,
  category: p.category,
  color: CHART_COLORS[i % CHART_COLORS.length],
  // Only the landing catalog sells publications; APP_STORE_PLATFORMS has none.
  basePrice: 'basePrice' in p ? p.basePrice : null,
}))

export type PlatformKey = (typeof PLATFORMS)[number]['key']

export function platformName(key: string) {
  return PLATFORMS.find((p) => p.key === key)?.name ?? key
}

export function platformColor(key: string) {
  return PLATFORMS.find((p) => p.key === key)?.color ?? 'var(--chart-5)'
}

/** Price per publication at volume 1–49, or null for platforms we don't sell publications on (App Store, Google Play). */
export function platformBasePrice(key: string): number | null {
  return PLATFORMS.find((p) => p.key === key)?.basePrice ?? null
}

/** Resolves a platform typed by hand or exported from another tool ("review.io", "Hellopeter") to its key. */
export function matchPlatform(value: string | undefined) {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[\s.]/g, '')
  const v = normalize(value ?? '')
  if (!v) return null
  const aliases: Record<string, string> = {
    reviewio: 'reviewsio',
    sitejabber: 'smartcustomer',
    google: 'gmb',
    googlereviews: 'gmb',
    googlebusiness: 'gmb',
    googlebusinessprofile: 'gmb',
  }
  const key = aliases[v] ?? v
  return PLATFORMS.find((p) => p.key === key || normalize(p.name) === key)?.key ?? null
}

export const MENTION_PLATFORMS = ['Reddit', 'Quora', 'X', 'Форум', 'СМИ', 'Блог'] as const

/** Platforms with an official API we can sync from (see Integrations). */
/**
 * Platforms with a real API a business can self-serve (own API key, no
 * partner/rep relationship needed) for pulling or replying to reviews.
 * Checked against each platform's current developer docs — see
 * app/admin/integrations/page.tsx for per-platform field hints and caveats.
 * Deliberately excluded: G2/Capterra/GetApp (review API is partner-gated,
 * no self-serve key), TrustRadius, BBB-style complaint boards, iGaming
 * complaint boards (Casino.Guru, AskGamblers, Casinomeister, LCB), Quora
 * (no content API, only their unrelated Poe product) — none of these offer
 * a self-serve developer key today.
 */
export const API_PLATFORMS = [
  'trustpilot',
  'reviewsio',
  'hellopeter',
  'smartcustomer',
  'gmb',
  'yelp',
  'appstore',
  'googleplay',
  'feefo',
  'trustedshops',
  'ekomi',
] as const

export const SENTIMENT_LABEL: Record<string, string> = {
  positive: 'Позитив',
  neutral: 'Нейтрально',
  negative: 'Негатив',
}

export const MENTION_STATUS_LABEL: Record<string, string> = {
  needs_response: 'Нужен ответ',
  responded: 'Ответили',
  monitoring: 'Наблюдаем',
  resolved: 'Решено',
}

export const REPLY_STATUS_LABEL: Record<string, string> = {
  none: 'Без ответа',
  draft: 'Черновик',
  approved: 'Согласован',
  published: 'Опубликован',
}

export const SUSPICION_REASONS = [
  'Реклама стороннего ресурса',
  'Шаблонный текст',
  'Новый аккаунт без истории',
  'Накрутка негатива',
  'Не клиент компании',
  'Оскорбления',
] as const

export const LINK_STATUS_LABEL: Record<string, string> = {
  live: 'Живой',
  removed: 'Удалён',
  unknown: 'Неизвестно',
}

export const REVIEW_TYPE_LABEL: Record<string, string> = {
  real: 'настоящий',
  fake: 'фейковый',
  unknown: 'неизвестно',
}

export const TASK_KIND_LABEL: Record<string, string> = {
  invitations: 'Приглашения',
  replies: 'Ответы',
  complaints: 'Контроль удаления',
  content: 'Контент',
  monitoring: 'Мониторинг',
  other: 'Другое',
}

export const TASK_STATUS_LABEL: Record<string, string> = {
  todo: 'Запланировано',
  in_progress: 'В работе',
  done: 'Готово',
}

export const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  planned: 'Запланирована',
  active: 'Идёт',
  finished: 'Завершена',
}

export const EXPENSE_CATEGORY_LABEL: Record<string, string> = {
  subscription: 'Подписки',
  contractor: 'Подрядчики',
  other: 'Прочее',
}

export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  active: 'Активна',
  paused: 'Приостановлена',
  cancelled: 'Отменена',
}

export const BILLING_CYCLE_LABEL: Record<string, string> = {
  monthly: 'Ежемесячно',
  yearly: 'Ежегодно',
  one_time: 'Разово',
}

export const CURRENCIES = ['USD', 'EUR', 'RUB'] as const

export function monthlyEquivalent(amount: number, cycle: string) {
  if (cycle === 'yearly') return amount / 12
  if (cycle === 'one_time') return 0
  return amount
}
