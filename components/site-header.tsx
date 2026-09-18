'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Send } from 'lucide-react'
import { ActionLink } from '@/components/action'
import { Logo } from '@/components/logo'
import { LanguageSwitcher } from '@/components/language-switcher'
import { nav, site } from '@/lib/site'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/#top" className="shrink-0" aria-label={`${site.name} — на главную`}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Основная навигация">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ActionLink
            href={site.telegram}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
          >
            <Send className="size-4" />
            Telegram
          </ActionLink>
          <ActionLink href="#lead">Оставить заявку</ActionLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-md text-foreground md:hidden"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4" aria-label="Мобильная навигация">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-3">
              <LanguageSwitcher className="w-full" />
              <ActionLink
                href={site.telegram}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
              >
                <Send className="size-4" />
                Написать в Telegram
              </ActionLink>
              <ActionLink href="#lead" onClick={() => setOpen(false)}>
                Оставить заявку
              </ActionLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
