'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { faq } from '@/lib/site'
import { revealDelay } from '@/lib/utils'

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow="Вопросы"
            title="Вопросы об управлении репутацией"
            description="Коротко отвечаем на то, о чём чаще всего спрашивают перед началом работы: сроки, цены, методы и отчётность."
          />
        </div>

        <div className="flex flex-col gap-3">
          {faq.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={item.q}
                data-reveal
                style={revealDelay(i, 60)}
                className={`rounded-2xl border bg-card transition-colors ${
                  isOpen ? 'border-primary/40' : 'border-border hover:border-primary/25'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-display text-base font-semibold text-foreground">
                    {item.q}
                  </span>
                  <Plus
                    className={`size-5 shrink-0 text-primary transition-transform duration-200 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-200 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
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
