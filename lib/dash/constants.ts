/** Labels and lookups shared by the cabinet, the admin panel and the landing demo. */

export const PLATFORMS = [
  { key: 'trustpilot', name: 'Trustpilot', domain: 'trustpilot.com', color: 'var(--chart-2)' },
  { key: 'google', name: 'Google', domain: 'google.com', color: 'var(--chart-1)' },
  { key: 'smartcustomer', name: 'SmartCustomer', domain: 'smartcustomer.com', color: 'var(--chart-3)' },
  { key: 'reviewsio', name: 'Reviews.io', domain: 'reviews.io', color: 'var(--chart-5)' },
  { key: 'hellopeter', name: 'Hellopeter', domain: 'hellopeter.com', color: 'var(--chart-4)' },
  { key: 'g2', name: 'G2', domain: 'g2.com', color: 'var(--chart-6)' },
  { key: 'capterra', name: 'Capterra', domain: 'capterra.com', color: 'var(--chart-2)' },
  { key: 'appstore', name: 'App Store', domain: 'apple.com', color: 'var(--chart-1)' },
  { key: 'googleplay', name: 'Google Play', domain: 'play.google.com', color: 'var(--chart-3)' },
  { key: 'pissedconsumer', name: 'PissedConsumer', domain: 'pissedconsumer.com', color: 'var(--chart-4)' },
  { key: 'realreviews', name: 'RealReviews', domain: 'realreviews.io', color: 'var(--chart-5)' },
] as const

export type PlatformKey = (typeof PLATFORMS)[number]['key']

export function platformName(key: string) {
  return PLATFORMS.find((p) => p.key === key)?.name ?? key
}

export function platformColor(key: string) {
  return PLATFORMS.find((p) => p.key === key)?.color ?? 'var(--chart-5)'
}

/** Resolves a platform typed by hand or exported from another tool ("review.io", "Hellopeter") to its key. */
export function matchPlatform(value: string | undefined) {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[\s.]/g, '')
  const v = normalize(value ?? '')
  if (!v) return null
  const aliases: Record<string, string> = { reviewio: 'reviewsio', sitejabber: 'smartcustomer', googlereviews: 'google' }
  const key = aliases[v] ?? v
  return PLATFORMS.find((p) => p.key === key || normalize(p.name) === key)?.key ?? null
}

export const MENTION_PLATFORMS = ['Reddit', 'Quora', 'X', 'Форум', 'СМИ', 'Блог'] as const

/** Platforms with an official API we can sync from (see Integrations). */
export const API_PLATFORMS = ['trustpilot', 'reviewsio', 'hellopeter', 'smartcustomer'] as const

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
