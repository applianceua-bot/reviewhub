import 'server-only'
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { MIGRATIONS, SCHEMA } from './schema'

/**
 * Local SQLite database for the client cabinet and admin panel.
 *
 * Everything outside lib/db and lib/data talks to the data layer, never to
 * SQLite directly, so the storage can later move to Supabase/Postgres by
 * rewriting only these modules.
 */

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'reviewhub.db')

const globalForDb = globalThis as unknown as { __reviewhubDb?: DatabaseSync }

function open() {
  mkdirSync(path.dirname(DB_PATH), { recursive: true })
  const db = new DatabaseSync(DB_PATH, { enableForeignKeyConstraints: true })
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec(SCHEMA)
  migrate(db)
  return db
}

export function migrate(db: DatabaseSync) {
  for (const [table, column, definition] of MIGRATIONS) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
    if (!columns.some((c) => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

/** One shared connection per server process (survives dev hot reloads). */
export function db() {
  globalForDb.__reviewhubDb ??= open()
  return globalForDb.__reviewhubDb
}

type Param = string | number | null

// node:sqlite returns null-prototype rows; React only passes plain objects to client components.
const plain = <T>(row: unknown) => ({ ...(row as object) }) as T

export function all<T>(sql: string, ...params: Param[]): T[] {
  return db().prepare(sql).all(...params).map((row) => plain<T>(row))
}

export function get<T>(sql: string, ...params: Param[]): T | undefined {
  const row = db().prepare(sql).get(...params)
  return row === undefined ? undefined : plain<T>(row)
}

export function run(sql: string, ...params: Param[]) {
  const result = db().prepare(sql).run(...params)
  return { changes: Number(result.changes), id: Number(result.lastInsertRowid) }
}

export function transaction<T>(fn: () => T): T {
  const conn = db()
  conn.exec('BEGIN')
  try {
    const value = fn()
    conn.exec('COMMIT')
    return value
  } catch (error) {
    conn.exec('ROLLBACK')
    throw error
  }
}
