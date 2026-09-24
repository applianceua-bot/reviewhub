import { brandPage } from '@/lib/dash/page'
import { listCampaigns, listTasks } from '@/lib/data/lists'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { Card, PageBody } from '@/components/dash/ui'
import { CampaignsView, TasksView } from '@/components/dash/views/plan-view'

export const metadata = { title: 'План работ' }

export default async function CabinetPlan({ searchParams }: PageProps<'/cabinet/plan'>) {
  const { brand, brands } = await brandPage(searchParams, '/cabinet/plan')
  return (
    <>
      <BrandHeader title="План работ" description="Что команда делает по вашему бренду" brand={brand} brands={brands} />
      {brand ? (
        <PageBody>
          <Card title="Задачи">
            <TasksView tasks={listTasks(brand.id)} />
          </Card>
          <Card title="Кампании приглашений" description="Реальные клиенты, которых попросили оставить отзыв">
            <CampaignsView campaigns={listCampaigns(brand.id)} />
          </Card>
        </PageBody>
      ) : (
        <NoBrands />
      )}
    </>
  )
}
