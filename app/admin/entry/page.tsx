import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { brandPage, firstParam } from '@/lib/dash/page'
import { listEntries } from '@/lib/data/lists'
import { brandPlatforms } from '@/lib/data/brand-platforms'
import { get } from '@/lib/db'
import { platformName } from '@/lib/dash/constants'
import { formatLong, formatShort, isValidDateKey, weekStart, fromDateKey } from '@/lib/dash/dates'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { Card, PageBody, Table } from '@/components/dash/ui'
import { Field, Flash, Input } from '@/components/dash/fields'
import { SubmitButton } from '@/components/dash/controls'
import { buttonClass } from '@/components/dash/styles'
import { deleteEntry, saveEntries } from '@/app/admin/actions'

export const metadata = { title: 'Внесение данных' }

export default async function EntryPage({ searchParams }: PageProps<'/admin/entry'>) {
  const { brand, brands, back, sp, ok, error } = await brandPage(searchParams, '/admin/entry', { admin: true })
  if (!brand) {
    return (
      <>
        <BrandHeader title="Внесение данных" brand={null} brands={[]} />
        <NoBrands admin />
      </>
    )
  }

  const weekParam = firstParam(sp.week)
  const week = weekParam && isValidDateKey(weekParam) ? weekStart(fromDateKey(weekParam)) : weekStart()
  const current = (platform: string) =>
    get<{ rating: number; review_count: number }>(
      'SELECT rating, review_count FROM entries WHERE brand_id = ? AND platform = ? AND week_start = ?',
      brand.id,
      platform,
      week,
    )
  const previous = (platform: string) =>
    get<{ rating: number; review_count: number; week_start: string }>(
      'SELECT rating, review_count, week_start FROM entries WHERE brand_id = ? AND platform = ? AND week_start < ? ORDER BY week_start DESC LIMIT 1',
      brand.id,
      platform,
      week,
    )
  const entries = listEntries(brand.id)
  const platforms = brandPlatforms(brand.id)

  return (
    <>
      <BrandHeader title="Внесение данных" description="Еженедельный снимок профилей на площадках" brand={brand} brands={brands} />
      <PageBody>
        <Flash ok={ok} error={error} />
        <Card
          title={`Неделя с ${formatLong(week)}`}
          description="Рейтинг и общее число отзывов, как они показаны на площадке. Пустые строки не сохраняются."
          action={
            <form className="flex items-end gap-2">
              <input type="hidden" name="brand" value={brand.id} />
              <Field label="Другая неделя">
                <Input type="date" name="week" defaultValue={week} className="h-8 w-40" />
              </Field>
              <button type="submit" className={buttonClass('secondary', 'h-8 text-xs')}>
                Открыть
              </button>
            </form>
          }
        >
          {platforms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              У бренда пока не выбраны площадки — добавьте их на странице{' '}
              <Link href="/admin/brands" className="text-primary hover:underline">
                «Бренды»
              </Link>
              .
            </p>
          ) : (
            <form action={saveEntries} className="flex flex-col gap-4">
              <input type="hidden" name="brand_id" value={brand.id} />
              <input type="hidden" name="week_start" value={week} />
              <input type="hidden" name="back" value={`${back}&week=${week}`} />
              <Table>
                <thead>
                  <tr>
                    <th>Площадка</th>
                    <th>Рейтинг</th>
                    <th>Всего отзывов</th>
                    <th>Прошлый снимок</th>
                  </tr>
                </thead>
                <tbody>
                  {platforms.map((p) => {
                    const cur = current(p.key)
                    const prev = previous(p.key)
                    return (
                      <tr key={p.key}>
                        <td className="font-medium">{p.name}</td>
                        <td>
                          <Input name={`rating_${p.key}`} type="number" step="0.01" min={0} max={5} defaultValue={cur?.rating} placeholder={prev ? String(prev.rating) : '—'} className="h-8 w-24" aria-label={`${p.name}: рейтинг`} />
                        </td>
                        <td>
                          <Input name={`count_${p.key}`} type="number" min={0} defaultValue={cur?.review_count} placeholder={prev ? String(prev.review_count) : '—'} className="h-8 w-32" aria-label={`${p.name}: всего отзывов`} />
                        </td>
                        <td className="text-xs text-muted-foreground">
                          {prev ? `${prev.rating} · ${prev.review_count.toLocaleString('ru-RU')} отзывов · ${formatShort(prev.week_start)}` : 'нет данных'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
              <div>
                <SubmitButton>Сохранить неделю</SubmitButton>
              </div>
            </form>
          )}
        </Card>

        <Card title="Последние записи">
          <Table>
            <thead>
              <tr>
                <th>Неделя</th>
                <th>Площадка</th>
                <th>Рейтинг</th>
                <th>Отзывов</th>
                <th className="w-0" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="text-muted-foreground">{formatShort(e.week_start)}</td>
                  <td>{platformName(e.platform)}</td>
                  <td className="tabular-nums">{e.rating}</td>
                  <td className="tabular-nums">{e.review_count.toLocaleString('ru-RU')}</td>
                  <td>
                    <form action={deleteEntry}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="back" value={back} />
                      <SubmitButton variant="ghost" className="h-8 px-2" confirm="Удалить запись?">
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Удалить</span>
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </PageBody>
    </>
  )
}
