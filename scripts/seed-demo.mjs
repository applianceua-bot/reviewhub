// Fills the local database with FICTIONAL demo data: two made-up brands and
// a demo client account that can see only the first of them.
//
//   npm run db:seed
//
// Re-running replaces the demo brands (is_demo = 1) and leaves real data alone.
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { MIGRATIONS, SCHEMA } from '../lib/db/schema.ts'
import { hashPassword } from '../lib/auth/password.ts'

const DEMO_LOGIN = 'demo'
const DEMO_PASSWORD = 'demo-cabinet'

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'reviewhub.db')
mkdirSync(path.dirname(dbPath), { recursive: true })
const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true })
db.exec(SCHEMA)
for (const [table, column, definition] of MIGRATIONS) {
  if (!db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

// Deterministic pseudo-random numbers so every seed looks the same.
let state = 20260924
function rand() {
  state = (state * 1664525 + 1013904223) % 4294967296
  return state / 4294967296
}
const pick = (list) => list[Math.floor(rand() * list.length)]

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return dateKey(d)
}
function mondayWeeksAgo(n) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day) - n * 7)
  return dateKey(d)
}

const BRANDS = [
  {
    name: 'Nordvik Pay',
    domain: 'nordvikpay.example',
    niche: 'Fintech',
    target: 4.5,
    platforms: [
      ['trustpilot', 3.6, 4.3, 1180, 9],
      ['google', 3.9, 4.4, 640, 5],
      ['smartcustomer', 3.4, 4.1, 210, 2],
      ['reviewsio', 4.0, 4.5, 330, 3],
    ],
  },
  {
    name: 'Lumo Travel',
    domain: 'lumotravel.example',
    niche: 'Travel',
    target: 4.6,
    platforms: [
      ['trustpilot', 4.1, 4.5, 2400, 14],
      ['google', 4.2, 4.6, 980, 6],
      ['hellopeter', 3.7, 4.2, 150, 1],
    ],
  },
]

const AUTHORS = ['Anna K.', 'Mark T.', 'Sofia R.', 'David L.', 'Elena P.', 'James W.', 'Olga S.', 'Chris M.', 'Laura B.', 'Tom H.']
const POSITIVE = [
  'Перевод прошёл за пару минут, поддержка ответила сразу.',
  'Пользуюсь полгода, претензий нет. Удобное приложение.',
  'Быстро решили вопрос с возвратом, спасибо.',
  'Понятные тарифы, всё работает как описано.',
]
const NEUTRAL = ['В целом нормально, но верификация заняла пару дней.', 'Работает, хотя интерфейс мог бы быть проще.']
const NEGATIVE = ['Долго ждал ответа поддержки по платежу.', 'Не сразу понял комиссию, пришлось писать в чат.']
const SPAM = ['Лучший сервис тут → cheap-transfer-now.example, переходите!', 'Отличные условия у другого сервиса, ищите в профиле.']

const MENTION_TITLES = [
  ['Reddit', 'Кто-нибудь пользовался {brand}? Отзывы', 'neutral', 'needs_response'],
  ['Reddit', '{brand} заблокировал перевод — что делать?', 'negative', 'responded'],
  ['Quora', 'Is {brand} safe to use?', 'neutral', 'responded'],
  ['Форум', 'Сравнение {brand} с конкурентами', 'positive', 'monitoring'],
  ['СМИ', '{brand} запустил новый продукт', 'positive', 'resolved'],
  ['X', 'Поддержка {brand} ответила за 5 минут, неожиданно', 'positive', 'monitoring'],
]

const TASKS = [
  ['invitations', 'Запустить приглашения после покупки на Trustpilot', 'trustpilot'],
  ['replies', 'Ответить на отзывы за неделю', 'google'],
  ['complaints', 'Проверить, удалены ли спам-отзывы', 'trustpilot'],
  ['content', 'Обновить FAQ по комиссиям на сайте', null],
  ['monitoring', 'Еженедельный мониторинг упоминаний', null],
  ['replies', 'Согласовать шаблоны ответов с клиентом', null],
]

