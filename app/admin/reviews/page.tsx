import Link from 'next/link'
import { brandPage, firstParam } from '@/lib/dash/page'
import { listReviews } from '@/lib/data/lists'
import { PLATFORMS, SENTIMENT_LABEL } from '@/lib/dash/constants'
import { today } from '@/lib/dash/dates'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { Card, PageBody } from '@/components/dash/ui'
import { Field, Flash, Input, Select, Textarea } from '@/components/dash/fields'
import { SubmitButton } from '@/components/dash/controls'
import { ReviewsView } from '@/components/dash/views/reviews-view'
import { addReview } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Отзывы' }

export default async function AdminReviews({ searchParams }: PageProps<'/admin/reviews'>) {
  const { brand, brands, back, sp, ok, error } = await brandPage(searchParams, '/admin/reviews', { admin: true })
  if (!brand) {
    return (
      <>
        <BrandHeader title="Отзывы" brand={null} brands={[]} />
        <NoBrands admin />
      </>
    )
  }
  const onlySuspicious = firstParam(sp.filter) === 'suspicious'
  const listBack = onlySuspicious ? `${back}&filter=suspicious` : back
  const reviews = listReviews(brand.id, { suspicious: onlySuspicious })

  const tab = (active: boolean, href: string, label: string) => (
    <Link
      href={href}
      className={cn('rounded-md px-3 py-1.5 text-sm', active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}
    >
      {label}
    </Link>
  )

  return (
    <>
      <BrandHeader title="Отзывы" description="Журнал отзывов, ответы и пометки подозрительных" brand={brand} brands={brands} />
      <PageBody>
        <Flash ok={ok} error={error} />

        <Card
          title="Добавить отзыв в журнал"
          description="Отзывы с площадок, подключённых через API, появятся здесь после синхронизации."
        >
          <form action={addReview} className="flex flex-col gap-4">
            <input type="hidden" name="brand_id" value={brand.id} />
            <input type="hidden" name="back" value={listBack} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Площадка">
                <Select name="platform" required options={PLATFORMS.map((p) => ({ value: p.key, label: p.name }))} />
              </Field>
              <Field label="Дата">
                <Input type="date" name="published_at" required defaultValue={today()} />
              </Field>
              <Field label="Автор">
                <Input name="author" maxLength={120} />
              </Field>
              <Field label="Оценка">
                <Select name="rating" placeholder="—" options={['5', '4', '3', '2', '1'].map((v) => ({ value: v, label: `${v} ★` }))} />
              </Field>
              <Field label="Тон">
                <Select name="sentiment" defaultValue="neutral" options={SENTIMENT_LABEL} />
              </Field>
            </div>
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <Field label="Текст">
                <Textarea name="text" maxLength={5000} />
              </Field>
              <Field label="Ссылка на отзыв">
                <Input name="url" type="url" placeholder="https://" />
              </Field>
            </div>
            <div>
              <SubmitButton>Добавить</SubmitButton>
            </div>
          </form>
        </Card>

        <Card
          title={onlySuspicious ? 'Подозрительные отзывы' : 'Все отзывы'}
          description="Пометьте отзыв как подозрительный: реклама, спам, не клиент компании."
          action={
            <div className="flex rounded-lg border border-border p-0.5">
              {tab(!onlySuspicious, back, 'Все')}
              {tab(onlySuspicious, `${back}&filter=suspicious`, 'Подозрительные')}
            </div>
          }
        >
          <ReviewsView reviews={reviews} back={listBack} />
        </Card>
      </PageBody>
    </>
  )
}
