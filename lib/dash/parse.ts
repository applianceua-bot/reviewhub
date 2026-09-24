import 'server-only'
import { isValidDateKey } from '@/lib/dash/dates'

/** FormData readers that throw FormError with a user-facing message. */

export class FormError extends Error {}

export function text(fd: FormData, key: string, { required = false, max = 500 } = {}) {
  const value = String(fd.get(key) ?? '').trim()
  if (required && !value) throw new FormError('Заполните обязательные поля.')
  if (value.length > max) throw new FormError('Слишком длинное значение.')
  return value || null
}

export function requiredText(fd: FormData, key: string, max = 500) {
  return text(fd, key, { required: true, max }) as string
}

export function number(fd: FormData, key: string, { min = -Infinity, max = Infinity, required = true } = {}) {
  const raw = String(fd.get(key) ?? '').trim().replace(',', '.')
  if (!raw) {
    if (required) throw new FormError('Заполните обязательные поля.')
    return null
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value < min || value > max) throw new FormError('Проверьте числовые значения.')
  return value
}

export function integer(fd: FormData, key: string, opts: { min?: number; max?: number; required?: boolean } = {}) {
  const value = number(fd, key, opts)
  if (value !== null && !Number.isInteger(value)) throw new FormError('Ожидается целое число.')
  return value
}

export function date(fd: FormData, key: string, { required = true } = {}) {
  const value = String(fd.get(key) ?? '').trim()
  if (!value) {
    if (required) throw new FormError('Укажите дату.')
    return null
  }
  if (!isValidDateKey(value)) throw new FormError('Неверная дата.')
  return value
}

export function oneOf<T extends string>(fd: FormData, key: string, allowed: readonly T[], fallback?: T): T {
  const value = String(fd.get(key) ?? '')
  if ((allowed as readonly string[]).includes(value)) return value as T
  if (fallback !== undefined) return fallback
  throw new FormError('Недопустимое значение.')
}

export function url(fd: FormData, key: string, { required = false } = {}) {
  const value = text(fd, key, { required, max: 1000 })
  if (!value) return null
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error()
    return parsed.toString()
  } catch {
    throw new FormError('Ссылка должна начинаться с http:// или https://')
  }
}

export function id(fd: FormData, key = 'id') {
  const value = Number(fd.get(key))
  if (!Number.isInteger(value) || value <= 0) throw new FormError('Запись не найдена.')
  return value
}
