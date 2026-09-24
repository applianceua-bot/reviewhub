import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash, randomBytes } from 'node:crypto'
import { get, run } from '@/lib/db'

export const SESSION_COOKIE = 'rr_session'
const SESSION_DAYS = 14

export type SessionUser = {
  id: number
  login: string
  name: string
  role: 'admin' | 'client'
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  run(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
    hashToken(token),
    userId,
    expires.toISOString(),
  )
  // Drop this user's expired sessions while we're here.
  run('DELETE FROM sessions WHERE user_id = ? AND expires_at < ?', userId, new Date().toISOString())

  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  })
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) run('DELETE FROM sessions WHERE token_hash = ?', hashToken(token))
  jar.delete(SESSION_COOKIE)
}

/** The signed-in user, or null. Cached per request. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const row = get<SessionUser & { expires_at: string }>(
    `SELECT u.id, u.login, u.name, u.role, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND u.active = 1`,
    hashToken(token),
  )
  if (!row || row.expires_at < new Date().toISOString()) return null
  return { id: row.id, login: row.login, name: row.name, role: row.role }
})

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/cabinet')
  return user
}

/** Ends every session of a user, e.g. after a password reset or deactivation. */
export function revokeSessions(userId: number) {
  run('DELETE FROM sessions WHERE user_id = ?', userId)
}
