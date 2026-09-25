import { RefreshCw, Trash2 } from 'lucide-react'
import type { Competitor, RemovalCheck } from '@/lib/data/lists'
import { LINK_STATUS_LABEL, REVIEW_TYPE_LABEL, platformColor, platformName } from '@/lib/dash/constants'
import { formatShort, fromDateKey } from '@/lib/dash/dates'
import { Card, Empty } from '@/components/dash/ui'
import { AutoSubmitSelect, SubmitButton } from '@/components/dash/controls'
import { checkRemovalLinks, deleteRemovalCheck, setCompetitor, setLinkStatus, setReviewType } from '@/app/admin/removal-actions'
import { cn } from '@/lib/utils'

/*
 * "Проверка на удаление" — layout mirrors repcontrol's removal-check page:
 * KPI row, removal share by platform and by review type, then the journal
 * with filters and per-row link checks.
 */

export function monthLabel(month: string) {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(fromDateKey(`${month}-01`))
}

function formatChecked(value: string | null) {
  if (!value) return ''
  const d = new Date(`${value.replace(' ', 'T')}Z`)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function ShareBars({ rows }: { rows: { label: string; color?: string; removed: number; total: number }[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Нет данных.</p>
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((s) => {
        const pct = Math.round((s.removed / s.total) * 100)
        return (
          <div key={s.label} className="flex items-center gap-3 text-xs">
            <span className="flex w-[130px] shrink-0 items-center gap-1.5 truncate" title={s.label}>
              <span className="size-2 shrink-0 rounded-full" style={{ background: s.color ?? 'var(--muted-foreground)' }} />
              {s.label}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-negative" style={{ width: `${pct}%` }} />
            </span>
            <span className="w-[110px] shrink-0 text-right text-muted-foreground tabular-nums">
              {s.removed} / {s.total} · {pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

function groupShare(rows: RemovalCheck[], key: (r: RemovalCheck) => string) {
  const groups = new Map<string, { removed: number; total: number }>()
  for (const r of rows) {
    const g = groups.get(key(r)) ?? { removed: 0, total: 0 }
    g.total++
    if (r.link_status === 'removed') g.removed++
    groups.set(key(r), g)
  }
  return [...groups.entries()].map(([label, g]) => ({ label, ...g }))
}

const TYPE_COLOR: Record<string, string> = { real: 'var(--positive)', fake: 'var(--negative)', unknown: 'var(--muted-foreground)' }

export function RemovalStats({ rows, admin = false }: { rows: RemovalCheck[]; admin?: boolean }) {
  const total = rows.length
  const live = rows.filter((r) => r.link_status === 'live').length
  const removed = rows.filter((r) => r.link_status === 'removed').length
  const neverChecked = rows.filter((r) => r.link_status === 'unknown' && !r.last_checked).length
  const unconfirmed = total - live - removed - neverChecked
  const byPlatform = groupShare(rows, (r) => r.platform)
    .map((g) => ({ ...g, color: platformColor(g.label), label: platformName(g.label) }))
    .sort((a, b) => b.removed / b.total - a.removed / a.total || b.total - a.total)
  const byType = groupShare(rows, (r) => r.review_type).map((g) => ({
    ...g,
    color: TYPE_COLOR[g.label],
    label: REVIEW_TYPE_LABEL[g.label],
  }))
  const competitorRows = rows.filter((r) => r.competitor_name)
  const byCompetitor = groupShare(competitorRows, (r) => r.competitor_name!).sort((a, b) => b.total - a.total)

  return (
    <>
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-relaxed">
        <b>Статус ссылки — не тональность отзыва.</b> «Живой»/«Удалён»/«Неизвестно» отражают, доступна ли ссылка на площадке
        сейчас, по данным ручной проверки или последнего импорта.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[
          { label: 'Всего загружено', value: String(total), hint: 'за всё время' },
          { label: 'Живых', value: String(live), hint: 'подтверждено' },
          { label: 'Удалено площадкой', value: String(removed), hint: 'по последней проверке' },
          {
            label: 'Доля удалённых',
            value: `${total ? Math.round((removed / total) * 100) : 0}%`,
            hint: `не проверено: ${neverChecked}, статус не подтверждён: ${unconfirmed}`,
          },
        ].map((k) => (
          <div key={k.label} className="flex flex-col rounded-lg border border-border bg-card p-4 lg:p-5">
            <span className="text-sm text-muted-foreground">{k.label}</span>
            <span className="mt-3 text-2xl font-semibold tracking-tight tabular-nums lg:text-3xl">{k.value}</span>
            <span className="mt-1 text-xs text-muted-foreground">{k.hint}</span>
          </div>
        ))}
      </div>

      <div className={cn('grid gap-4', admin && byCompetitor.length > 0 ? 'xl:grid-cols-3' : 'xl:grid-cols-2')}>
        <Card title="Доля удалённых по площадкам">
          <ShareBars rows={byPlatform} />
        </Card>
        <Card
          title="Доля удалённых по типу отзыва"
          description="Удалённые фейковые — результат работы. Удалённые настоящие — повод разобраться с площадкой."
        >
          <ShareBars rows={byType} />
        </Card>
        {admin && byCompetitor.length > 0 && (
          <Card title="Доля удалённых по конкурентам" description="Отзывы, помеченные как отзыв конкурента — вручную или по почте автора.">
            <ShareBars rows={byCompetitor} />
          </Card>
        )}
      </div>
    </>
  )
}

const LINK_TONE: Record<string, string> = { live: 'text-positive', removed: 'text-negative', unknown: 'text-muted-foreground' }
const LINK_OPTIONS = Object.fromEntries(Object.entries(LINK_STATUS_LABEL).map(([k, v]) => [k, v.toLowerCase()]))

/** The journal table. With `back` set (admin), type and status are editable and links can be re-checked. */
export function RemovalJournal({ rows, back, competitors = [] }: { rows: RemovalCheck[]; back?: string; competitors?: Competitor[] }) {
  if (rows.length === 0) return <Empty>Журнал пуст — загрузите CSV выше, чтобы добавить первые записи.</Empty>
  const admin = Boolean(back)
  const competitorOptions = Object.fromEntries(competitors.map((c) => [c.id, c.name]))
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-xs [&_td]:px-2 [&_td]:py-2 [&_td]:align-middle [&_th]:px-2 [&_th]:py-2">
        <thead>
          <tr className="text-left text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
            <th className="pl-5!">#</th>
            <th>Дата</th>
            {admin && <th>Email</th>}
            <th>Ссылка</th>
            <th>Площадка</th>
            <th>Бренд</th>
            <th>Процесс</th>
            <th>Тип</th>
            <th>Статус</th>
            {admin && <th>Конкурент</th>}
            <th className="pr-5!">Проверка</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const shortLink = r.link.length > 42 ? `${r.link.slice(0, 39)}…` : r.link
            return (
              <tr key={r.id} className="border-t border-border hover:bg-muted/40">
                <td className="pl-5! text-muted-foreground tabular-nums">{rows.length - i}</td>
                <td className="whitespace-nowrap">{formatShort(r.date)}</td>
                {admin && <td className="break-all text-muted-foreground">{r.reviewer_email ?? '—'}</td>}
                <td>
                  <a href={r.link} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">
                    {shortLink}
                  </a>
                </td>
                <td className="whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: platformColor(r.platform) }} />
                    {platformName(r.platform)}
                  </span>
                </td>
                <td className="whitespace-nowrap">{r.brand}</td>
                <td className="text-muted-foreground">{r.process_raw || '—'}</td>
                <td>
                  {admin ? (
                    <form action={setReviewType}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="back" value={back} />
                      <AutoSubmitSelect name="review_type" label="Тип" defaultValue={r.review_type} options={REVIEW_TYPE_LABEL} />
                    </form>
                  ) : (
                    REVIEW_TYPE_LABEL[r.review_type]
                  )}
                </td>
                <td>
                  {admin ? (
                    <form action={setLinkStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="back" value={back} />
                      <AutoSubmitSelect
                        name="link_status"
                        label="Статус"
                        defaultValue={r.link_status}
                        options={LINK_OPTIONS}
                        className={cn('font-semibold', LINK_TONE[r.link_status])}
                      />
                    </form>
                  ) : (
                    <span className={cn('font-semibold', LINK_TONE[r.link_status])}>{LINK_OPTIONS[r.link_status]}</span>
                  )}
                </td>
                {admin && (
                  <td className="min-w-32">
                    <form action={setCompetitor}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="back" value={back} />
                      <AutoSubmitSelect
                        name="competitor_id"
                        label="Конкурент"
                        defaultValue={r.competitor_id ? String(r.competitor_id) : ''}
                        placeholder="—"
                        options={competitorOptions}
                      />
                      {r.competitor_id && !r.competitor_manual && <p className="mt-0.5 text-[10px] text-muted-foreground">по почте</p>}
                    </form>
                  </td>
                )}
                <td className="pr-5! whitespace-nowrap">
                  {admin && (
                    <div className="flex items-center gap-1">
                      <form action={checkRemovalLinks}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="back" value={back} />
                        <SubmitButton variant="secondary" className="h-7 px-2 text-xs">
                          <RefreshCw className="size-3" /> Проверить
                        </SubmitButton>
                      </form>
                      <form action={deleteRemovalCheck}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="back" value={back} />
                        <SubmitButton variant="ghost" className="h-7 px-1.5" confirm="Удалить запись из журнала?">
                          <Trash2 className="size-3" />
                          <span className="sr-only">Удалить</span>
                        </SubmitButton>
                      </form>
                    </div>
                  )}
                  {r.last_checked && <span className="text-[10.5px] text-muted-foreground">{formatChecked(r.last_checked)}</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
