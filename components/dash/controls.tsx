'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { inputClass, buttonClass } from '@/components/dash/styles'
import { cn } from '@/lib/utils'

/** Switches ?brand=<id> on the current page. */
export function BrandPicker({
  brands,
  value,
  allowAll = false,
}: {
  brands: { id: number; name: string }[]
  value: number | null
  allowAll?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  if (brands.length < 2 && !allowAll) return null
  return (
    <select
      aria-label="Бренд"
      value={value ?? ''}
      onChange={(e) => {
        const next = new URLSearchParams(params)
        if (e.target.value) next.set('brand', e.target.value)
        else next.delete('brand')
        router.push(`${pathname}?${next}`)
      }}
      className={inputClass('w-auto min-w-44')}
    >
      {allowAll && <option value="">Все бренды</option>}
      {brands.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  )
}

export function SubmitButton({
  children,
  variant = 'primary',
  className,
  confirm,
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  className?: string
  confirm?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault()
      }}
      className={buttonClass(variant, className)}
    >
      {pending ? 'Сохраняю…' : children}
    </button>
  )
}

/** Submits the enclosing form as soon as the select changes (inline status edits). */
export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  label,
  className,
  placeholder,
}: {
  name: string
  defaultValue: string
  options: Record<string, string>
  label: string
  className?: string
  /** First option with an empty value, e.g. «Все бренды». */
  placeholder?: string
}) {
  return (
    <select
      name={name}
      aria-label={label}
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={inputClass(cn('h-7 w-auto py-0 text-xs', className))}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {Object.entries(options).map(([key, text]) => (
        <option key={key} value={key}>
          {text}
        </option>
      ))}
    </select>
  )
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass('secondary')}>
      Печать / PDF
    </button>
  )
}
