'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'
import { buttonClass, inputClass } from '@/components/dash/styles'

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ''} />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Логин</span>
        <input name="login" autoComplete="username" required autoFocus className={inputClass('h-10')} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Пароль</span>
        <input name="password" type="password" autoComplete="current-password" required className={inputClass('h-10')} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-md border border-negative/30 bg-negative/10 px-3 py-2 text-sm text-negative">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass('primary', 'mt-1 h-10')}>
        {pending ? 'Входим…' : 'Войти'}
      </button>
    </form>
  )
}
