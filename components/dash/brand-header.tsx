import type { Brand } from '@/lib/data/access'
import { BrandPicker } from '@/components/dash/controls'
import { DemoBadge, Empty, PageBody, PageHeader } from '@/components/dash/ui'

/** Page header with the brand picker; renders the empty state when the user has no brands. */
export function BrandHeader({
  title,
  description,
  brand,
  brands,
  actions,
}: {
  title: string
  description?: string
  brand: Brand | null
  brands: Brand[]
  actions?: React.ReactNode
}) {
  return (
    <PageHeader
      title={title}
      description={brand ? `${brand.name}${description ? ` · ${description}` : ''}` : description}
      actions={
        <>
          {actions}
          {brand?.is_demo ? <DemoBadge /> : null}
          {brand && <BrandPicker brands={brands.map(({ id, name }) => ({ id, name }))} value={brand.id} />}
        </>
      }
    />
  )
}

export function NoBrands({ admin = false }: { admin?: boolean }) {
  return (
    <PageBody>
      <Empty>
        {admin
          ? 'Брендов пока нет — добавьте первый на странице «Бренды».'
          : 'К вашему кабинету пока не подключён ни один бренд. Напишите менеджеру — он откроет доступ.'}
      </Empty>
    </PageBody>
  )
}
