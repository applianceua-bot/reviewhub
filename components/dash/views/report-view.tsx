import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Period, Report } from '@/lib/data/report'
import { EXPENSE_CATEGORY_LABEL, platformName } from '@/lib/dash/constants'
import { formatShort } from '@/lib/dash/dates'
import { Card, Delta, Kpi, Table } from '@/components/dash/ui'
import { cn } from '@/lib/utils'

function periodHref(base: string, kind: string, offset: number) {
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}period=${kind}&offset=${offset}`
}

export function PeriodSwitcher({ base, period }: { base: string; period: Period }) {
  const tab = (kind: 'week' | 'quarter', label: string) => (
    <Link
      href={periodHref(base, kind, 0)}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm transition-colors',
        period.kind === kind ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </Link>
  )
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <div className="flex rounded-lg border border-border p-0.5">
        {tab('week', 'Неделя')}
        {tab('quarter', 'Квартал')}
      </div>
      <div className="flex items-center gap-1">
        <Link href={periodHref(base, period.kind, period.offset + 1)} aria-label="Предыдущий период" className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" />
        </Link>
        <span className="min-w-36 text-center text-sm font-medium">{period.label}</span>
        {period.offset > 0 ? (
          <Link href={periodHref(base, period.kind, period.offset - 1)} aria-label="Следующий период" className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground">
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className="size-8" />
        )}
      </div>
    </div>
  )
}

export function ReportView({ report, period }: { report: Report; period: Period }) {
  const ratingDelta =
    report.ratingStart !== null && report.ratingEnd !== null ? report.ratingEnd - report.ratingStart : null
  const conversion = report.invitations.sent ? report.invitations.received / report.invitations.sent : null

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Рейтинг на конец периода"
          value={report.ratingEnd?.toFixed(2) ?? '—'}
          delta={<Delta value={ratingDelta} />}
          hint={report.ratingStart !== null ? `В начале периода ${report.ratingStart.toFixed(2)}` : undefined}
        />
        <Kpi label="Новых отзывов на площадках" value={report.newReviews} hint="По данным профилей площадок" />
        <Kpi
          label="Фейковых удалено площадками"
          value={report.removal.fakeRemoved}
          hint={`Ещё висят ${report.removal.fakeLive}${report.removal.realRemoved ? `, удалено настоящих: ${report.removal.realRemoved}` : ''}`}
        />
        <Kpi
          label="Упоминания"
          value={report.mentions.total}
          hint={`Негативных ${report.mentions.negative}, ждут ответа ${report.mentions.needsResponse}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Площадки" description={`Изменение рейтинга за период ${period.label}`}>
          {report.platforms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных за период.</p>
          ) : (
            <Table compact>
              <thead>
                <tr>
                  <th>Площадка</th>
                  <th>Было</th>
                  <th>Стало</th>
                  <th>Изменение</th>
                  <th>Новых</th>
                </tr>
              </thead>
              <tbody>
                {report.platforms.map((p) => (
                  <tr key={p.platform}>
                    <td>{platformName(p.platform)}</td>
                    <td className="tabular-nums text-muted-foreground">{p.ratingStart?.toFixed(2) ?? '—'}</td>
                    <td className="tabular-nums">{p.ratingEnd.toFixed(2)}</td>
                    <td>
                      <Delta value={p.ratingStart !== null ? p.ratingEnd - p.ratingStart : null} />
                    </td>
                    <td className="tabular-nums">{p.newReviews}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card title="Работа с отзывами">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Отзывов в журнале</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">{report.reviews.total}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Средняя оценка</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">{report.reviews.avgStars?.toFixed(2) ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Позитив / нейтрально / негатив</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {report.reviews.positive} / {report.reviews.neutral} / {report.reviews.negative}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Опубликовано ответов</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">{report.repliesPublished}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Помечено подозрительных</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">{report.reviews.suspicious}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Приглашения → отзывы</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {report.invitations.sent.toLocaleString('ru-RU')} → {report.invitations.received}
                {conversion !== null && <span className="ml-1.5 text-sm font-normal text-muted-foreground">{(conversion * 100).toFixed(1)}%</span>}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Выполненные задачи">
          {report.tasksDone.length === 0 ? (
            <p className="text-sm text-muted-foreground">За период задач не закрыто.</p>
          ) : (
            <ul className="flex flex-col gap-2.5 text-sm">
              {report.tasksDone.map((t, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>{t.title}</span>
                  <span className="shrink-0 text-muted-foreground">{t.due_date ? formatShort(t.due_date) : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {report.expenses && (
          <Card title="Расходы по бренду" description="Только для команды, клиент этот блок не видит">
            <p className="text-2xl font-semibold tabular-nums">${report.expenses.total.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {report.expenses.byCategory.map((c) => (
                <li key={c.category} className="flex justify-between">
                  <span className="text-muted-foreground">{EXPENSE_CATEGORY_LABEL[c.category]}</span>
                  <span className="tabular-nums">${c.amount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
