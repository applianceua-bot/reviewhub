import { RefreshCw } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/session'
import { accessibleBrands } from '@/lib/data/access'
import { listRemovalChecks, removalMonths } from '@/lib/data/lists'
import { firstParam } from '@/lib/dash/page'
import { LINK_STATUS_LABEL, PLATFORMS, REVIEW_TYPE_LABEL } from '@/lib/dash/constants'
import { today } from '@/lib/dash/dates'
import { Card, PageBody, PageHeader } from '@/components/dash/ui'
import { Field, Flash, Input, Select } from '@/components/dash/fields'
import { AutoSubmitSelect, SubmitButton } from '@/components/dash/controls'
import { inputClass } from '@/components/dash/styles'
import { JournalImport, SampleCsvButton } from '@/components/dash/admin/journal-import'
import { RemovalJournal, RemovalStats, monthLabel } from '@/components/dash/views/removal-view'
import { addRemovalCheck, checkRemovalLinks } from '@/app/admin/removal-actions'

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

  const scope = brandId ? [brandId] : brands.map((b) => b.id)
  const everything = listRemovalChecks({ brandIds: scope })
  const rows = listRemovalChecks({ brandIds: scope, platform, linkStatus, reviewType, month, search })

  const query = new URLSearchParams(
    Object.entries({ brand: brandId ? String(brandId) : undefined, platform, status: linkStatus, type: reviewType, month, q: search }).filter(
      (e): e is [string, string] => Boolean(e[1]),
    ),
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

        {everything.length > 0 && <RemovalStats rows={everything} />}

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
          <RemovalJournal rows={rows} back={back} />
        </Card>
      </PageBody>
    </>
  )
}
