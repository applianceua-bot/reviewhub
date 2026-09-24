import { brandPage, firstParam } from '@/lib/dash/page'
import { getReport, resolvePeriod } from '@/lib/data/report'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { PageBody } from '@/components/dash/ui'
import { PrintButton } from '@/components/dash/controls'
import { PeriodSwitcher, ReportView } from '@/components/dash/views/report-view'

export const metadata = { title: 'Отчёты' }

export default async function CabinetReports({ searchParams }: PageProps<'/cabinet/reports'>) {
  const { brand, brands, back, sp } = await brandPage(searchParams, '/cabinet/reports')
  const period = resolvePeriod(firstParam(sp.period), firstParam(sp.offset))
  return (
    <>
      <BrandHeader title="Отчёты" description="Итоги недели и квартала" brand={brand} brands={brands} actions={<PrintButton />} />
      {brand ? (
        <PageBody>
          <PeriodSwitcher base={back} period={period} />
          <ReportView report={getReport(brand.id, period)} period={period} />
        </PageBody>
      ) : (
        <NoBrands />
      )}
    </>
  )
}
