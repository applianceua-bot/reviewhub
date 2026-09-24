import { Lock, ShieldCheck, Target, type LucideIcon } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { trustPoints } from '@/lib/site'
import { revealDelay } from '@/lib/utils'

const icons: Record<(typeof trustPoints)[number]['icon'], LucideIcon> = {
  lock: Lock,
  shield: ShieldCheck,
  target: Target,
}

export function Trust() {
  return (
    <section id="trust" className="scroll-mt-20 border-y border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <SectionHeading
            eyebrow="Гарантии"
            title="Безопасное управление репутацией"
            description="Репутация — чувствительная тема. Поэтому мы работаем только законными методами, сохраняем конфиденциальность и заранее фиксируем правила работы."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {trustPoints.map((point, i) => {
              const Icon = icons[point.icon]
              return (
                <div
                  key={point.title}
                  data-reveal
                  style={revealDelay(i)}
                  className={`card-lift rounded-2xl border border-border bg-background p-6 ${
                    // an odd card out spans the full row instead of leaving a gap
                    i === trustPoints.length - 1 && trustPoints.length % 2 === 1 ? 'sm:col-span-2' : ''
                  }`}
                >
                  <Icon className="size-6 text-primary" strokeWidth={1.75} />
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {point.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
