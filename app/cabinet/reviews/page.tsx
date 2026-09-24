import { brandPage } from '@/lib/dash/page'
import { listReviews } from '@/lib/data/lists'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { Card, PageBody } from '@/components/dash/ui'
import { ReviewsView } from '@/components/dash/views/reviews-view'

export const metadata = { title: 'Отзывы' }

export default async function CabinetReviews({ searchParams }: PageProps<'/cabinet/reviews'>) {
  const { brand, brands } = await brandPage(searchParams, '/cabinet/reviews')
  return (
    <>
      <BrandHeader title="Отзывы" description="Новые отзывы и наши ответы" brand={brand} brands={brands} />
      {brand ? (
        <PageBody>
          <Card>
            <ReviewsView reviews={listReviews(brand.id)} />
          </Card>
        </PageBody>
      ) : (
        <NoBrands />
      )}
    </>
  )
}
