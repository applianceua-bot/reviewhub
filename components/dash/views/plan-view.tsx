import { Trash2 } from 'lucide-react'
import type { Campaign, Task } from '@/lib/data/lists'
import { CAMPAIGN_STATUS_LABEL, TASK_KIND_LABEL, TASK_STATUS_LABEL, platformName } from '@/lib/dash/constants'
import { formatShort, today } from '@/lib/dash/dates'
import { Badge, Empty, Progress, Table, type BadgeTone } from '@/components/dash/ui'
import { AutoSubmitSelect, SubmitButton } from '@/components/dash/controls'
import { deleteCampaign, deleteTask, saveCampaign, updateTaskStatus } from '@/app/admin/actions'
import { inputClass } from '@/components/dash/styles'

const TASK_TONE: Record<string, BadgeTone> = { todo: 'neutral', in_progress: 'info', done: 'positive' }
const CAMPAIGN_TONE: Record<string, BadgeTone> = { planned: 'neutral', active: 'info', finished: 'positive' }

export function TasksView({ tasks, back }: { tasks: Task[]; back?: string }) {
  if (tasks.length === 0) return <Empty>Задач пока нет.</Empty>
  const admin = Boolean(back)
  const now = today()
  return (
    <Table>
      <thead>
        <tr>
          <th>Задача</th>
          <th>Тип</th>
          <th>Срок</th>
          <th>Ответственный</th>
          <th>Статус</th>
          {admin && <th className="w-0" />}
        </tr>
      </thead>
      <tbody>
        {tasks.map((t) => {
          const overdue = t.status !== 'done' && t.due_date !== null && t.due_date < now
          return (
            <tr key={t.id}>
              <td>
                {t.title}
                {t.platform && <p className="text-xs text-muted-foreground">{platformName(t.platform)}</p>}
              </td>
              <td className="whitespace-nowrap text-muted-foreground">{TASK_KIND_LABEL[t.kind]}</td>
              <td className={overdue ? 'whitespace-nowrap text-negative' : 'whitespace-nowrap text-muted-foreground'}>
                {t.due_date ? formatShort(t.due_date) : '—'}
              </td>
              <td className="text-muted-foreground">{t.assignee ?? '—'}</td>
              <td>
                {admin ? (
                  <form action={updateTaskStatus}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="back" value={back} />
                    <AutoSubmitSelect name="status" label="Статус" defaultValue={t.status} options={TASK_STATUS_LABEL} />
                  </form>
                ) : (
                  <Badge tone={TASK_TONE[t.status]}>{TASK_STATUS_LABEL[t.status]}</Badge>
                )}
              </td>
              {admin && (
                <td>
                  <form action={deleteTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="back" value={back} />
                    <SubmitButton variant="ghost" className="h-8 px-2" confirm="Удалить задачу?">
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Удалить</span>
                    </SubmitButton>
                  </form>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

/** Invitation campaigns: real customers asked to leave a review, and how many did. */
export function CampaignsView({ campaigns, back }: { campaigns: Campaign[]; back?: string }) {
  if (campaigns.length === 0) return <Empty>Кампаний приглашений пока нет.</Empty>
  const admin = Boolean(back)
  return (
    <Table>
      <thead>
        <tr>
          <th>Кампания</th>
          <th>Старт</th>
          <th>Приглашений</th>
          <th>Отзывов</th>
          <th>Конверсия</th>
          <th>Статус</th>
          {admin && <th className="w-0" />}
        </tr>
      </thead>
      <tbody>
        {campaigns.map((c) => {
          const conversion = c.invites_sent ? c.reviews_received / c.invites_sent : 0
          const formId = `campaign-${c.id}`
          return (
            <tr key={c.id}>
              <td>
                {c.name}
                <p className="text-xs text-muted-foreground">{platformName(c.platform)}</p>
              </td>
              <td className="whitespace-nowrap text-muted-foreground">{formatShort(c.start_date)}</td>
              <td className="tabular-nums">
                {admin ? (
                  <input form={formId} name="invites_sent" type="number" min={0} defaultValue={c.invites_sent} className={inputClass('h-8 w-24')} aria-label="Отправлено приглашений" />
                ) : (
                  c.invites_sent.toLocaleString('ru-RU')
                )}
              </td>
              <td className="tabular-nums">
                {admin ? (
                  <input form={formId} name="reviews_received" type="number" min={0} defaultValue={c.reviews_received} className={inputClass('h-8 w-20')} aria-label="Получено отзывов" />
                ) : (
                  c.reviews_received
                )}
              </td>
              <td className="min-w-28">
                <span className="text-xs tabular-nums">{(conversion * 100).toFixed(1)}%</span>
                <Progress value={conversion * 5} className="mt-1" />
              </td>
              <td>
                {admin ? (
                  <select form={formId} name="status" defaultValue={c.status} className={inputClass('h-8 w-auto text-xs')} aria-label="Статус">
                    {Object.entries(CAMPAIGN_STATUS_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge tone={CAMPAIGN_TONE[c.status]}>{CAMPAIGN_STATUS_LABEL[c.status]}</Badge>
                )}
              </td>
              {admin && (
                <td>
                  <div className="flex items-center gap-1">
                    <form id={formId} action={saveCampaign}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="back" value={back} />
                      <SubmitButton variant="secondary" className="h-8 text-xs">
                        Сохранить
                      </SubmitButton>
                    </form>
                    <form action={deleteCampaign}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="back" value={back} />
                      <SubmitButton variant="ghost" className="h-8 px-2" confirm="Удалить кампанию?">
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Удалить</span>
                      </SubmitButton>
                    </form>
                  </div>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}
