'use client'

import { useActionState, useState } from 'react'
import { Copy, KeyRound } from 'lucide-react'
import { createClient, resetPassword, type CredentialsState } from '@/app/admin/actions'
import { buttonClass, inputClass } from '@/components/dash/styles'

/** Shows freshly issued credentials once; they can't be viewed again later. */
function Issued({ state }: { state: CredentialsState }) {
  const [copied, setCopied] = useState(false)
  if (state.error) {
    return <p role="alert" className="rounded-md border border-negative/30 bg-negative/10 px-3 py-2 text-sm text-negative">{state.error}</p>
  }
  if (!state.password) return null
  const text = `Логин: ${state.login}\nПароль: ${state.password}`
  return (
    <div role="status" className="rounded-md border border-positive/30 bg-positive/10 p-3 text-sm">
      <p className="font-medium text-positive">Доступ выдан. Пароль показан один раз — передайте его клиенту.</p>
      <pre className="mt-2 rounded bg-background/60 px-3 py-2 font-mono text-xs text-foreground">{text}</pre>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}
        className={buttonClass('secondary', 'mt-2 h-8 text-xs')}
      >
        <Copy className="size-3.5" /> {copied ? 'Скопировано' : 'Скопировать'}
      </button>
    </div>
  )
}

export function CreateClientForm({ brands }: { brands: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState<CredentialsState, FormData>(createClient, {})
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Имя или компания</span>
          <input name="name" required maxLength={120} className={inputClass()} placeholder="ООО «Пример»" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Логин</span>
          <input name="login" required pattern="[a-zA-Z0-9._\-]{3,40}" className={inputClass()} placeholder="example" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Роль</span>
          <select name="role" defaultValue="client" className={inputClass()}>
            <option value="client">Клиент — видит только свои бренды</option>
            <option value="admin">Администратор — полный доступ</option>
          </select>
        </label>
      </div>
      {brands.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-muted-foreground">Доступ к брендам</legend>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <label key={b.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm has-checked:border-primary/50 has-checked:bg-primary/10">
                <input type="checkbox" name="brands" value={b.id} className="accent-[var(--brand)]" />
                {b.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div>
        <button type="submit" disabled={pending} className={buttonClass('primary')}>
          {pending ? 'Создаю…' : 'Создать доступ'}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">Пароль сгенерируется автоматически. В базе хранится только его хеш.</p>
      </div>
      <Issued state={state} />
    </form>
  )
}

export function ResetPasswordForm({ userId }: { userId: number }) {
  const [state, action, pending] = useActionState<CredentialsState, FormData>(resetPassword, {})
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={userId} />
      <div className="flex flex-wrap gap-2">
        <input name="password" type="text" autoComplete="new-password" minLength={8} placeholder="Свой пароль или пусто — сгенерировать" className={inputClass('h-8 w-72 text-xs')} />
        <button type="submit" disabled={pending} className={buttonClass('secondary', 'h-8 text-xs')}>
          <KeyRound className="size-3.5" /> {pending ? 'Меняю…' : 'Сменить пароль'}
        </button>
      </div>
      <Issued state={state} />
    </form>
  )
}
