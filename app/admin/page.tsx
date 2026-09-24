import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/session'
import { accessibleBrands } from '@/lib/data/access'
import { getOverview } from '@/lib/data/overview'
import { all } from '@/lib/db'
import { Badge, Card, Delta, Empty, Kpi, PageBody, PageHeader, Progress, Table } from '@/components/dash/ui'
import { buttonClass } from '@/components/dash/styles'

export const metadata = { title: 'Портфель' }

export default async function AdminHome() {
  const user = await requireAdmin()
  const brands = accessibleBrands(user)
  const clientCounts = new Map(
    all<{ brand_id: number; n: number }>(
      `SELECT cb.brand_id, COUNT(*) AS n FROM client_brands cb JOIN users u ON u.id = cb.user_id
        WHERE u.active = 1 GROUP BY cb.brand_id`,
    ).map((r) => [r.brand_id, r.n]),
  )
  const rows = brands.map((b) => ({ brand: b, o: getOverview(b.id, 1) }))

  const totals = rows.reduce(
    (acc, { o }) => ({
      newReviews: acc.newReviews + o.newReviews,
      removed: acc.removed + o.removal.removed,
      open: acc.open + o.removal.pending,
      mentions: acc.mentions + o.mentionsToAnswer,
    }),
    { newReviews: 0, removed: 0, open: 0, mentions: 0 },
  )
  const onTarget = rows.filter(({ o }) => o.rating !== null && o.rating >= o.targetRating).length

  return (
    <>
      <PageHeader
        title="Портфель"
        description="Все бренды агентства"
        actions={
          <Link href="/admin/brands" className={buttonClass('primary')}>
            Добавить бренд
          </Link>
        }
      />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Бренды на целевом рейтинге" value={`${onTarget} из ${brands.length}`} />
          <Kpi label="Новых отзывов за 4 недели" value={totals.newReviews} />
          <Kpi label="Фейковых ещё висит" value={totals.open} hint={`Удалено площадками: ${totals.removed}`} />
          <Kpi label="Упоминаний ждут ответа" value={totals.mentions} />
        </div>

        <Card title="Бренды">
          {rows.length === 0 ? (
            <Empty>Брендов пока нет.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Бренд</th>
                  <th>Рейтинг</th>
                  <th>До цели</th>
                  <th>Новые отзывы</th>
                  <th>Фейки</th>
                  <th>Клиентов</th>
                  <th className="w-0" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ brand, o }) => (
                  <tr key={brand.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{brand.name}</span>
                        {brand.is_demo ? <Badge tone="warning">Демо</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{brand.niche ?? '—'}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums">{o.rating?.toFixed(2) ?? '—'}</span>
                        <Delta value={o.ratingDelta} />
                      </div>
                    </td>
                    <td className="min-w-32">
                      <Progress value={o.rating ? Math.min(o.rating / o.targetRating, 1) : 0} />
                      <p className="mt-1 text-xs text-muted-foreground">цель {o.targetRating.toFixed(1)}</p>
                    </td>
                    <td className="tabular-nums">{o.newReviews}</td>
                    <td className="text-sm">
                      {o.removal.removed} удалено
                      {o.removal.pending ? <span className="text-muted-foreground"> · {o.removal.pending} висят</span> : null}
                    </td>
                    <td className="tabular-nums">{clientCounts.get(brand.id) ?? 0}</td>
                    <td>
                      <Link href={`/cabinet?brand=${brand.id}`} className={buttonClass('secondary', 'h-8 text-xs')}>
                        Дашборд
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </PageBody>
    </>
  )
}
