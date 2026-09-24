'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BarChart3,
  Building2,
  CalendarCheck,
  ChevronsLeft,
  ClipboardPen,
  FileText,
  Flag,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  MessagesSquare,
  Plug,
  Radar,
  Star,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

const ICONS = {
  overview: LayoutDashboard,
  clients: Users,
  brands: Building2,
  entry: ClipboardPen,
  reviews: Star,
  removal: Flag,
  mentions: MessagesSquare,
  integrations: Plug,
  plan: CalendarCheck,
  forecast: LineChart,
  reports: FileText,
  expenses: Wallet,
  portfolio: BarChart3,
  investigations: Radar,
} as const

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS }
export type NavGroup = { title?: string; items: NavItem[] }

type Props = {
  nav: NavGroup[]
  user: { name: string; login: string; role: 'admin' | 'client' }
  logout: () => Promise<void>
  switchHref?: { href: string; label: string }
  children: React.ReactNode
}

const COLLAPSE_KEY = 'rr-dash-collapsed'

export function DashShell({ nav, user, logout, switchHref, children }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1')
    } catch {}
  }, [])

  useEffect(() => setMobileOpen(false), [pathname])

  function toggle() {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, value ? '0' : '1')
      } catch {}
      return !value
    })
  }

  const isActive = (href: string) =>
    href === '/admin' || href === '/cabinet' ? pathname === href : pathname.startsWith(href)

  const sidebar = (compact: boolean) => (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-14 items-center border-b border-border', compact ? 'justify-center px-2' : 'px-4')}>
        <Link href={user.role === 'admin' ? '/admin' : '/cabinet'} className="flex items-center gap-2 overflow-hidden">
          {compact ? (
            <span className="grid size-7 place-items-center rounded-md bg-brand text-xs font-bold text-brand-foreground">R</span>
          ) : (
            <Logo />
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {nav.map((group, gi) => (
          <div key={gi} className="mb-4">
            {group.title && !compact && (
              <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon]
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={compact ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
                        compact && 'justify-center px-0',
                        active
                          ? 'bg-primary/12 text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className={cn('size-4 shrink-0', active && 'text-primary')} />
                      {!compact && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-2">
        {switchHref && !compact && (
          <Link
            href={switchHref.href}
            className="mb-1 flex h-9 items-center rounded-md px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {switchHref.label}
          </Link>
        )}
        <div className={cn('flex items-center gap-2.5 rounded-md p-2', compact && 'justify-center')}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold uppercase">
            {user.name.slice(0, 1)}
          </span>
          {!compact && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.role === 'admin' ? 'Администратор' : 'Клиент'} · {user.login}
              </p>
            </div>
          )}
        </div>
        <form action={logout}>
          <button
            type="submit"
            title="Выйти"
            className={cn(
              'flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              compact && 'justify-center px-0',
            )}
          >
            <LogOut className="size-4" />
            {!compact && 'Выйти'}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="dash min-h-dvh">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-card transition-[width] duration-200 md:block',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        {sidebar(collapsed)}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          className="absolute top-4 -right-3 grid size-6 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ChevronsLeft className={cn('size-3.5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card">
            {sidebar(false)}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Закрыть меню"
              className="absolute top-3.5 right-3 grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </aside>
        </div>
      )}

      <div className={cn('transition-[padding] duration-200', collapsed ? 'md:pl-16' : 'md:pl-60')}>
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Открыть меню"
            className="grid size-8 place-items-center rounded-md border border-border"
          >
            <Menu className="size-4" />
          </button>
          <Logo />
        </div>
        {children}
      </div>
    </div>
  )
}
