import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn, revealDelay } from '@/lib/utils'

/** Building blocks for cabinet and admin pages (server-safe, no hooks). */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-6 px-4 py-6 md:px-8', className)}>{children}</div>
}

export function Card({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section data-reveal className={cn('min-w-0 rounded-lg border border-border bg-card', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && <h2 className="text-sm font-medium">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function Delta({
  value,
  format = (v) => v.toFixed(2),
  invert = false,
}: {
  value: number | null
  format?: (value: number) => string
  invert?: boolean
}) {
  if (value === null || Number.isNaN(value)) return <span className="text-xs text-muted-foreground">—</span>
  const flat = Math.abs(value) < 0.005
  const good = invert ? value < 0 : value > 0
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums',
        flat ? 'bg-muted text-muted-foreground' : good ? 'bg-positive/12 text-positive' : 'bg-negative/12 text-negative',
      )}
    >
      <Icon className="size-3" />
      {value > 0 && !flat ? '+' : ''}
      {format(value)}
    </span>
  )
}

export function Kpi({
  label,
  value,
  delta,
  hint,
  revealIndex = 0,
}: {
  label: string
  value: React.ReactNode
  delta?: React.ReactNode
  hint?: string
  /** Position in a row of KPIs, so they cascade in left-to-right instead of firing at once. */
  revealIndex?: number
}) {
  return (
    <div data-reveal style={revealDelay(revealIndex, 70)} className="card-lift rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {delta}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const BADGE_TONES = {
  neutral: 'border-border bg-muted text-muted-foreground',
  positive: 'border-positive/25 bg-positive/10 text-positive',
  negative: 'border-negative/25 bg-negative/10 text-negative',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  brand: 'border-primary/25 bg-primary/10 text-primary',
  info: 'border-chart-2/25 bg-chart-2/10 text-chart-2',
} as const

export type BadgeTone = keyof typeof BADGE_TONES

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs font-medium', BADGE_TONES[tone])}>
      {children}
    </span>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

/** Horizontally scrollable table wrapper with the dashboard's row styling. */
export function Table({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table
        className={cn(
          compact ? 'min-w-[420px]' : 'min-w-[640px]',
          'w-full text-sm [&_td]:border-t [&_td]:border-border [&_td]:px-5 [&_td]:py-2.5 [&_td]:align-middle [&_th]:px-5 [&_th]:pb-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground [&_tbody_tr:hover]:bg-muted/40',
        )}
      >
        {children}
      </table>
    </div>
  )
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-warning" aria-label={`${value} из 5`}>
      {'★★★★★'.slice(0, value)}
      <span className="text-muted-foreground/40">{'★★★★★'.slice(value)}</span>
    </span>
  )
}

export function Progress({ value, className, revealIndex = 0 }: { value: number; className?: string; revealIndex?: number }) {
  return (
    <div data-reveal style={revealDelay(revealIndex, 60)} className={cn('h-1.5 overflow-hidden rounded-full bg-muted', className)}>
      <div className="dash-progress-fill h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
    </div>
  )
}

export function DemoBadge() {
  return (
    <span className="rounded-md border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-warning">
      Демо
    </span>
  )
}
