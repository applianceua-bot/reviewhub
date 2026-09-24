import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Inline style that staggers a `data-reveal` element by its index in a list. */
export function revealDelay(index: number, step = 70): React.CSSProperties {
  return { '--reveal-delay': `${index * step}ms` } as React.CSSProperties
}
