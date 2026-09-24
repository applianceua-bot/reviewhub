import { brandPage, firstParam } from '@/lib/dash/page'
import { getReport, resolvePeriod } from '@/lib/data/report'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { PageBody } from '@/components/dash/ui'
import { PrintButton } from '@/components/dash/controls'
import { PeriodSwitcher, ReportView } from '@/components/dash/views/report-view'

export const metadata = { title: 'Отчёты' }

export default async function AdminReports({ searchParams }: PageProps<'/admin/reports'>) {
  const { brand, brands, back, sp } = await brandPage(searchParams, '/admin/reports', { admin: true })
  if (!brand) {
    return (
      <>
        <BrandHeader title="Отчёты" brand={null} brands={[]} />
        <NoBrands admin />
      </>
    )
  }
  const period = resolvePeriod(firstParam(sp.period), firstParam(sp.offset))
  return (
    <>
      <BrandHeader
        title="Отчёты"
        description="Недельная и квартальная статистика. Клиент видит тот же отчёт без блока расходов."
        brand={brand}
        brands={brands}
        actions={<PrintButton />}
      />
      <PageBody>
        <PeriodSwitcher base={back} period={period} />
        <ReportView report={getReport(brand.id, period, { includeExpenses: true })} period={period} />
      </PageBody>
    </>
  )
}
