import { ExternalLink, Trash2 } from 'lucide-react'
import type { Review } from '@/lib/data/lists'
import { REPLY_STATUS_LABEL, SENTIMENT_LABEL, SUSPICION_REASONS, platformName } from '@/lib/dash/constants'
import { formatShort } from '@/lib/dash/dates'
import { Badge, Empty, Stars, Table, type BadgeTone } from '@/components/dash/ui'
import { AutoSubmitSelect, SubmitButton } from '@/components/dash/controls'
import { Textarea } from '@/components/dash/fields'
import { deleteReview, markSuspicious, saveReply } from '@/app/admin/actions'

const SENTIMENT_TONE: Record<string, BadgeTone> = { positive: 'positive', neutral: 'info', negative: 'negative' }
const REPLY_TONE: Record<string, BadgeTone> = { none: 'neutral', draft: 'warning', approved: 'info', published: 'positive' }

const SUSPICION_OPTIONS: Record<string, string> = {
  '': 'Не подозрительный',
  ...Object.fromEntries(SUSPICION_REASONS.map((r) => [r, r])),
}

/** Review list. With `back` set (admin), rows get inline editing controls. */
export function ReviewsView({ reviews, back }: { reviews: Review[]; back?: string }) {
  if (reviews.length === 0) return <Empty>Отзывов пока нет.</Empty>
  const admin = Boolean(back)

  return (
    <Table>
      <thead>
        <tr>
          <th>Дата</th>
          <th>Площадка</th>
          <th>Отзыв</th>
          <th>Тон</th>
          <th>Ответ</th>
          <th>Проверка</th>
          {admin && <th className="w-0" />}
        </tr>
      </thead>
      <tbody>
        {reviews.map((r) => (
          <tr key={r.id} className={r.suspicious ? 'bg-negative/[0.04]' : undefined}>
            <td className="whitespace-nowrap text-muted-foreground">{formatShort(r.published_at)}</td>
            <td className="whitespace-nowrap">{platformName(r.platform)}</td>
            <td className="max-w-md">
              <div className="flex items-center gap-2">
                {r.rating ? <Stars value={r.rating} /> : null}
                <span className="text-xs text-muted-foreground">{r.author}</span>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Открыть отзыв">
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
              {r.text && <p className="mt-1 line-clamp-2 text-sm">{r.text}</p>}
              {admin && (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    {r.reply_text ? 'Изменить ответ' : 'Написать ответ'}
                  </summary>
                  <form action={saveReply} className="mt-2 flex flex-col gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="back" value={back} />
                    <Textarea name="reply_text" defaultValue={r.reply_text ?? ''} placeholder="Текст ответа от имени компании" />
                    <div className="flex items-center gap-2">
                      <select name="reply_status" defaultValue={r.reply_status === 'none' ? 'draft' : r.reply_status} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                        {Object.entries(REPLY_STATUS_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <SubmitButton variant="secondary" className="h-8 text-xs">
                        Сохранить
                      </SubmitButton>
                    </div>
                  </form>
                </details>
              )}
            </td>
            <td>
              <Badge tone={SENTIMENT_TONE[r.sentiment]}>{SENTIMENT_LABEL[r.sentiment]}</Badge>
            </td>
            <td>
              <Badge tone={REPLY_TONE[r.reply_status]}>{REPLY_STATUS_LABEL[r.reply_status]}</Badge>
            </td>
            <td className="min-w-44">
              {admin ? (
                <form action={markSuspicious}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="back" value={back} />
                  <AutoSubmitSelect name="reason" label="Пометка" defaultValue={r.suspicion_reason ?? ''} options={SUSPICION_OPTIONS} />
                </form>
              ) : r.suspicious ? (
                <Badge tone="negative">Подозрительный</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
              {!admin && r.suspicious && r.suspicion_reason ? (
                <p className="mt-1 text-xs text-muted-foreground">{r.suspicion_reason}</p>
              ) : null}
              {r.tracked ? <p className="mt-1 text-xs text-primary">В журнале удаления</p> : null}
            </td>
            {admin && (
              <td>
                <div className="flex items-center gap-1">
                  <form action={deleteReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="back" value={back} />
                    <SubmitButton variant="ghost" className="h-8 px-2" confirm="Удалить отзыв из журнала?">
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Удалить</span>
                    </SubmitButton>
                  </form>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
