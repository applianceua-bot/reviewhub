'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Переключатель языка сайта.
 *
 * Сейчас реально работает только русская версия — это единственный
 * пункт меню без пометки. Остальные языки — заглушки на будущее
 * (сюда позже подключим отдельные EN/UK-версии копирайтинга).
 * Когда появятся другие версии — добавьте их в массив `languages`
 * и подключите переключение локали/маршрута.
 */
const languages = [
  { code: 'RU', label: 'Русский', available: true },
  { code: 'EN', label: 'English (US)', available: false },
  { code: 'UK', label: 'English (UK)', available: false },
] as const

export function LanguageSwitcher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<(typeof languages)[number]['code']>('RU')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground md:w-auto"
      >
        <Globe className="size-4" />
        {current}
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/30 md:left-0 md:right-auto"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={current === lang.code}
              disabled={!lang.available}
              onClick={() => {
                if (!lang.available) return
                setCurrent(lang.code)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors',
                lang.available
                  ? 'text-foreground hover:bg-secondary'
                  : 'cursor-not-allowed text-muted-foreground/50',
              )}
            >
              <span>{lang.label}</span>
              {current === lang.code ? (
                <Check className="size-4 text-primary" />
              ) : !lang.available ? (
                <span className="text-xs text-muted-foreground/70">Скоро</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
