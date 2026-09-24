import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * scrypt password hashing, stored as "scrypt$<salt hex>$<hash hex>".
 * No imports beyond node:crypto so scripts/*.mjs can use it too.
 */

const KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, KEY_LENGTH)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return timingSafeEqual(actual, expected)
}

/** A readable random password for new client accounts. */
export function generatePassword(length = 12) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)]
  return out
}

export const MIN_PASSWORD_LENGTH = 8
