import type { Metadata } from 'next'
import { DashShell, type NavGroup } from '@/components/dash/shell'
import { requireAdmin } from '@/lib/auth/session'
import { dashFont } from '@/lib/dash/font'
import { logout } from '@/app/login/actions'

export const metadata: Metadata = {
  title: { default: 'Админка — RatingRise', template: '%s — админка RatingRise' },
  robots: { index: false, follow: false },
}

const NAV: NavGroup[] = [
  {
    items: [
      { href: '/admin', label: 'Портфель', icon: 'portfolio' },
      { href: '/admin/clients', label: 'Клиенты', icon: 'clients' },
      { href: '/admin/brands', label: 'Бренды', icon: 'brands' },
    ],
  },
  {
    title: 'Работа',
    items: [
      { href: '/admin/entry', label: 'Внесение данных', icon: 'entry' },
      { href: '/admin/reviews', label: 'Отзывы', icon: 'reviews' },
      { href: '/admin/removal', label: 'Проверка на удаление', icon: 'removal' },
      { href: '/admin/mentions', label: 'Упоминания', icon: 'mentions' },
      { href: '/admin/integrations', label: 'Интеграции', icon: 'integrations' },
    ],
  },
  {
    title: 'Планирование',
    items: [
      { href: '/admin/plan', label: 'План работ', icon: 'plan' },
      { href: '/admin/calculator', label: 'Калькулятор', icon: 'forecast' },
      { href: '/admin/reports', label: 'Отчёты', icon: 'reports' },
    ],
  },
  {
    title: 'Финансы',
    items: [{ href: '/admin/expenses', label: 'Расходы', icon: 'expenses' }],
  },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return (
    <div className={dashFont.variable}>
      <DashShell nav={NAV} user={user} logout={logout} switchHref={{ href: '/cabinet', label: 'Кабинет глазами клиента →' }}>
        {children}
      </DashShell>
    </div>
  )
}
