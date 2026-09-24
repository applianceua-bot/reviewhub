import { SectionHeading } from '@/components/section-heading'
import { processSteps } from '@/lib/site'
import { revealDelay } from '@/lib/utils'

/**
 * «Как мы работаем»: a numbered timeline. On desktop a connector line draws
 * across the step markers when the list scrolls into view (.rr-connector in
 * globals.css); on mobile the steps stack with a vertical rail.
 */
export function Process() {
  return (
    <section id="process" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 md:py-24">
      <SectionHeading
        eyebrow="Процесс"
        title="Как проходит работа над репутацией"
        description="Четыре понятных шага от первой заявки до ежемесячных отчётов. На каждом этапе вы знаете, что происходит с репутацией бренда и за что платите."
      />

      <div className="relative mt-14">
        <div
          data-reveal
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-5 top-5 hidden lg:block"
        >
          <div className="h-px bg-border">
            <div className="rr-connector h-px bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
          </div>
        </div>

        <ol className="grid gap-10 lg:grid-cols-4 lg:gap-6">
          {processSteps.map((step, i) => (
            <li
              key={step.title}
              data-reveal
              style={revealDelay(i, 140)}
              className="relative pl-16 lg:pl-0"
            >
              {i < processSteps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-[-2.5rem] left-5 top-12 w-px bg-border lg:hidden"
                />
              )}
              <span className="absolute left-0 top-0 z-10 flex size-10 items-center justify-center rounded-full border border-primary/40 bg-background font-display text-sm font-bold text-primary lg:relative">
                {i + 1}
              </span>
              <h3 className="font-display text-lg font-semibold text-foreground lg:mt-6">
                {step.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
              <p className="mt-4 inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground/80">
                {step.meta}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
