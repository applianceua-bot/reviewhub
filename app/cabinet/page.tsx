import { requireUser } from '@/lib/auth/session'
import { selectBrand } from '@/lib/data/access'
import { getOverview } from '@/lib/data/overview'
import { OverviewView } from '@/components/dash/overview-view'
import { BrandPicker } from '@/components/dash/controls'
import { DemoBadge, Empty, PageBody, PageHeader } from '@/components/dash/ui'

type Props = { searchParams: Promise<{ brand?: string }> }

export default async function CabinetPage({ searchParams }: Props) {
  const user = await requireUser()
  const { brands, brand } = selectBrand(user, (await searchParams).brand)

  if (!brand) {
    return (
      <>
        <PageHeader title="Обзор" />
        <PageBody>
          <Empty>К вашему кабинету пока не подключён ни один бренд. Напишите менеджеру — он откроет доступ.</Empty>
        </PageBody>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={brand.name}
        description={[brand.niche, brand.domain].filter(Boolean).join(' · ') || 'Обзор репутации бренда'}
        actions={
          <>
            {brand.is_demo ? <DemoBadge /> : null}
            <BrandPicker brands={brands} value={brand.id} />
          </>
        }
      />
      <PageBody>
        <OverviewView data={getOverview(brand.id)} />
      </PageBody>
    </>
  )
}
