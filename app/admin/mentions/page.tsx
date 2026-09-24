import { X } from 'lucide-react'
import { brandPage } from '@/lib/dash/page'
import { listKeywords, listMentions } from '@/lib/data/lists'
import { MENTION_PLATFORMS, MENTION_STATUS_LABEL, SENTIMENT_LABEL } from '@/lib/dash/constants'
import { today } from '@/lib/dash/dates'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { Card, PageBody } from '@/components/dash/ui'
import { Field, Flash, Input, Select } from '@/components/dash/fields'
import { SubmitButton } from '@/components/dash/controls'
import { MentionsView } from '@/components/dash/views/mentions-view'
import { addKeyword, addMention, deleteKeyword, toggleKeyword } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Упоминания' }

export default async function AdminMentions({ searchParams }: PageProps<'/admin/mentions'>) {
  const { brand, brands, back, ok, error } = await brandPage(searchParams, '/admin/mentions', { admin: true })
  if (!brand) {
    return (
      <>
        <BrandHeader title="Упоминания" brand={null} brands={[]} />
        <NoBrands admin />
      </>
    )
  }
  const keywords = listKeywords(brand.id)
  const mentions = listMentions(brand.id)

  return (
    <>
      <BrandHeader title="Упоминания" description="Обсуждения бренда вне площадок отзывов" brand={brand} brands={brands} />
      <PageBody>
        <Flash ok={ok} error={error} />

        <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
          <Card title="Ключевые слова" description="По ним ищем упоминания. Число рядом показывает, сколько упоминаний найдено.">
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span
                  key={k.id}
                  className={cn('inline-flex items-center gap-1 rounded-md border border-border py-1 pr-1 pl-2.5 text-sm', !k.active && 'opacity-50')}
                >
                  <form action={toggleKeyword}>
                    <input type="hidden" name="id" value={k.id} />
                    <input type="hidden" name="back" value={back} />
                    <button type="submit" title={k.active ? 'Выключить' : 'Включить'} className="hover:text-primary">
                      {k.keyword}
                    </button>
                  </form>
                  <span className="rounded bg-muted px-1.5 text-xs text-muted-foreground">{k.hits}</span>
                  <form action={deleteKeyword}>
                    <input type="hidden" name="id" value={k.id} />
                    <input type="hidden" name="back" value={back} />
                    <button
                      type="submit"
                      aria-label={`Удалить ${k.keyword}`}
                      className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </form>
                </span>
              ))}
            </div>
            <form action={addKeyword} className="mt-4 flex gap-2">
              <input type="hidden" name="brand_id" value={brand.id} />
              <input type="hidden" name="back" value={back} />
              <Input name="keyword" required maxLength={120} placeholder="Новое ключевое слово" />
              <SubmitButton variant="secondary">Добавить</SubmitButton>
            </form>
          </Card>

          <Card title="Добавить упоминание">
            <form action={addMention} className="flex flex-col gap-4">
              <input type="hidden" name="brand_id" value={brand.id} />
              <input type="hidden" name="back" value={back} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Где">
                  <Select name="platform" required options={MENTION_PLATFORMS.map((p) => ({ value: p, label: p }))} />
                </Field>
                <Field label="Дата">
                  <Input name="date" type="date" required defaultValue={today()} />
                </Field>
                <Field label="Тон">
                  <Select name="sentiment" defaultValue="neutral" options={SENTIMENT_LABEL} />
                </Field>
                <Field label="Статус">
                  <Select name="status" defaultValue="monitoring" options={MENTION_STATUS_LABEL} />
                </Field>
                <Field label="Заголовок или суть" className="sm:col-span-2">
                  <Input name="title" required maxLength={300} />
                </Field>
                <Field label="Ссылка">
                  <Input name="url" type="url" placeholder="https://" />
                </Field>
                <Field label="Ключевое слово">
                  <Select name="matched_keyword" placeholder="—" options={keywords.map((k) => ({ value: k.keyword, label: k.keyword }))} />
                </Field>
              </div>
              <div>
                <SubmitButton>Добавить</SubmitButton>
              </div>
            </form>
          </Card>
        </div>

        <Card title="Все упоминания">
          <MentionsView mentions={mentions} back={back} />
        </Card>
      </PageBody>
    </>
  )
}
