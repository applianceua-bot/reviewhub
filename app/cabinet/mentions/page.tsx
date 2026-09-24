import { brandPage } from '@/lib/dash/page'
import { listMentions } from '@/lib/data/lists'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { Card, PageBody } from '@/components/dash/ui'
import { MentionsView } from '@/components/dash/views/mentions-view'

export const metadata = { title: 'Упоминания' }

export default async function CabinetMentions({ searchParams }: PageProps<'/cabinet/mentions'>) {
  const { brand, brands } = await brandPage(searchParams, '/cabinet/mentions')
  return (
    <>
      <BrandHeader title="Упоминания" description="Обсуждения бренда на форумах, в соцсетях и СМИ" brand={brand} brands={brands} />
      {brand ? (
        <PageBody>
          <Card>
            <MentionsView mentions={listMentions(brand.id)} />
          </Card>
        </PageBody>
      ) : (
        <NoBrands />
      )}
    </>
  )
}
