import { requireAdmin } from '@/lib/auth/session'
import { accessibleBrands } from '@/lib/data/access'
import { firstParam } from '@/lib/dash/page'
import { Badge, Card, PageBody, PageHeader } from '@/components/dash/ui'
import { Field, Flash, Input } from '@/components/dash/fields'
import { SubmitButton } from '@/components/dash/controls'
import { deleteBrand, saveBrand } from '@/app/admin/actions'
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

        {brands.map((b) => (
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
            <form action={deleteBrand} className="mt-2">
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="back" value={back} />
              <SubmitButton variant="danger" confirm={`Удалить ${b.name} вместе со всеми данными? Это нельзя отменить.`}>
                Удалить бренд
              </SubmitButton>
            </form>
          </Card>
        ))}
      </PageBody>
    </>
  )
}
