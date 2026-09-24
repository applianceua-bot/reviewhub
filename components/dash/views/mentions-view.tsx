import { ExternalLink, Trash2 } from 'lucide-react'
import type { Mention } from '@/lib/data/lists'
import { MENTION_STATUS_LABEL, SENTIMENT_LABEL } from '@/lib/dash/constants'
import { formatShort } from '@/lib/dash/dates'
import { Badge, Empty, Table, type BadgeTone } from '@/components/dash/ui'
import { AutoSubmitSelect, SubmitButton } from '@/components/dash/controls'
import { deleteMention, updateMentionStatus } from '@/app/admin/actions'

const SENTIMENT_TONE: Record<string, BadgeTone> = { positive: 'positive', neutral: 'info', negative: 'negative' }
const STATUS_TONE: Record<string, BadgeTone> = {
  needs_response: 'warning',
  responded: 'info',
  monitoring: 'neutral',
  resolved: 'positive',
}

export function MentionsView({ mentions, back }: { mentions: Mention[]; back?: string }) {
  if (mentions.length === 0) return <Empty>Упоминаний пока нет.</Empty>
  const admin = Boolean(back)
  return (
    <Table>
      <thead>
        <tr>
          <th>Дата</th>
          <th>Где</th>
          <th>Упоминание</th>
          <th>Тон</th>
          <th>Статус</th>
          {admin && <th className="w-0" />}
        </tr>
      </thead>
      <tbody>
        {mentions.map((m) => (
          <tr key={m.id}>
            <td className="whitespace-nowrap text-muted-foreground">{formatShort(m.date)}</td>
            <td className="whitespace-nowrap">{m.platform}</td>
            <td className="max-w-md">
              {m.url ? (
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                  {m.title}
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              ) : (
                m.title
              )}
              {m.matched_keyword && <p className="text-xs text-muted-foreground">по запросу «{m.matched_keyword}»</p>}
            </td>
            <td>
              <Badge tone={SENTIMENT_TONE[m.sentiment]}>{SENTIMENT_LABEL[m.sentiment]}</Badge>
            </td>
            <td>
              {admin ? (
                <form action={updateMentionStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="back" value={back} />
                  <AutoSubmitSelect name="status" label="Статус" defaultValue={m.status} options={MENTION_STATUS_LABEL} />
                </form>
              ) : (
                <Badge tone={STATUS_TONE[m.status]}>{MENTION_STATUS_LABEL[m.status]}</Badge>
              )}
            </td>
            {admin && (
              <td>
                <form action={deleteMention}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="back" value={back} />
                  <SubmitButton variant="ghost" className="h-8 px-2" confirm="Удалить упоминание?">
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Удалить</span>
                  </SubmitButton>
                </form>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