db.exec('BEGIN')
try {
  // Expenses and subscriptions outlive a deleted brand (SET NULL), so remove the demo ones explicitly.
  db.exec('DELETE FROM expenses WHERE brand_id IN (SELECT id FROM brands WHERE is_demo = 1)')
  db.exec('DELETE FROM subscriptions WHERE brand_id IN (SELECT id FROM brands WHERE is_demo = 1)')
  db.exec('DELETE FROM brands WHERE is_demo = 1')

  const brandIds = []
  for (const brand of BRANDS) {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO brands (name, domain, niche, target_rating, is_demo) VALUES (?, ?, ?, ?, 1)')
      .run(brand.name, brand.domain, brand.niche, brand.target)
    const brandId = Number(lastInsertRowid)
    brandIds.push(brandId)

    // 26 weeks of profile snapshots: rating drifts from `from` to `to`.
    const insertEntry = db.prepare(
      'INSERT INTO entries (brand_id, platform, week_start, rating, review_count) VALUES (?, ?, ?, ?, ?)',
    )
    for (const [platform, from, to, startCount, perWeek] of brand.platforms) {
      let count = startCount
      for (let w = 25; w >= 0; w--) {
        const progress = (25 - w) / 25
        const eased = progress * 0.85 + (1 - Math.pow(1 - progress, 2)) * 0.15
        const rating = Math.min(5, from + (to - from) * eased + (rand() - 0.5) * 0.06)
        count += Math.round(perWeek * (0.6 + rand() * 0.9))
        insertEntry.run(brandId, platform, mondayWeeksAgo(w), Math.round(rating * 100) / 100, count)
      }
    }

    // Reviews over the last ~80 days.
    const insertReview = db.prepare(
      `INSERT INTO reviews (brand_id, platform, author, rating, text, url, published_at, sentiment,
                            suspicious, suspicion_reason, reply_status, reply_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    const reviewIds = []
    for (let i = 0; i < 36; i++) {
      const platform = pick(brand.platforms)[0]
      const roll = rand()
      const spam = i % 9 === 4
      const sentiment = spam ? 'negative' : roll < 0.68 ? 'positive' : roll < 0.84 ? 'neutral' : 'negative'
      const rating = spam ? 1 : sentiment === 'positive' ? pick([4, 5, 5]) : sentiment === 'neutral' ? 3 : pick([1, 2])
      const text = spam ? pick(SPAM) : pick(sentiment === 'positive' ? POSITIVE : sentiment === 'neutral' ? NEUTRAL : NEGATIVE)
      const replyStatus = spam ? 'none' : pick(['published', 'published', 'published', 'approved', 'draft', 'none'])
      const { lastInsertRowid: reviewId } = insertReview.run(
        brandId,
        platform,
        pick(AUTHORS),
        rating,
        text,
        `https://${platform}.example/review/${brandId}-${i}`,
        daysAgo(Math.floor(i * 2.2 + rand() * 2)),
        sentiment,
        spam ? 1 : 0,
        spam ? pick(['Реклама стороннего ресурса', 'Не клиент компании']) : null,
        replyStatus,
        replyStatus === 'none' ? null : 'Спасибо за отзыв! Передали команде.',
      )
      if (spam) reviewIds.push([Number(reviewId), platform, i])
    }

    // Removal journal: the spam reviews above (fake), older fakes, and a few real reviews for comparison.
    const insertCheck = db.prepare(
      `INSERT INTO removal_checks (brand_id, date, link, platform, process_raw, review_type, link_status, last_checked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    const checkedAt = (n) => `${daysAgo(n)} 10:00:00`
    reviewIds.forEach(([, platform, i], n) => {
      const status = ['removed', 'live', 'unknown', 'removed'][n % 4]
      insertCheck.run(
        brandId,
        daysAgo(Math.floor(i * 2.2)),
        `https://${platform}.example/review/${brandId}-${i}`,
        platform,
        status === 'removed' ? 'Removed' : 'Publish',
        'fake',
        status,
        status === 'unknown' ? null : checkedAt(Math.max(0, Math.floor(i * 2.2) - 4)),
      )
    })
    for (let k = 0; k < 8; k++) {
      const platform = pick(brand.platforms)[0]
      const fake = k < 6
      const status = fake ? (k === 2 ? 'live' : 'removed') : k === 6 ? 'live' : 'removed'
      insertCheck.run(
        brandId,
        daysAgo(90 + k * 9),
        `https://${platform}.example/review/old-${brandId}-${k}`,
        platform,
        status === 'removed' ? 'Removed' : 'Publish',
        fake ? 'fake' : 'real',
        status,
        checkedAt(80 + k * 9),
      )
    }

    // Keywords and mentions.
    const insertKeyword = db.prepare('INSERT INTO brand_keywords (brand_id, keyword) VALUES (?, ?)')
    for (const kw of [brand.name, `${brand.name} reviews`, `${brand.name} scam`]) insertKeyword.run(brandId, kw)
    const insertMention = db.prepare(
      `INSERT INTO mentions (brand_id, platform, url, title, date, sentiment, status, matched_keyword)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    MENTION_TITLES.forEach(([platform, title, sentiment, status], i) => {
      insertMention.run(
        brandId,
        platform,
        `https://example.com/thread/${brandId}-${i}`,
        title.replace('{brand}', brand.name),
        daysAgo(i * 6 + 1),
        sentiment,
        status,
        i % 2 ? `${brand.name} reviews` : brand.name,
      )
    })

    // Integrations (status only — no real keys in demo data).
    const insertConnection = db.prepare(
      'INSERT INTO connections (brand_id, platform, connected, business_id, last_sync) VALUES (?, ?, ?, ?, ?)',
    )
    for (const [platform] of brand.platforms) {
      const connected = ['trustpilot', 'reviewsio', 'hellopeter', 'smartcustomer'].includes(platform)
      insertConnection.run(brandId, platform, connected ? 1 : 0, connected ? brand.domain : null, connected ? `${daysAgo(0)} 09:00:00` : null)
    }

    // Invitation campaigns.
    const insertCampaign = db.prepare(
      `INSERT INTO campaigns (brand_id, platform, name, start_date, invites_sent, reviews_received, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    insertCampaign.run(brandId, 'trustpilot', 'Приглашения после покупки', daysAgo(70), 1850, 212, 'active')
    insertCampaign.run(brandId, 'google', 'Письмо после обращения в поддержку', daysAgo(40), 620, 58, 'active')
    insertCampaign.run(brandId, brand.platforms[2][0], 'Пилот: приглашения в приложении', daysAgo(120), 400, 31, 'finished')

    // Work plan.
    const insertTask = db.prepare(
      'INSERT INTO tasks (brand_id, platform, kind, title, due_date, assignee, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    TASKS.forEach(([kind, title, platform], i) => {
      insertTask.run(brandId, platform, kind, title, daysAgo(12 - i * 4), pick(['Ирина', 'Максим', 'Дарья']), i < 3 ? 'done' : i === 3 ? 'in_progress' : 'todo')
    })

    // Subscriptions and expenses (admin-only data).
    db.prepare(
      `INSERT INTO subscriptions (brand_id, platform, name, amount, currency, billing_cycle, status, next_renewal)
       VALUES (?, 'trustpilot', 'Trustpilot Business Standard', 259, 'USD', 'monthly', 'active', ?)`,
    ).run(brandId, daysAgo(-12))
    const insertExpense = db.prepare(
      'INSERT INTO expenses (date, category, brand_id, description, amount, currency) VALUES (?, ?, ?, ?, ?, ?)',
    )
    for (let m = 0; m < 6; m++) {
      insertExpense.run(daysAgo(m * 30 + 3), 'subscription', brandId, 'Trustpilot Business Standard', 259, 'USD')
      if (m % 2 === 0) insertExpense.run(daysAgo(m * 30 + 10), 'contractor', brandId, 'Копирайтер: ответы на отзывы', 180 + m * 20, 'USD')
    }
  }

  // Demo client sees only the first demo brand.
  const existing = db.prepare('SELECT id FROM users WHERE login = ?').get(DEMO_LOGIN)
  let demoId
  if (existing) {
    demoId = existing.id
    db.prepare("UPDATE users SET password_hash = ?, role = 'client', active = 1 WHERE id = ?").run(hashPassword(DEMO_PASSWORD), demoId)
  } else {
    demoId = Number(
      db.prepare("INSERT INTO users (login, name, password_hash, role) VALUES (?, 'Демо-клиент', ?, 'client')")
        .run(DEMO_LOGIN, hashPassword(DEMO_PASSWORD)).lastInsertRowid,
    )
  }
  db.prepare('INSERT OR IGNORE INTO client_brands (user_id, brand_id) VALUES (?, ?)').run(demoId, brandIds[0])

  db.exec('COMMIT')
} catch (error) {
  db.exec('ROLLBACK')
  throw error
}

console.log('Демо-данные загружены (вымышленные бренды Nordvik Pay и Lumo Travel).')
console.log(`Демо-клиент: логин «${DEMO_LOGIN}», пароль «${DEMO_PASSWORD}» — видит только Nordvik Pay.`)
