'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { all, get, run, transaction } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/session'
import { matchPlatform } from '@/lib/dash/constants'
import { normalizeProcess, normalizeType, parseDateLoose, parseDelimitedText, parseEmail } from '@/lib/dash/csv'
import { today } from '@/lib/dash/dates'
import { checkLinks } from '@/lib/dash/link-check'

/*
 * "Проверка на удаление" — same flow as repcontrol's page: import a journal
 * file (dedupe by link), then check links one by one or everything not yet
 * removed. Each review is typed real / fake so it is clear which removals
 * are wins (fakes gone) and which are problems (real reviews removed).
 */

export type ImportState = { note?: string; error?: string }

const MAX_FILE_BYTES = 5 * 1024 * 1024
/** Columns from old exports that are never stored: passwords and who posted. */
const DROPPED_COLUMNS = ['pass', 'password', 'posted', 'posted by']

function revalidate() {
  revalidatePath('/admin', 'layout')
  revalidatePath('/cabinet', 'layout')
}

export async function importRemovalJournal(_prev: ImportState, fd: FormData): Promise<ImportState> {
  await requireAdmin()
  const file = fd.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Выберите файл.' }
  if (file.size > MAX_FILE_BYTES) return { error: 'Файл больше 5 МБ.' }

  const rows = parseDelimitedText(await file.text())
  if (!rows.length) return { error: 'В файле нет строк с данными.' }
  if (!('link' in rows[0])) return { error: 'Нет колонки Link — без ссылки отслеживать отзыв нельзя.' }

  const brandByName = new Map(all<{ id: number; name: string }>('SELECT id, name FROM brands').map((b) => [b.name.toLowerCase(), b.id]))
  const known = new Set(all<{ link: string }>('SELECT link FROM removal_checks').map((r) => r.link))

  let added = 0
  let duplicates = 0
  let passwordsDropped = 0
  const problems: string[] = []

  transaction(() => {
    rows.forEach((row, i) => {
      const line = i + 2
      const link = (row['link'] ?? '').trim()
      if (!/^https?:\/\//i.test(link)) {
        problems.push(`строка ${line}: нет ссылки`)
        return
      }
      if (known.has(link)) {
        duplicates++
        return
      }
      const brandName = (row['service'] ?? row['brand'] ?? row['бренд'] ?? '').trim()
      const brandId = brandByName.get(brandName.toLowerCase())
      if (!brandId) {
        problems.push(`строка ${line}: бренд «${brandName}» не найден`)
        return
      }
      const platform = matchPlatform(row['platform'] ?? row['площадка'])
      if (!platform) {
        problems.push(`строка ${line}: площадка «${row['platform'] ?? ''}» не распознана`)
        return
      }
      const process = (row['process'] ?? row['статус'] ?? '').trim()
      const rawMail = row['mail'] ?? row['email'] ?? row['почта'] ?? ''
      if (rawMail.includes(':')) passwordsDropped++
      run(
        `INSERT INTO removal_checks (brand_id, date, link, platform, process_raw, review_type, link_status, reviewer_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        brandId,
        parseDateLoose(row['date'] ?? row['дата']) ?? today(),
        link,
        platform,
        process.slice(0, 60) || null,
        normalizeType(row['type'] ?? row['тип']),
        normalizeProcess(process),
        parseEmail(rawMail),
      )
      known.add(link)
      added++
    })
  })
  revalidate()

  const dropped = DROPPED_COLUMNS.filter((c) => c in rows[0])
  const parts = [`Добавлено ${added}, пропущено ${duplicates} (уже есть в журнале).`]
  if (problems.length) parts.push(`Не загружено ${problems.length}: ${problems.slice(0, 5).join('; ')}${problems.length > 5 ? '…' : ''}.`)
  if (dropped.length) parts.push(`Колонки ${dropped.join(', ')} не сохраняются.`)
  if (passwordsDropped) parts.push(`В колонке Mail у ${passwordsDropped} строк был пароль после «:» — сохранена только почта.`)
  return { note: parts.join(' ') }
}

function backPath(fd: FormData) {
  const back = String(fd.get('back') ?? '')
  return back.startsWith('/admin/removal') ? back : '/admin/removal'
}

function withFlash(path: string, key: 'ok' | 'error', message: string) {
  const [pathname, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  params.delete('ok')
  params.delete('error')
  params.set(key, message)
  return `${pathname}?${params}`
}

export async function addRemovalCheck(fd: FormData) {
  await requireAdmin()
  const back = backPath(fd)
  const brandId = Number(fd.get('brand_id'))
  const platform = matchPlatform(String(fd.get('platform') ?? ''))
  const link = String(fd.get('link') ?? '').trim()
  const date = parseDateLoose(String(fd.get('date') ?? '')) ?? today()
  const type = String(fd.get('review_type'))
  if (!get('SELECT 1 FROM brands WHERE id = ?', brandId) || !platform || !/^https?:\/\/\S+$/i.test(link) || link.length > 1000) {
    redirect(withFlash(back, 'error', 'Проверьте бренд, площадку и ссылку.'))
  }
  if (get('SELECT 1 FROM removal_checks WHERE link = ?', link)) redirect(withFlash(back, 'error', 'Эта ссылка уже есть в журнале.'))
  run(
    'INSERT INTO removal_checks (brand_id, date, link, platform, review_type, reviewer_email) VALUES (?, ?, ?, ?, ?, ?)',
    brandId,
    date,
    link,
    platform,
    ['real', 'fake'].includes(type) ? type : 'unknown',
    parseEmail(String(fd.get('reviewer_email') ?? '')),
  )
  revalidate()
  redirect(withFlash(back, 'ok', 'Ссылка добавлена в журнал.'))
}

/** Rows per click — like repcontrol, the oldest-checked links go first and the rest rotate on later clicks. */
const CHECK_BATCH = 25

export async function checkRemovalLinks(fd: FormData) {
  await requireAdmin()
  const single = Number(fd.get('id'))
  const brandFilter = Number(fd.get('brand_id'))
  const brandSql = brandFilter > 0 ? 'AND brand_id = ?' : ''
  const brandParams = brandFilter > 0 ? [brandFilter] : []
  const rows =
    single > 0
      ? all<{ id: number; url: string }>('SELECT id, link AS url FROM removal_checks WHERE id = ?', single)
      : all<{ id: number; url: string }>(
          `SELECT id, link AS url FROM removal_checks WHERE link_status != 'removed' ${brandSql}
            ORDER BY last_checked IS NOT NULL, last_checked LIMIT ${CHECK_BATCH}`,
          ...brandParams,
        )
  const total =
    single > 0
      ? rows.length
      : get<{ n: number }>(`SELECT COUNT(*) AS n FROM removal_checks WHERE link_status != 'removed' ${brandSql}`, ...brandParams)!.n

  const results = await checkLinks(rows)
  let removed = 0
  transaction(() => {
    for (const [id, status] of results) {
      if (status === 'removed') removed++
      run("UPDATE removal_checks SET link_status = ?, last_checked = datetime('now') WHERE id = ?", status, id)
    }
  })
  revalidate()
  const note =
    rows.length >= total
      ? `Проверено: ${rows.length} из ${total} отслеживаемых, удалено: ${removed}. Это был полный круг проверки.`
      : `Проверено: ${rows.length} из ${total} отслеживаемых, удалено: ${removed}. Проверяются все отзывы по кругу — полный круг занимает примерно ${Math.ceil(total / CHECK_BATCH)} нажатий, нажмите ещё раз для следующей части.`
  redirect(withFlash(backPath(fd), 'ok', note))
}

export async function setLinkStatus(fd: FormData) {
  await requireAdmin()
  const status = String(fd.get('link_status'))
  if (['live', 'removed', 'unknown'].includes(status)) {
    run("UPDATE removal_checks SET link_status = ?, last_checked = datetime('now') WHERE id = ?", status, Number(fd.get('id')))
    revalidate()
  }
  redirect(backPath(fd))
}

export async function setReviewType(fd: FormData) {
  await requireAdmin()
  const type = String(fd.get('review_type'))
  if (['real', 'fake', 'unknown'].includes(type)) {
    run('UPDATE removal_checks SET review_type = ? WHERE id = ?', type, Number(fd.get('id')))
    revalidate()
  }
  redirect(backPath(fd))
}

export async function deleteRemovalCheck(fd: FormData) {
  await requireAdmin()
  run('DELETE FROM removal_checks WHERE id = ?', Number(fd.get('id')))
  revalidate()
  redirect(backPath(fd))
}

// ── Competitors ──────────────────────────────────────────────────
// A competitor's known emails auto-tag every past and future review from
// that address (see the JOIN in lib/data/lists.ts); setCompetitor below is
// only for the manual override on rows without a match, or a wrong one.

function parseEmailList(raw: string) {
  return [...new Set(raw.split(/[\n,;]/).map((e) => e.trim().toLowerCase()).filter(Boolean))]
}

export async function saveCompetitor(fd: FormData) {
  await requireAdmin()
  const back = backPath(fd)
  const existingId = Number(fd.get('id')) || null
  const name = String(fd.get('name') ?? '').trim().slice(0, 120)
  const note = String(fd.get('note') ?? '').trim().slice(0, 300) || null
  const emails = parseEmailList(String(fd.get('emails') ?? ''))
  if (!name) redirect(withFlash(back, 'error', 'Укажите название конкурента.'))

  try {
    transaction(() => {
      let id = existingId
      if (id) {
        run('UPDATE competitors SET name = ?, note = ? WHERE id = ?', name, note, id)
        run('DELETE FROM competitor_emails WHERE competitor_id = ?', id)
      } else {
        id = run('INSERT INTO competitors (name, note) VALUES (?, ?)', name, note).id
      }
      for (const email of emails) run('INSERT OR IGNORE INTO competitor_emails (competitor_id, email) VALUES (?, ?)', id, email)
    })
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint/.test(error.message)) {
      redirect(withFlash(back, 'error', 'Такой конкурент или почта уже есть в списке.'))
    }
    throw error
  }
  revalidate()
  redirect(withFlash(back, 'ok', existingId ? 'Конкурент обновлён.' : 'Конкурент добавлен.'))
}

export async function deleteCompetitor(fd: FormData) {
  await requireAdmin()
  run('DELETE FROM competitors WHERE id = ?', Number(fd.get('id')))
  revalidate()
  redirect(backPath(fd))
}

/** Manual override on one review; only needed without an email match, or to correct a wrong one. */
export async function setCompetitor(fd: FormData) {
  await requireAdmin()
  const raw = String(fd.get('competitor_id') ?? '')
  const value = raw ? Number(raw) : null
  run('UPDATE removal_checks SET competitor_id = ? WHERE id = ?', value, Number(fd.get('id')))
  revalidate()
  redirect(backPath(fd))
}
