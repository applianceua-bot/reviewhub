import type { Metadata } from 'next'
import { DashShell, type NavGroup } from '@/components/dash/shell'
import { requireUser } from '@/lib/auth/session'
import { dashFont } from '@/lib/dash/font'
import { logout } from '@/app/login/actions'

export const metadata: Metadata = {
  title: { default: 'Личный кабинет — RatingRise', template: '%s — кабинет RatingRise' },
  robots: { index: false, follow: false },
}

const NAV: NavGroup[] = [
  {
    items: [
      { href: '/cabinet', label: 'Обзор', icon: 'overview' },
      { href: '/cabinet/reviews', label: 'Отзывы', icon: 'reviews' },
      { href: '/cabinet/removal', label: 'Проверка на удаление', icon: 'removal' },
      { href: '/cabinet/mentions', label: 'Упоминания', icon: 'mentions' },
      { href: '/cabinet/plan', label: 'План работ', icon: 'plan' },
      { href: '/cabinet/reports', label: 'Отчёты', icon: 'reports' },
    ],
  },
]

export default async function CabinetLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <div className={dashFont.variable}>
      <DashShell
        nav={NAV}
        user={user}
        logout={logout}
        switchHref={user.role === 'admin' ? { href: '/admin', label: '← В админку' } : undefined}
      >
        {children}
      </DashShell>
    </div>
  )
}
