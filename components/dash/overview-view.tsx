import { CheckCircle2, Flag, MessageSquare, Star } from 'lucide-react'
import type { Overview } from '@/lib/data/overview'
import { platformColor, platformName } from '@/lib/dash/constants'
import { formatShort } from '@/lib/dash/dates'
import { AreaChart, BarChart, Donut } from '@/components/dash/charts'
import { Badge, Card, Delta, Kpi, Progress } from '@/components/dash/ui'
import { CountUp } from '@/components/count-up'
import { cn, revealDelay } from '@/lib/utils'

const ACTIVITY_ICON = { review: Star, removal: Flag, task: CheckCircle2, mention: MessageSquare }
const TONE_CLASS = {
  positive: 'bg-positive/12 text-positive',
  negative: 'bg-negative/12 text-negative',
  neutral: 'bg-muted text-muted-foreground',
  brand: 'bg-primary/12 text-primary',
}

/** The brand dashboard shared by the client cabinet, the admin panel and the landing demo. */
export function OverviewView({ data }: { data: Overview }) {
  const removedShare = data.removal.total ? data.removal.removed / data.removal.total : null
  const sentimentTotal = data.sentiment.positive + data.sentiment.neutral + data.sentiment.negative

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          revealIndex={0}
          label="Средний рейтинг"
          value={data.rating !== null ? <CountUp value={data.rating} decimals={2} /> : '—'}
          delta={<Delta value={data.ratingDelta} />}
          hint={`Цель ${data.targetRating.toFixed(1)} · изменение за 4 недели`}
        />
        <Kpi
          revealIndex={1}
          label="Новые отзывы"
          value={<CountUp value={data.newReviews} />}
          delta={
            <Delta
              value={data.newReviewsPrev ? (data.newReviews - data.newReviewsPrev) / data.newReviewsPrev : null}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          }
          hint="За 4 недели на всех площадках"
        />
        <Kpi
          revealIndex={2}
          label="Фейковых удалено площадками"
          value={
            <>
              <CountUp value={data.removal.removed} /> из <CountUp value={data.removal.total} />
            </>
          }
          delta={removedShare !== null ? <Badge tone="positive">{Math.round(removedShare * 100)}%</Badge> : undefined}
          hint={`${data.removal.pending} ещё висят на площадках`}
        />
        <Kpi
          revealIndex={3}
          label="Ответы на отзывы"
          value={data.replyRate !== null ? <CountUp value={Math.round(data.replyRate * 100)} suffix="%" /> : '—'}
          hint={`Доля отзывов с опубликованным ответом за 90 дней${
            data.mentionsToAnswer ? ` · упоминаний ждут ответа: ${data.mentionsToAnswer}` : ''
          }`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Динамика рейтинга" description="Средневзвешенный рейтинг по площадкам, по неделям" className="xl:col-span-2">
          <AreaChart
            points={data.trend.map((p) => ({ label: formatShort(p.week), value: p.rating }))}
            target={data.targetRating}
          />
        </Card>
        <Card title="Тональность отзывов" description="За 90 дней">
          <Donut
            center={String(sentimentTotal)}
            segments={[
              { label: 'Позитив', value: data.sentiment.positive, color: 'var(--positive)' },
              { label: 'Нейтрально', value: data.sentiment.neutral, color: 'var(--chart-2)' },
              { label: 'Негатив', value: data.sentiment.negative, color: 'var(--negative)' },
            ]}
          />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Площадки" description="Текущий рейтинг и путь до цели" className="xl:col-span-2">
          {data.platforms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Данные по площадкам ещё не внесены.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {data.platforms.map((p, i) => (
                <li
                  key={p.platform}
                  data-reveal
                  style={revealDelay(i, 60)}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[160px_1fr_auto]"
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: platformColor(p.platform) }} />
                    <span className="text-sm font-medium">{platformName(p.platform)}</span>
                  </div>
                  <div className="order-3 col-span-2 sm:order-none sm:col-span-1">
                    <Progress value={p.rating / 5} revealIndex={i} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.reviewCount.toLocaleString('ru-RU')} отзывов · +{p.newReviews} за 4 недели
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-self-end">
                    <span className="text-sm font-semibold tabular-nums">{p.rating.toFixed(1)}</span>
                    <Delta value={p.ratingDelta} format={(v) => v.toFixed(1)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Последние события">
          {data.activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока ничего не произошло.</p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {data.activity.map((item, i) => {
                const Icon = ACTIVITY_ICON[item.kind]
                return (
                  <li key={i} data-reveal style={revealDelay(i, 60)} className="flex items-start gap-3">
                    <span className={cn('grid size-7 shrink-0 place-items-center rounded-md', TONE_CLASS[item.tone])}>
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatShort(item.date)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Новые отзывы по неделям" description="Прирост отзывов на всех площадках">
        <BarChart points={data.trend.map((p) => ({ label: formatShort(p.week), value: p.newReviews }))} />
      </Card>
    </div>
  )
}
