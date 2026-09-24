import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/logo'
import { getUser } from '@/lib/auth/session'
import { dashFont } from '@/lib/dash/font'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Вход в личный кабинет — RatingRise',
  robots: { index: false, follow: false },
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getUser()
  if (user) redirect(user.role === 'admin' ? '/admin' : '/cabinet')
  const { next } = await searchParams

  return (
    <div className={`dash ${dashFont.variable} grid min-h-dvh place-items-center px-4`}>
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Вход в личный кабинет</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Логин и пароль выдаёт ваш менеджер RatingRise.
          </p>
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← На главную
          </Link>
        </p>
      </div>
    </div>
  )
}
