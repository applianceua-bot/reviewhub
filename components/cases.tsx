'use client'

import { useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { cases, caseFilters } from '@/lib/site'

export function Cases() {
  const [filter, setFilter] = useState<(typeof caseFilters)[number]>('Все')
  const [openCase, setOpenCase] = useState<string | null>(null)

  const filtered = filter === 'Все' ? cases : cases.filter((c) => c.niche === filter)

  return (
    <section id="cases" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:py-28">
      <SectionHeading
        eyebrow="Кейсы"
        title="Что мы делаем с рейтингом бренда на практике"
        description="Реальные результаты проектов за последние 18 месяцев по разным нишам и площадкам."
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {caseFilters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              filter === f
                ? 'border-primary/60 bg-primary/10 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {filtered.map((item) => {
          const key = `${item.niche}-${item.title}`
          const isOpen = openCase === key
          return (
            <article key={key} className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <span className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {item.niche}
              </span>
              <h3 className="mt-4 font-display text-base font-semibold leading-snug text-foreground">
                {item.title}
              </h3>

              <div className="mt-4 flex items-center gap-2.5">
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Before</p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">{item.before}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-primary" />
                <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-primary">After</p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">{item.after}</p>
                </div>
              </div>

              <p className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.geo}</span>
                <span>{item.duration}</span>
              </p>

              <button
                type="button"
                onClick={() => setOpenCase(isOpen ? null : key)}
                aria-expanded={isOpen}
                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary"
              >
                Подробнее
                <ChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <div
                className={`grid transition-all duration-200 ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
