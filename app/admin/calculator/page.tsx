import { brandPage } from '@/lib/dash/page'
import { brandPlatforms } from '@/lib/data/brand-platforms'
import { getOverview } from '@/lib/data/overview'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { Empty, PageBody } from '@/components/dash/ui'
import { PublicationsCalculator } from '@/components/dash/admin/publications-calculator'

export const metadata = { title: 'Калькулятор публикаций' }

export default async function CalculatorPage({ searchParams }: PageProps<'/admin/calculator'>) {
  const { brand, brands } = await brandPage(searchParams, '/admin/calculator', { admin: true })
  if (!brand) {
    return (
      <>
        <BrandHeader title="Калькулятор публикаций" brand={null} brands={[]} />
        <NoBrands admin />
      </>
    )
  }

  const overview = getOverview(brand.id)
  const currentByPlatform = new Map(overview.platforms.map((p) => [p.platform, p]))

  type PricedPlatform = ReturnType<typeof brandPlatforms>[number] & { basePrice: number }
  const platforms = brandPlatforms(brand.id)
    .filter((p): p is PricedPlatform => p.basePrice !== null)
    .map((p) => {
      const current = currentByPlatform.get(p.key)
      return { ...p, currentRating: current?.rating ?? null, currentCount: current?.reviewCount ?? 0 }
    })

  return (
    <>
      <BrandHeader title="Калькулятор публикаций" description="Смета на закупку публикаций по площадкам бренда" brand={brand} brands={brands} />
      <PageBody>
        {platforms.length === 0 ? (
          <Empty>
            У бренда нет площадок с ценой публикации (App Store и Google Play не продаются как публикации). Добавьте площадки на
            странице «Бренды».
          </Empty>
        ) : (
          <PublicationsCalculator platforms={platforms} brandName={brand.name} targetRating={overview.targetRating} />
        )}
      </PageBody>
    </>
  )
}
