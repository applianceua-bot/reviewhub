import { RefreshCw } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/session'
import { accessibleBrands } from '@/lib/data/access'
import { listCompetitors, listRemovalChecks, removalMonths } from '@/lib/data/lists'
import { firstParam } from '@/lib/dash/page'
import { LINK_STATUS_LABEL, PLATFORMS, REVIEW_TYPE_LABEL } from '@/lib/dash/constants'
import { today } from '@/lib/dash/dates'
import { Card, PageBody, PageHeader } from '@/components/dash/ui'
import { Field, Flash, Input, Select, Textarea } from '@/components/dash/fields'
import { AutoSubmitSelect, SubmitButton } from '@/components/dash/controls'
import { inputClass } from '@/components/dash/styles'
import { JournalImport, SampleCsvButton } from '@/components/dash/admin/journal-import'
import { RemovalJournal, RemovalStats, monthLabel } from '@/components/dash/views/removal-view'
import { addRemovalCheck, checkRemovalLinks, deleteCompetitor, saveCompetitor } from '@/app/admin/removal-actions'

export const metadata = { title: 'Проверка на удаление' }

const pick = <T extends string>(value: string | undefined, allowed: readonly T[]) =>
  value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined

export default async function RemovalPage({ searchParams }: PageProps<'/admin/removal'>) {
  const user = await requireAdmin()
  const sp = await searchParams
  const brands = accessibleBrands(user)

  const brandParam = Number(firstParam(sp.brand))
  const brandId = brands.some((b) => b.id === brandParam) ? brandParam : null
  const platform = pick(firstParam(sp.platform), PLATFORMS.map((p) => p.key))
  const linkStatus = pick(firstParam(sp.status), ['live', 'removed', 'unknown'] as const)
  const reviewType = pick(firstParam(sp.type), ['real', 'fake', 'unknown'] as const)
  const month = /^\d{4}-\d{2}$/.test(firstParam(sp.month) ?? '') ? firstParam(sp.month) : undefined
  const search = (firstParam(sp.q) ?? '').trim().slice(0, 200) || undefined
  const competitors = listCompetitors()
  const competitorId = pick(firstParam(sp.competitor), competitors.map((c) => String(c.id)))

  const scope = brandId ? [brandId] : brands.map((b) => b.id)
  const everything = listRemovalChecks({ brandIds: scope })
  const rows = listRemovalChecks({ brandIds: scope, platform, linkStatus, reviewType, month, search, competitorId })

  const query = new URLSearchParams(
    Object.entries({
      brand: brandId ? String(brandId) : undefined,
      platform,
      status: linkStatus,
      type: reviewType,
      month,
      q: search,
      competitor: competitorId,
    }).filter((e): e is [string, string] => Boolean(e[1])),
  ).toString()
  const back = `/admin/removal${query ? `?${query}` : ''}`

  return (
    <>
      <PageHeader
        title="Проверка ревью на удаление"
        description="Журнал: отследить, какие отзывы площадка удалила, а какие ещё висят"
        actions={<SampleCsvButton />}
      />
      <PageBody>
        <Flash ok={firstParam(sp.ok)} error={firstParam(sp.error)} />

        <Card
          title="Загрузка журнала"
          description="Столбцы (табуляция или запятая): #, Date, Mail, Link, Platform, Service, Process, Type. Mail — почта автора из кабинета площадки (пароль после «:», если есть, не сохраняется). Service — название бренда как в разделе «Бренды», Type — real (настоящий) или fake (фейковый). Дубликаты по ссылке пропускаются автоматически."
        >
          <JournalImport />
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Добавить одну ссылку вручную</summary>
            <form action={addRemovalCheck} className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <input type="hidden" name="back" value={back} />
              <Field label="Бренд">
                <Select name="brand_id" required defaultValue={brandId ?? ''} options={brands.map((b) => ({ value: b.id, label: b.name }))} />
              </Field>
              <Field label="Площадка">
                <Select name="platform" required options={PLATFORMS.map((p) => ({ value: p.key, label: p.name }))} />
              </Field>
              <Field label="Ссылка на отзыв" className="lg:col-span-2">
                <Input name="link" type="url" required placeholder="https://" />
              </Field>
              <Field label="Дата">
                <Input name="date" type="date" required defaultValue={today()} />
              </Field>
              <Field label="Тип">
                <Select name="review_type" defaultValue="fake" options={REVIEW_TYPE_LABEL} />
              </Field>
              <Field label="Email автора (из кабинета площадки)" className="lg:col-span-2">
                <Input name="reviewer_email" type="email" maxLength={254} placeholder="необязательно" />
              </Field>
              <div>
                <SubmitButton>Добавить</SubmitButton>
              </div>
            </form>
          </details>
        </Card>

        <Card
          title="Конкуренты"
          description="Площадки помечают отзывы как «живой»/«удалён» — здесь вы фиксируете, что конкретный отзыв оставил конкурент. Почты ниже помечают все его прошлые и будущие отзывы автоматически; на отдельной строке журнала конкурента можно поставить и вручную."
        >
          {competitors.length > 0 && (
            <ul className="mb-4 flex flex-col gap-2">
              {competitors.map((c) => (
                <li key={c.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-medium">{c.name}</span>
                      {c.note && <span className="ml-2 text-xs text-muted-foreground">{c.note}</span>}
                    </div>
                    <form action={deleteCompetitor}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="back" value={back} />
                      <SubmitButton variant="ghost" className="h-7 px-2 text-xs" confirm={`Удалить конкурента «${c.name}»? Отзывы, отмеченные вручную, потеряют пометку.`}>
                        Удалить
                      </SubmitButton>
                    </form>
                  </div>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{c.emails.length > 0 ? c.emails.join(', ') : 'Почты не указаны — только ручные пометки'}</p>
                  <details className="mt-1.5">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Изменить</summary>
                    <form action={saveCompetitor} className="mt-2 grid gap-3 sm:grid-cols-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="back" value={back} />
                      <Field label="Название">
                        <Input name="name" required maxLength={120} defaultValue={c.name} />
                      </Field>
                      <Field label="Заметка">
                        <Input name="note" maxLength={300} defaultValue={c.note ?? ''} />
                      </Field>
                      <Field label="Почты (по одной на строку или через запятую)" className="sm:col-span-2">
                        <Textarea name="emails" defaultValue={c.emails.join('\n')} />
                      </Field>
                      <div>
                        <SubmitButton variant="secondary">Сохранить</SubmitButton>
                      </div>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          )}
          <details>
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Добавить конкурента</summary>
            <form action={saveCompetitor} className="mt-3 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="back" value={back} />
              <Field label="Название">
                <Input name="name" required maxLength={120} placeholder="Название компании-конкурента" />
              </Field>
              <Field label="Заметка">
                <Input name="note" maxLength={300} placeholder="необязательно" />
              </Field>
              <Field label="Известные почты (по одной на строку или через запятую)" className="sm:col-span-2">
                <Textarea name="emails" placeholder={'info@competitor.com\nteam@competitor.com'} />
              </Field>
              <div>
                <SubmitButton>Добавить</SubmitButton>
              </div>
            </form>
          </details>
        </Card>

        {everything.length > 0 && <RemovalStats rows={everything} admin />}

        <Card title="Журнал" description={`Показано ${rows.length} из ${everything.length}`}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <form className="flex flex-wrap items-center gap-2">
              <AutoSubmitSelect
                name="brand"
                label="Бренд"
                placeholder="Все бренды"
                defaultValue={brandId ? String(brandId) : ''}
                options={Object.fromEntries(brands.map((b) => [b.id, b.name]))}
              />
              <AutoSubmitSelect
                name="platform"
                label="Площадка"
                placeholder="Все площадки"
                defaultValue={platform ?? ''}
                options={Object.fromEntries(PLATFORMS.map((p) => [p.key, p.name]))}
              />
              <AutoSubmitSelect name="type" label="Тип" placeholder="Любой тип" defaultValue={reviewType ?? ''} options={REVIEW_TYPE_LABEL} />
              <AutoSubmitSelect name="status" label="Статус" placeholder="Любой статус" defaultValue={linkStatus ?? ''} options={LINK_STATUS_LABEL} />
              <AutoSubmitSelect
                name="month"
                label="Месяц"
                placeholder="Все месяцы"
                defaultValue={month ?? ''}
                options={Object.fromEntries(removalMonths(scope).map((m) => [m, monthLabel(m)]))}
              />
              {competitors.length > 0 && (
                <AutoSubmitSelect
                  name="competitor"
                  label="Конкурент"
                  placeholder="Все конкуренты"
                  defaultValue={competitorId ?? ''}
                  options={Object.fromEntries(competitors.map((c) => [c.id, c.name]))}
                />
              )}
              <input name="q" defaultValue={search} placeholder="Поиск по email или ссылке" className={inputClass('h-7 w-56 text-xs')} />
            </form>
            <form action={checkRemovalLinks} className="ml-auto">
              <input type="hidden" name="back" value={back} />
              {brandId && <input type="hidden" name="brand_id" value={brandId} />}
              <SubmitButton className="h-8 text-xs">
                <RefreshCw className="size-3.5" /> Проверить непроверенные
              </SubmitButton>
            </form>
          </div>
          <RemovalJournal rows={rows} back={back} competitors={competitors} />
        </Card>
      </PageBody>
    </>
  )
}
