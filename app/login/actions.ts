'use server'

import { redirect } from 'next/navigation'
import { get } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, destroySession } from '@/lib/auth/session'

export type LoginState = { error?: string }

// Simple per-login throttle against password guessing (in-memory, per process).
const attempts = new Map<string, { count: number; until: number }>()
const MAX_ATTEMPTS = 5
const LOCK_MS = 10 * 60 * 1000

/** Only same-site relative paths are allowed as a post-login destination. */
function safeNext(value: FormDataEntryValue | null, role: 'admin' | 'client') {
  const fallback = role === 'admin' ? '/admin' : '/cabinet'
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback
  if (role === 'client' && !value.startsWith('/cabinet')) return fallback
  if (!value.startsWith('/cabinet') && !value.startsWith('/admin')) return fallback
  return value
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const loginName = String(formData.get('login') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!loginName || !password) return { error: 'Введите логин и пароль.' }

  const now = Date.now()
  const record = attempts.get(loginName)
  if (record && record.count >= MAX_ATTEMPTS && record.until > now) {
    return { error: 'Слишком много попыток. Попробуйте через 10 минут.' }
  }

  const user = get<{ id: number; password_hash: string; role: 'admin' | 'client'; active: number }>(
    'SELECT id, password_hash, role, active FROM users WHERE login = ?',
    loginName,
  )

  if (!user || !user.active || !verifyPassword(password, user.password_hash)) {
    const count = record && record.until > now ? record.count + 1 : 1
    attempts.set(loginName, { count, until: now + LOCK_MS })
    return { error: 'Неверный логин или пароль.' }
  }

  attempts.delete(loginName)
  await createSession(user.id)
  redirect(safeNext(formData.get('next'), user.role))
}

export async function logout() {
  await destroySession()
  redirect('/login')
}
