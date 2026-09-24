import { requireAdmin } from '@/lib/auth/session'
import { accessibleBrands } from '@/lib/data/access'
import { getBrandFacts, getSavedPlans } from '@/lib/data/forecast'
import { quarterOf, today } from '@/lib/dash/dates'
import { PageBody, PageHeader } from '@/components/dash/ui'
import { RatingCalculator } from '@/components/dash/admin/calculator'

export const metadata = { title: 'Калькулятор' }

export default async function CalculatorPage() {
  const user = await requireAdmin()
  const quarter = quarterOf(today()).label
  const facts = getBrandFacts(accessibleBrands(user).map((b) => b.id)).filter((b) => b.platforms.length > 0)
  const saved = getSavedPlans(
    facts.map((b) => b.id),
    quarter,
  )

  return (
    <>
      <PageHeader
        title="Калькулятор"
        description="Сколько отзывов реальных клиентов и приглашений нужно, чтобы выйти на целевой рейтинг, и во что это обойдётся"
      />
      <PageBody>
        <RatingCalculator brands={facts} quarter={quarter} savedPlans={saved} />
      </PageBody>
    </>
  )
}
