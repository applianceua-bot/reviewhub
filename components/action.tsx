import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-brand-foreground hover:bg-brand/90',
  secondary: 'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/70',
  ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
}

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[0.95rem]',
}

export function actionClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

type ActionProps = {
  variant?: Variant
  size?: Size
}

export function ActionLink({
  variant,
  size,
  className,
  ...props
}: ActionProps & ComponentPropsWithoutRef<'a'>) {
  return <a className={actionClass(variant, size, className)} {...props} />
}

export function ActionButton({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: ActionProps & ComponentPropsWithoutRef<'button'>) {
  return <button type={type} className={actionClass(variant, size, className)} {...props} />
}
