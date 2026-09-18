import { Check } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { services } from '@/lib/site'

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:py-28">
      <SectionHeading
        eyebrow="Услуги"
        title="Что входит в управление репутацией бренда"
        description="От поисковой выдачи до отзывов клиентов и карточек компании — закрываем все каналы, где формируется доверие к бренду."
      />

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.title}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <h3 className="font-display text-lg font-semibold text-foreground">
              {service.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {service.description}
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 border-t border-border pt-5">
              {service.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
