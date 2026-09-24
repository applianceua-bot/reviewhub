import { Trash2 } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/session'
import { accessibleBrands } from '@/lib/data/access'
import { all } from '@/lib/db'
import { firstParam } from '@/lib/dash/page'
import {
  BILLING_CYCLE_LABEL,
  CURRENCIES,
  EXPENSE_CATEGORY_LABEL,
  PLATFORMS,
  SUBSCRIPTION_STATUS_LABEL,
  monthlyEquivalent,
  platformName,
} from '@/lib/dash/constants'
import { formatShort, today, toDateKey } from '@/lib/dash/dates'
import { BarChart } from '@/components/dash/charts'
import { Card, Empty, Kpi, PageBody, PageHeader, Table } from '@/components/dash/ui'
import { Field, Flash, Input, Select } from '@/components/dash/fields'
import { AutoSubmitSelect, BrandPicker, SubmitButton } from '@/components/dash/controls'
import {
  addExpense,
  addSubscription,
  deleteExpense,
  deleteSubscription,
  logSubscriptionPayment,
  updateSubscriptionStatus,
} from '@/app/admin/actions'

export const metadata = { title: 'Расходы' }

type Expense = { id: number; date: string; category: string; brand: string | null; description: string; amount: number; currency: string }
type Subscription = {
  id: number
  brand: string | null
  platform: string | null
  name: string
  amount: number
  currency: string
  billing_cycle: string
  status: string
  next_renewal: string | null
}

