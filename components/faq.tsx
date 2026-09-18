'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { faq } from '@/lib/site'

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-20 md:py-28">
      <SectionHeading
        eyebrow="Вопросы"
        title="Часто задаваемые вопросы"
        description="Собрали ответы на вопросы, которые чаще всего задают перед началом работы с RatingRise."
        align="center"
      />

      <div className="mt-12 flex flex-col gap-3">
        {faq.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q} className="rounded-2xl border border-border bg-card">
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
    </section>
  )
}
