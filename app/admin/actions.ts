'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { get, run, transaction } from '@/lib/db'
import { requireAdmin, revokeSessions } from '@/lib/auth/session'
import { generatePassword, hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth/password'
import { PLATFORMS, SUSPICION_REASONS, platformName } from '@/lib/dash/constants'
import { weekStart, fromDateKey, today } from '@/lib/dash/dates'
import { date, FormError, id, integer, number, oneOf, requiredText, text, url } from '@/lib/dash/parse'

/*
 * Every admin mutation. Each one re-checks the admin role on the server —
 * the page being hidden from clients is not the protection, this is.
 * Forms send a hidden "back" field; after the change we return there with
 * ?ok= or ?error= for the flash message.
 */

const PLATFORM_KEYS = PLATFORMS.map((p) => p.key)

function backPath(fd: FormData) {
  const back = String(fd.get('back') ?? '')
  return back.startsWith('/admin') && !back.startsWith('//') ? back : '/admin'
}

function withFlash(path: string, key: 'ok' | 'error', message: string) {
  const [pathname, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  params.delete('ok')
  params.delete('error')
  params.set(key, message)
  return `${pathname}?${params}`
}

async function handle(fd: FormData, okMessage: string | null, fn: () => void) {
  await requireAdmin()
  const back = backPath(fd)
  try {
    fn()
  } catch (error) {
    if (error instanceof FormError) redirect(withFlash(back, 'error', error.message))
    if (error instanceof Error && /UNIQUE constraint/.test(error.message)) {
      redirect(withFlash(back, 'error', 'Такая запись уже существует.'))
    }
    throw error
  }
  revalidatePath('/admin', 'layout')
  revalidatePath('/cabinet', 'layout')
  redirect(okMessage ? withFlash(back, 'ok', okMessage) : back.replace(/([?&])(ok|error)=[^&]*/g, '$1'))
}

function platform(fd: FormData) {
  return oneOf(fd, 'platform', PLATFORM_KEYS)
}

function brandId(fd: FormData) {
  const value = id(fd, 'brand_id')
  if (!get('SELECT 1 FROM brands WHERE id = ?', value)) throw new FormError('Бренд не найден.')
  return value
}

// ── Brands ────────────────────────────────────────────────────────

export async function saveBrand(fd: FormData) {
  const existing = fd.get('id') ? id(fd) : null
  await handle(fd, existing ? 'Бренд обновлён.' : 'Бренд добавлен.', () => {
    const name = requiredText(fd, 'name', 120)
    const domain = text(fd, 'domain', { max: 200 })
    const niche = text(fd, 'niche', { max: 80 })
    const target = number(fd, 'target_rating', { min: 1, max: 5 })!
    if (existing) {
      run('UPDATE brands SET name = ?, domain = ?, niche = ?, target_rating = ? WHERE id = ?', name, domain, niche, target, existing)
    } else {
      run('INSERT INTO brands (name, domain, niche, target_rating) VALUES (?, ?, ?, ?)', name, domain, niche, target)
    }
  })
}

export async function deleteBrand(fd: FormData) {
  await handle(fd, 'Бренд и все его данные удалены.', () => {
    run('DELETE FROM brands WHERE id = ?', id(fd))
  })
}

// ── Clients ───────────────────────────────────────────────────────

export type CredentialsState = { error?: string; login?: string; password?: string }

function validLogin(value: string) {
  if (!/^[a-z0-9._-]{3,40}$/.test(value)) {
    throw new FormError('Логин: 3–40 символов, латиница, цифры, точка, дефис или подчёркивание.')
  }
  return value
}

/** Creates a client and returns the generated password once — it is never stored in plain text. */
export async function createClient(_prev: CredentialsState, fd: FormData): Promise<CredentialsState> {
  await requireAdmin()
  try {
    const login = validLogin(requiredText(fd, 'login', 40).toLowerCase())
    const name = requiredText(fd, 'name', 120)
    const role = oneOf(fd, 'role', ['client', 'admin'] as const, 'client')
    if (get('SELECT 1 FROM users WHERE login = ?', login)) throw new FormError('Такой логин уже занят.')
    const password = generatePassword()
    const brandIds = fd.getAll('brands').map(Number).filter((n) => Number.isInteger(n) && n > 0)
    transaction(() => {
      const { id: userId } = run(
        'INSERT INTO users (login, name, password_hash, role) VALUES (?, ?, ?, ?)',
        login,
        name,
        hashPassword(password),
        role,
      )
      for (const b of brandIds) run('INSERT OR IGNORE INTO client_brands (user_id, brand_id) SELECT ?, id FROM brands WHERE id = ?', userId, b)
    })
    revalidatePath('/admin/clients')
    return { login, password }
  } catch (error) {
    if (error instanceof FormError) return { error: error.message }
    throw error
  }
}

export async function resetPassword(_prev: CredentialsState, fd: FormData): Promise<CredentialsState> {
  await requireAdmin()
  try {
    const userId = id(fd)
    const user = get<{ login: string }>('SELECT login FROM users WHERE id = ?', userId)
    if (!user) throw new FormError('Пользователь не найден.')
    const custom = String(fd.get('password') ?? '')
    if (custom && custom.length < MIN_PASSWORD_LENGTH) throw new FormError(`Пароль — не короче ${MIN_PASSWORD_LENGTH} символов.`)
    const password = custom || generatePassword()
    run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(password), userId)
    revokeSessions(userId)
    return { login: user.login, password }
  } catch (error) {
    if (error instanceof FormError) return { error: error.message }
    throw error
  }
}

export async function saveClientBrands(fd: FormData) {
  await handle(fd, 'Доступ к брендам обновлён.', () => {
    const userId = id(fd, 'user_id')
    const brandIds = fd.getAll('brands').map(Number).filter((n) => Number.isInteger(n) && n > 0)
    transaction(() => {
      run('DELETE FROM client_brands WHERE user_id = ?', userId)
      for (const b of brandIds) run('INSERT OR IGNORE INTO client_brands (user_id, brand_id) SELECT ?, id FROM brands WHERE id = ?', userId, b)
    })
  })
}

export async function setClientActive(fd: FormData) {
  const me = await requireAdmin()
  const userId = id(fd, 'user_id')
  const active = fd.get('active') === '1'
  await handle(fd, active ? 'Доступ включён.' : 'Доступ отключён.', () => {
    if (userId === me.id) throw new FormError('Нельзя отключить собственную учётную запись.')
    run('UPDATE users SET active = ? WHERE id = ?', active ? 1 : 0, userId)
    if (!active) revokeSessions(userId)
  })
}

export async function deleteClient(fd: FormData) {
  const me = await requireAdmin()
  await handle(fd, 'Пользователь удалён.', () => {
    const userId = id(fd, 'user_id')
    if (userId === me.id) throw new FormError('Нельзя удалить собственную учётную запись.')
    run('DELETE FROM users WHERE id = ?', userId)
  })
}

// ── Weekly data entry ─────────────────────────────────────────────

export async function saveEntries(fd: FormData) {
  await handle(fd, 'Данные за неделю сохранены.', () => {
    const brand = brandId(fd)
    const week = weekStart(fromDateKey(date(fd, 'week_start')!))
    let saved = 0
    transaction(() => {
      for (const key of PLATFORM_KEYS) {
        const rating = number(fd, `rating_${key}`, { min: 0, max: 5, required: false })
        const count = integer(fd, `count_${key}`, { min: 0, max: 10_000_000, required: false })
        if (rating === null && count === null) continue
        if (rating === null || count === null) throw new FormError(`${platformName(key)}: укажите и рейтинг, и число отзывов.`)
        run(
          `INSERT INTO entries (brand_id, platform, week_start, rating, review_count) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (brand_id, platform, week_start) DO UPDATE SET rating = excluded.rating, review_count = excluded.review_count`,
          brand,
          key,
          week,
          rating,
          count,
        )
        saved++
      }
    })
    if (!saved) throw new FormError('Заполните хотя бы одну площадку.')
  })
}

export async function deleteEntry(fd: FormData) {
  await handle(fd, 'Запись удалена.', () => run('DELETE FROM entries WHERE id = ?', id(fd)))
}

// ── Reviews ───────────────────────────────────────────────────────

export async function addReview(fd: FormData) {
  await handle(fd, 'Отзыв добавлен.', () => {
    run(
      `INSERT INTO reviews (brand_id, platform, author, rating, text, url, published_at, sentiment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      brandId(fd),
      platform(fd),
      text(fd, 'author', { max: 120 }),
      integer(fd, 'rating', { min: 1, max: 5, required: false }),
      text(fd, 'text', { max: 5000 }),
      url(fd, 'url'),
      date(fd, 'published_at')!,
      oneOf(fd, 'sentiment', ['positive', 'neutral', 'negative'] as const, 'neutral'),
    )
  })
}

export async function markSuspicious(fd: FormData) {
  await handle(fd, null, () => {
    const reason = String(fd.get('reason') ?? '')
    const flagged = reason !== ''
    if (flagged && !(SUSPICION_REASONS as readonly string[]).includes(reason)) throw new FormError('Неизвестная причина.')
    run('UPDATE reviews SET suspicious = ?, suspicion_reason = ? WHERE id = ?', flagged ? 1 : 0, flagged ? reason : null, id(fd))
  })
}

export async function saveReply(fd: FormData) {
  await handle(fd, null, () => {
    run(
      'UPDATE reviews SET reply_status = ?, reply_text = ? WHERE id = ?',
      oneOf(fd, 'reply_status', ['none', 'draft', 'approved', 'published'] as const),
      text(fd, 'reply_text', { max: 5000 }),
      id(fd),
    )
  })
}

export async function deleteReview(fd: FormData) {
  await handle(fd, 'Отзыв удалён.', () => run('DELETE FROM reviews WHERE id = ?', id(fd)))
}

// ── Mentions & keywords ───────────────────────────────────────────

export async function addMention(fd: FormData) {
  await handle(fd, 'Упоминание добавлено.', () => {
    run(
      `INSERT INTO mentions (brand_id, platform, url, title, date, sentiment, status, matched_keyword)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      brandId(fd),
      requiredText(fd, 'platform', 60),
      url(fd, 'url'),
      requiredText(fd, 'title', 300),
      date(fd, 'date')!,
      oneOf(fd, 'sentiment', ['positive', 'neutral', 'negative'] as const, 'neutral'),
      oneOf(fd, 'status', ['needs_response', 'responded', 'monitoring', 'resolved'] as const, 'monitoring'),
      text(fd, 'matched_keyword', { max: 120 }),
    )
  })
}

export async function updateMentionStatus(fd: FormData) {
  await handle(fd, null, () => {
    run(
      'UPDATE mentions SET status = ? WHERE id = ?',
      oneOf(fd, 'status', ['needs_response', 'responded', 'monitoring', 'resolved'] as const),
      id(fd),
    )
  })
}

export async function deleteMention(fd: FormData) {
  await handle(fd, 'Упоминание удалено.', () => run('DELETE FROM mentions WHERE id = ?', id(fd)))
}

export async function addKeyword(fd: FormData) {
  await handle(fd, 'Ключевое слово добавлено.', () => {
    run('INSERT INTO brand_keywords (brand_id, keyword) VALUES (?, ?)', brandId(fd), requiredText(fd, 'keyword', 120))
  })
}

export async function toggleKeyword(fd: FormData) {
  await handle(fd, null, () => run('UPDATE brand_keywords SET active = 1 - active WHERE id = ?', id(fd)))
}

export async function deleteKeyword(fd: FormData) {
  await handle(fd, null, () => run('DELETE FROM brand_keywords WHERE id = ?', id(fd)))
}

// ── Integrations ──────────────────────────────────────────────────

export async function saveConnection(fd: FormData) {
  await handle(fd, 'Настройки подключения сохранены.', () => {
    const brand = brandId(fd)
    const key = platform(fd)
    const businessId = text(fd, 'business_id', { max: 200 })
    const apiKey = String(fd.get('api_key') ?? '').trim()
    const clearKey = fd.get('clear_key') === '1'
    run(
      `INSERT INTO connections (brand_id, platform, connected, business_id, api_key)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (brand_id, platform) DO UPDATE SET
         connected = excluded.connected,
         business_id = excluded.business_id,
         api_key = CASE WHEN ? THEN NULL WHEN excluded.api_key IS NOT NULL THEN excluded.api_key ELSE connections.api_key END,
         updated_at = datetime('now')`,
      brand,
      key,
      businessId ? 1 : 0,
      businessId,
      apiKey || null,
      clearKey ? 1 : 0,
    )
  })
}

// ── Work plan & campaigns ─────────────────────────────────────────

export async function addTask(fd: FormData) {
  await handle(fd, 'Задача добавлена.', () => {
    const platformValue = String(fd.get('platform') ?? '')
    run(
      'INSERT INTO tasks (brand_id, platform, kind, title, due_date, assignee) VALUES (?, ?, ?, ?, ?, ?)',
      brandId(fd),
      platformValue ? platform(fd) : null,
      oneOf(fd, 'kind', ['invitations', 'replies', 'complaints', 'content', 'monitoring', 'other'] as const),
      requiredText(fd, 'title', 300),
      date(fd, 'due_date', { required: false }),
      text(fd, 'assignee', { max: 80 }),
    )
  })
}

export async function updateTaskStatus(fd: FormData) {
  await handle(fd, null, () => {
    run('UPDATE tasks SET status = ? WHERE id = ?', oneOf(fd, 'status', ['todo', 'in_progress', 'done'] as const), id(fd))
  })
}

export async function deleteTask(fd: FormData) {
  await handle(fd, 'Задача удалена.', () => run('DELETE FROM tasks WHERE id = ?', id(fd)))
}

export async function saveCampaign(fd: FormData) {
  const existing = fd.get('id') ? id(fd) : null
  await handle(fd, existing ? 'Кампания обновлена.' : 'Кампания добавлена.', () => {
    if (existing) {
      run(
        'UPDATE campaigns SET invites_sent = ?, reviews_received = ?, status = ? WHERE id = ?',
        integer(fd, 'invites_sent', { min: 0 })!,
        integer(fd, 'reviews_received', { min: 0 })!,
        oneOf(fd, 'status', ['planned', 'active', 'finished'] as const),
        existing,
      )
      return
    }
    run(
      `INSERT INTO campaigns (brand_id, platform, name, start_date, invites_sent, reviews_received, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      brandId(fd),
      platform(fd),
      requiredText(fd, 'name', 200),
      date(fd, 'start_date')!,
      integer(fd, 'invites_sent', { min: 0, required: false }) ?? 0,
      integer(fd, 'reviews_received', { min: 0, required: false }) ?? 0,
      oneOf(fd, 'status', ['planned', 'active', 'finished'] as const, 'planned'),
    )
  })
}

export async function deleteCampaign(fd: FormData) {
  await handle(fd, 'Кампания удалена.', () => run('DELETE FROM campaigns WHERE id = ?', id(fd)))
}

// ── Expenses & subscriptions ──────────────────────────────────────

function optionalBrand(fd: FormData) {
  return fd.get('brand_id') ? brandId(fd) : null
}

export async function addExpense(fd: FormData) {
  await handle(fd, 'Расход добавлен.', () => {
    run(
      'INSERT INTO expenses (date, category, brand_id, description, amount, currency) VALUES (?, ?, ?, ?, ?, ?)',
      date(fd, 'date')!,
      oneOf(fd, 'category', ['subscription', 'contractor', 'other'] as const),
      optionalBrand(fd),
      requiredText(fd, 'description', 300),
      number(fd, 'amount', { min: 0, max: 10_000_000 })!,
      oneOf(fd, 'currency', ['USD', 'EUR', 'RUB'] as const, 'USD'),
    )
  })
}

export async function deleteExpense(fd: FormData) {
  await handle(fd, 'Расход удалён.', () => run('DELETE FROM expenses WHERE id = ?', id(fd)))
}

export async function addSubscription(fd: FormData) {
  await handle(fd, 'Подписка добавлена.', () => {
    const platformValue = String(fd.get('platform') ?? '')
    run(
      `INSERT INTO subscriptions (brand_id, platform, name, amount, currency, billing_cycle, status, next_renewal)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      optionalBrand(fd),
      platformValue ? platform(fd) : null,
      requiredText(fd, 'name', 200),
      number(fd, 'amount', { min: 0, max: 10_000_000 })!,
      oneOf(fd, 'currency', ['USD', 'EUR', 'RUB'] as const, 'USD'),
      oneOf(fd, 'billing_cycle', ['monthly', 'yearly', 'one_time'] as const, 'monthly'),
      date(fd, 'next_renewal', { required: false }),
    )
  })
}

export async function updateSubscriptionStatus(fd: FormData) {
  await handle(fd, null, () => {
    run('UPDATE subscriptions SET status = ? WHERE id = ?', oneOf(fd, 'status', ['active', 'paused', 'cancelled'] as const), id(fd))
  })
}

/** Logs this period's charge of a subscription into the expense ledger. */
export async function logSubscriptionPayment(fd: FormData) {
  await handle(fd, 'Платёж записан в расходы.', () => {
    const sub = get<{ name: string; amount: number; currency: string; brand_id: number | null }>(
      'SELECT name, amount, currency, brand_id FROM subscriptions WHERE id = ?',
      id(fd),
    )
    if (!sub) throw new FormError('Подписка не найдена.')
    run(
      "INSERT INTO expenses (date, category, brand_id, description, amount, currency) VALUES (?, 'subscription', ?, ?, ?, ?)",
      today(),
      sub.brand_id,
      sub.name,
      sub.amount,
      sub.currency,
    )
  })
}

export async function deleteSubscription(fd: FormData) {
  await handle(fd, 'Подписка удалена.', () => run('DELETE FROM subscriptions WHERE id = ?', id(fd)))
}

// ── Rating calculator plans ───────────────────────────────────────

/** Saves one brand's quarter plan from the calculator. Every field is re-validated here. */
export async function saveForecastPlan(brandIdValue: number, quarter: string, plan: unknown) {
  await requireAdmin()
  if (!Number.isInteger(brandIdValue) || !get('SELECT 1 FROM brands WHERE id = ?', brandIdValue)) return { error: 'Бренд не найден.' }
  if (!/^Q[1-4] \d{4}$/.test(quarter)) return { error: 'Неверный квартал.' }
  const p = plan as { conversion?: unknown; rows?: unknown }
  const num = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null)
  const conversion = num(p?.conversion, 0.001, 1)
  if (conversion === null || !Array.isArray(p.rows) || p.rows.length > 50) return { error: 'Неверные данные плана.' }
  const rows = []
  for (const raw of p.rows as Record<string, unknown>[]) {
    const row = {
      platform: String(raw.platform),
      enabled: raw.enabled === true,
      mode: raw.mode === 'target' ? 'target' : 'manual',
      perMonth: num(raw.perMonth, 0, 1_000_000),
      avgNew: num(raw.avgNew, 1, 5),
      invitePrice: num(raw.invitePrice, 0, 10_000),
      replyPrice: num(raw.replyPrice, 0, 10_000),
    }
    if (!PLATFORM_KEYS.includes(row.platform as (typeof PLATFORM_KEYS)[number]) || [row.perMonth, row.avgNew, row.invitePrice, row.replyPrice].includes(null)) {
      return { error: 'Неверные данные плана.' }
    }
    rows.push(row)
  }
  run(
    `INSERT INTO forecast_plans (brand_id, quarter, data) VALUES (?, ?, ?)
     ON CONFLICT (brand_id, quarter) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`,
    brandIdValue,
    quarter,
    JSON.stringify({ conversion, rows }),
  )
  return { savedAt: new Date().toISOString() }
}
