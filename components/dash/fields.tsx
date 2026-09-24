import { inputClass } from '@/components/dash/styles'
import { cn } from '@/lib/utils'

/** Plain labelled form controls for server-action forms. */

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClass(props.className)} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={inputClass(cn('h-auto min-h-20 py-2', props.className))} />
}

export function Select({
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: Record<string, string> | readonly { value: string | number; label: string }[]
  placeholder?: string
}) {
  const list = Array.isArray(options)
    ? (options as readonly { value: string | number; label: string }[])
    : Object.entries(options).map(([value, label]) => ({ value, label }))
  return (
    <select {...props} className={inputClass(props.className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {list.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/** Flash message passed back through ?ok= / ?error= after a server action redirect. */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={cn(
        'rounded-md border px-4 py-2.5 text-sm',
        error ? 'border-negative/30 bg-negative/10 text-negative' : 'border-positive/30 bg-positive/10 text-positive',
      )}
    >
      {error ?? ok}
    </div>
  )
}
