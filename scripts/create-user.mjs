// Creates a user or resets an existing user's password.
//
//   npm run user:create -- <login> <password> [admin|client] [Имя]
//
// Uses the same schema and hashing as the app (loaded straight from the .ts
// sources via Node's type stripping).
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { MIGRATIONS, SCHEMA } from '../lib/db/schema.ts'
import { hashPassword, MIN_PASSWORD_LENGTH } from '../lib/auth/password.ts'

const [login, password, role = 'admin', ...nameParts] = process.argv.slice(2)

if (!login || !password) {
  console.error('Использование: npm run user:create -- <логин> <пароль> [admin|client] [Имя]')
  process.exit(1)
}
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов.`)
  process.exit(1)
}
if (role !== 'admin' && role !== 'client') {
  console.error('Роль: admin или client.')
  process.exit(1)
}

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'reviewhub.db')
mkdirSync(path.dirname(dbPath), { recursive: true })
const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true })
db.exec(SCHEMA)
for (const [table, column, definition] of MIGRATIONS) {
  if (!db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

const name = nameParts.join(' ') || login
const existing = db.prepare('SELECT id FROM users WHERE login = ?').get(login)

if (existing) {
  db.prepare('UPDATE users SET password_hash = ?, role = ?, active = 1 WHERE id = ?').run(
    hashPassword(password),
    role,
    existing.id,
  )
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(existing.id)
  console.log(`Пользователь «${login}» обновлён: новый пароль, роль ${role}.`)
} else {
  db.prepare('INSERT INTO users (login, name, password_hash, role) VALUES (?, ?, ?, ?)').run(
    login,
    name,
    hashPassword(password),
    role,
  )
  console.log(`Создан пользователь «${login}» с ролью ${role}.`)
}