function money(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export default async function ExpensesPage({ searchParams }: PageProps<'/admin/expenses'>) {
  const user = await requireAdmin()
  const sp = await searchParams
  const brands = accessibleBrands(user)
  const brandParam = Number(firstParam(sp.brand))
  const brandId = brands.some((b) => b.id === brandParam) ? brandParam : null
  const back = brandId ? `/admin/expenses?brand=${brandId}` : '/admin/expenses'

  const filter = brandId ? 'WHERE e.brand_id = ?' : ''
  const params = brandId ? [brandId] : []
  const expenses = all<Expense>(
    `SELECT e.id, e.date, e.category, b.name AS brand, e.description, e.amount, e.currency
       FROM expenses e LEFT JOIN brands b ON b.id = e.brand_id ${filter}
      ORDER BY e.date DESC, e.id DESC LIMIT 200`,
    ...params,
  )
  const subscriptions = all<Subscription>(
    `SELECT s.id, b.name AS brand, s.platform, s.name, s.amount, s.currency, s.billing_cycle, s.status, s.next_renewal
       FROM subscriptions s LEFT JOIN brands b ON b.id = s.brand_id ${brandId ? 'WHERE s.brand_id = ?' : ''}
      ORDER BY s.status, s.next_renewal`,
    ...params,
  )

  // Last 6 months in USD for the chart and KPIs.
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { key: toDateKey(d).slice(0, 7), label: d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '') }
  })
  const monthly = all<{ month: string; amount: number }>(
    `SELECT substr(e.date, 1, 7) AS month, SUM(e.amount) AS amount FROM expenses e
      ${filter ? `${filter} AND` : 'WHERE'} e.currency = 'USD' AND e.date >= ? GROUP BY month`,
    ...params,
    `${months[0].key}-01`,
  )
  const byMonth = new Map(monthly.map((m) => [m.month, m.amount]))
  const thisMonth = byMonth.get(months[5].key) ?? 0
  const lastMonth = byMonth.get(months[4].key) ?? 0
  const subsMonthly = subscriptions
    .filter((s) => s.status === 'active' && s.currency === 'USD')
    .reduce((sum, s) => sum + monthlyEquivalent(s.amount, s.billing_cycle), 0)
  const soon = subscriptions.filter((s) => s.status === 'active' && s.next_renewal && s.next_renewal <= toDateKey(new Date(Date.now() + 14 * 864e5)))

  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }))

  return (
    <>
      <PageHeader
        title="Расходы"
        description="Подписки на платформы и прочие траты. Видно только администраторам."
        actions={<BrandPicker brands={brands.map(({ id, name }) => ({ id, name }))} value={brandId} allowAll />}
      />
      <PageBody>
        <Flash ok={firstParam(sp.ok)} error={firstParam(sp.error)} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Расходы в этом месяце" value={money(thisMonth)} hint={`В прошлом месяце ${money(lastMonth)}`} />
          <Kpi label="Подписки в месяц" value={money(subsMonthly)} hint="Активные подписки в пересчёте на месяц" />
          <Kpi label="Продлений в ближайшие 14 дней" value={soon.length} hint={soon.map((s) => s.name).join(', ') || undefined} />
          <Kpi label="Расходы за 6 месяцев" value={money(monthly.reduce((s, m) => s + m.amount, 0))} hint="Только USD" />
        </div>

        <Card title="Динамика расходов" description="По месяцам, USD">
          <BarChart points={months.map((m) => ({ label: m.label, value: Math.round(byMonth.get(m.key) ?? 0) }))} color="var(--chart-1)" />
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Новый расход">
            <form action={addExpense} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="back" value={back} />
              <Field label="Дата">
                <Input name="date" type="date" required defaultValue={today()} />
              </Field>
              <Field label="Категория">
                <Select name="category" required options={EXPENSE_CATEGORY_LABEL} />
              </Field>
              <Field label="Описание" className="sm:col-span-2">
                <Input name="description" required maxLength={300} />
              </Field>
              <Field label="Сумма">
                <Input name="amount" type="number" step="0.01" min={0} required />
              </Field>
              <Field label="Валюта">
                <Select name="currency" options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
              </Field>
              <Field label="Бренд" className="sm:col-span-2">
                <Select name="brand_id" placeholder="Общий расход" defaultValue={brandId ?? ''} options={brandOptions} />
              </Field>
              <div>
                <SubmitButton>Добавить</SubmitButton>
              </div>
            </form>
          </Card>

          <Card title="Новая подписка">
            <form action={addSubscription} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="back" value={back} />
              <Field label="Название" className="sm:col-span-2">
                <Input name="name" required maxLength={200} placeholder="Trustpilot Business Standard" />
              </Field>
              <Field label="Сумма">
                <Input name="amount" type="number" step="0.01" min={0} required />
              </Field>
              <Field label="Валюта">
                <Select name="currency" options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
              </Field>
              <Field label="Период оплаты">
                <Select name="billing_cycle" options={BILLING_CYCLE_LABEL} />
              </Field>
              <Field label="Следующее продление">
                <Input name="next_renewal" type="date" />
              </Field>
              <Field label="Площадка">
                <Select name="platform" placeholder="—" options={PLATFORMS.map((p) => ({ value: p.key, label: p.name }))} />
              </Field>
              <Field label="Бренд">
                <Select name="brand_id" placeholder="Общая" defaultValue={brandId ?? ''} options={brandOptions} />
              </Field>
              <div>
                <SubmitButton>Добавить</SubmitButton>
              </div>
            </form>
          </Card>
        </div>

        <Card title="Подписки">
          {subscriptions.length === 0 ? (
            <Empty>Подписок нет.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Подписка</th>
                  <th>Бренд</th>
                  <th>Сумма</th>
                  <th>Продление</th>
                  <th>Статус</th>
                  <th className="w-0" />
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.name}
                      {s.platform && <p className="text-xs text-muted-foreground">{platformName(s.platform)}</p>}
                    </td>
                    <td className="text-muted-foreground">{s.brand ?? 'Общая'}</td>
                    <td className="whitespace-nowrap tabular-nums">
                      {money(s.amount, s.currency)} <span className="text-xs text-muted-foreground">{BILLING_CYCLE_LABEL[s.billing_cycle].toLowerCase()}</span>
                    </td>
                    <td className="whitespace-nowrap text-muted-foreground">{s.next_renewal ? formatShort(s.next_renewal) : '—'}</td>
                    <td>
                      <form action={updateSubscriptionStatus}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="back" value={back} />
                        <AutoSubmitSelect name="status" label="Статус" defaultValue={s.status} options={SUBSCRIPTION_STATUS_LABEL} />
                      </form>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <form action={logSubscriptionPayment}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="back" value={back} />
                          <SubmitButton variant="secondary" className="h-8 text-xs">
                            Записать платёж
                          </SubmitButton>
                        </form>
                        <form action={deleteSubscription}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="back" value={back} />
                          <SubmitButton variant="ghost" className="h-8 px-2" confirm="Удалить подписку?">
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Удалить</span>
                          </SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card title="Журнал расходов">
          {expenses.length === 0 ? (
            <Empty>Расходов нет.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Описание</th>
                  <th>Категория</th>
                  <th>Бренд</th>
                  <th>Сумма</th>
                  <th className="w-0" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-muted-foreground">{formatShort(e.date)}</td>
                    <td>{e.description}</td>
                    <td className="text-muted-foreground">{EXPENSE_CATEGORY_LABEL[e.category]}</td>
                    <td className="text-muted-foreground">{e.brand ?? 'Общий'}</td>
                    <td className="whitespace-nowrap tabular-nums">{money(e.amount, e.currency)}</td>
                    <td>
                      <form action={deleteExpense}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="back" value={back} />
                        <SubmitButton variant="ghost" className="h-8 px-2" confirm="Удалить расход?">
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Удалить</span>
                        </SubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </PageBody>
    </>
  )
}
