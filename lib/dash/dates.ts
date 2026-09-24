/**
 * Dates are stored as local 'YYYY-MM-DD' strings. They are built from local
 * date parts, never toISOString(), which shifts days in UTC+ timezones.
 */

export function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today() {
  return toDateKey(new Date())
}

/** Monday of the week that contains `date`. */
export function weekStart(date: Date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return toDateKey(d)
}

export function addDays(key: string, days: number) {
  const d = fromDateKey(key)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

export function quarterOf(key: string) {
  const d = fromDateKey(key)
  const q = Math.floor(d.getMonth() / 3)
  const start = new Date(d.getFullYear(), q * 3, 1)
  const end = new Date(d.getFullYear(), q * 3 + 3, 0)
  return { label: `Q${q + 1} ${d.getFullYear()}`, start: toDateKey(start), end: toDateKey(end) }
}

export function previousQuarter(key: string) {
  const { start } = quarterOf(key)
  return quarterOf(addDays(start, -1))
}

const shortFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const longFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

export function formatShort(key: string) {
  return shortFormat.format(fromDateKey(key)).replace('.', '')
}

export function formatLong(key: string) {
  return longFormat.format(fromDateKey(key))
}

export function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(fromDateKey(value).getTime())
}
