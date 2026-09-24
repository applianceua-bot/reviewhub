'use client'

import { useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { workFormats } from '@/lib/site'
import { revealDelay } from '@/lib/utils'

export function WorkFormats() {
  const [open, setOpen] = useState<string | null>(workFormats[1].id)

  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div data-reveal className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
            <span className="h-px w-6 bg-primary" />
            Форматы
          </span>
          <h2 className="mt-4 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Форматы работы и цены на SERM
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Выберите формат под свою задачу: разовые публикации на нужных площадках, комплексная
            работа с отзывами и упоминаниями или полное сопровождение репутации бренда под ключ.
            Площадки и язык публикаций подбираем под вашу аудиторию.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Нужна поштучная цена?{' '}
            <a href="#calculator" className="font-medium text-primary underline underline-offset-4">
              Посчитайте в калькуляторе
            </a>{' '}
            или{' '}
            <a href="#services" className="font-medium text-primary underline underline-offset-4">
              посмотрите услуги
            </a>
            .
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-5">
          {workFormats.map((format, i) => {
            const isOpen = open === format.id
            return (
              <div
                key={format.id}
                data-reveal
                style={revealDelay(i, 90)}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  isOpen ? 'border-primary/50 bg-card' : 'border-border bg-card/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : format.id)}
                  aria-expanded={isOpen}
                  className="flex w-full flex-col gap-4 p-6 text-left sm:flex-row sm:items-center sm:justify-between md:p-8"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl border font-display text-sm font-bold ${
                        isOpen
                          ? 'border-primary/50 text-primary shadow-[0_0_24px_-8px_var(--color-primary)]'
                          : 'border-border text-primary/80'
                      }`}
                    >
                      {format.id}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-display text-lg font-semibold text-foreground md:text-xl">
                          {format.title}
                        </h3>
                        {'badge' in format && format.badge && (
                          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                            {format.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">{format.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:text-right">
                    <div>
                      <p className="font-display text-xl font-bold text-foreground md:text-2xl">{format.price}</p>
                      <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
                        {format.priceNote}
                      </p>
                    </div>
                    <ChevronDown
                      className={`size-5 shrink-0 text-primary transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-border px-6 pb-8 pt-6 md:px-8">
                      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                        {format.description}
                      </p>

                      <div
                        className={`mt-8 grid gap-8 ${
                          format.columns.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
                        }`}
                      >
                        {format.columns.map((col) => (
                          <div key={col.heading}>
                            <p
                              className={`text-xs font-semibold uppercase tracking-wide ${
                                col.tone === 'negative' ? 'text-destructive' : 'text-primary'
                              }`}
                            >
                              {col.heading}
                            </p>
                            <ul className="mt-3 flex flex-col gap-2.5">
                              {col.items.map((item) => (
                                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
                                  {col.tone === 'negative' ? (
                                    <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                                  ) : (
                                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                                  )}
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {'platformsList' in format && format.platformsList && (
                        <div className="mt-8">
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                            Доступные площадки
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {format.platformsList.map((p) => (
                              <span
                                key={p}
                                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground/90"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {'footnote' in format && format.footnote && (
                        <p className="mt-8 text-sm italic leading-relaxed text-muted-foreground">
                          {format.footnote}
                        </p>
                      )}

                      <a
                        href="#lead"
                        className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
                      >
                        {format.cta}
                        <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
