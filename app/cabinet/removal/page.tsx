import { brandPage } from '@/lib/dash/page'
import { listRemovalChecks } from '@/lib/data/lists'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { Card, PageBody } from '@/components/dash/ui'
import { RemovalJournal, RemovalStats } from '@/components/dash/views/removal-view'

export const metadata = { title: 'Проверка на удаление' }

export default async function CabinetRemoval({ searchParams }: PageProps<'/cabinet/removal'>) {
  const { brand, brands } = await brandPage(searchParams, '/cabinet/removal')
  const rows = brand ? listRemovalChecks({ brandIds: [brand.id] }) : []
  return (
    <>
      <BrandHeader title="Проверка на удаление" description="Какие отзывы площадки удалили, а какие ещё висят" brand={brand} brands={brands} />
      {brand ? (
        <PageBody>
          {rows.length > 0 && <RemovalStats rows={rows} />}
          <Card title="Журнал" description={`Записей: ${rows.length}`}>
            <RemovalJournal rows={rows} />
          </Card>
        </PageBody>
      ) : (
        <NoBrands />
      )}
    </>
  )
}
