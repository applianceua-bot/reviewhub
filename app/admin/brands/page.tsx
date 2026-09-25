import { requireAdmin } from '@/lib/auth/session'
import { accessibleBrands } from '@/lib/data/access'
import { brandPlatforms } from '@/lib/data/brand-platforms'
import { PLATFORMS } from '@/lib/dash/constants'
import { firstParam } from '@/lib/dash/page'
import { Badge, Card, PageBody, PageHeader } from '@/components/dash/ui'
import { Field, Flash, Input } from '@/components/dash/fields'
import { SubmitButton } from '@/components/dash/controls'
import { inputClass } from '@/components/dash/styles'
import { BrandPlatformsList } from '@/components/dash/admin/brand-platforms'
import { addBrandPlatform, deleteBrand, saveBrand } from '@/app/admin/actions'
import type { Brand } from '@/lib/data/access'

export const metadata = { title: 'Бренды' }

const back = '/admin/brands'

function BrandFields({ brand }: { brand?: Brand }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Название">
        <Input name="name" required maxLength={120} defaultValue={brand?.name} />
      </Field>
      <Field label="Сайт">
        <Input name="domain" maxLength={200} defaultValue={brand?.domain ?? ''} placeholder="example.com" />
      </Field>
      <Field label="Ниша">
        <Input name="niche" maxLength={80} defaultValue={brand?.niche ?? ''} placeholder="Fintech" />
      </Field>
      <Field label="Целевой рейтинг">
        <Input name="target_rating" type="number" step="0.1" min={1} max={5} required defaultValue={brand?.target_rating ?? 4.5} />
      </Field>
    </div>
  )
}

export default async function BrandsPage({ searchParams }: PageProps<'/admin/brands'>) {
  const user = await requireAdmin()
  const sp = await searchParams
  const brands = accessibleBrands(user)

  return (
    <>
      <PageHeader title="Бренды" description="Проекты, по которым ведётся работа" />
      <PageBody>
        <Flash ok={firstParam(sp.ok)} error={firstParam(sp.error)} />
        <Card title="Новый бренд">
          <form action={saveBrand} className="flex flex-col gap-4">
            <input type="hidden" name="back" value={back} />
            <BrandFields />
            <div>
              <SubmitButton>Добавить бренд</SubmitButton>
            </div>
          </form>
        </Card>

        {brands.map((b) => {
          const active = brandPlatforms(b.id)
          const activeKeys = new Set(active.map((p) => p.key))
          const groups = new Map<string, { key: string; name: string }[]>()
          for (const p of PLATFORMS) {
            if (activeKeys.has(p.key)) continue
            if (!groups.has(p.category)) groups.set(p.category, [])
            groups.get(p.category)!.push(p)
          }

          return (
            <Card key={b.id}>
              <div className="mb-4 flex items-center gap-2">
                <h3 className="font-medium">{b.name}</h3>
                {b.is_demo ? <Badge tone="warning">Демо-данные</Badge> : null}
              </div>
              <form action={saveBrand} className="flex flex-col gap-4">
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="back" value={back} />
                <BrandFields brand={b} />
                <div className="flex gap-2">
                  <SubmitButton variant="secondary">Сохранить</SubmitButton>
                </div>
              </form>

              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Площадки бренда — видны в этом порядке в формах внесения данных и отзывов
                </p>
                <BrandPlatformsList brandId={b.id} platforms={active} back={back} />
                {groups.size > 0 && (
                  <form action={addBrandPlatform} className="mt-2.5 flex gap-2">
                    <input type="hidden" name="brand_id" value={b.id} />
                    <input type="hidden" name="back" value={back} />
                    <select name="platform" required defaultValue="" className={inputClass('w-auto min-w-56')}>
                      <option value="" disabled>
                        Добавить площадку…
                      </option>
                      {[...groups.entries()].map(([category, options]) => (
                        <optgroup key={category} label={category}>
                          {options.map((p) => (
                            <option key={p.key} value={p.key}>
                              {p.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <SubmitButton variant="secondary" className="h-9 text-xs">
                      Добавить
                    </SubmitButton>
                  </form>
                )}
              </div>

              <form action={deleteBrand} className="mt-4 border-t border-border pt-4">
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="back" value={back} />
                <SubmitButton variant="danger" confirm={`Удалить ${b.name} вместе со всеми данными? Это нельзя отменить.`}>
                  Удалить бренд
                </SubmitButton>
              </form>
            </Card>
          )
        })}
      </PageBody>
    </>
  )
}
