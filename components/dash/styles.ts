import { cn } from '@/lib/utils'

/** Class helpers usable from both server and client components. */

export function inputClass(extra?: string) {
  return cn(
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/25',
    extra,
  )
}

export function buttonClass(variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary', extra?: string) {
  return cn(
    'inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60',
    variant === 'primary' && 'bg-brand text-brand-foreground hover:bg-brand/85',
    variant === 'secondary' && 'border border-border bg-muted text-foreground hover:bg-muted/70',
    variant === 'danger' && 'border border-negative/30 bg-negative/10 text-negative hover:bg-negative/20',
    variant === 'ghost' && 'text-muted-foreground hover:bg-muted hover:text-foreground',
    extra,
  )
}
