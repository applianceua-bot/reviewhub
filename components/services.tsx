import {
  Check,
  MessageSquareText,
  Radar,
  Search,
  ShieldAlert,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { services } from '@/lib/site'
import { revealDelay } from '@/lib/utils'

const icons: Record<(typeof services)[number]['icon'], LucideIcon> = {
  search: Search,
  reviews: MessageSquareText,
  radar: Radar,
  shield: ShieldAlert,
  store: Store,
  users: Users,
}

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 md:py-24">
      <SectionHeading
        eyebrow="Услуги"
        title="Услуги по управлению репутацией бренда"
        description="Управляем всем, что люди находят о вашей компании в интернете: поисковой выдачей, отзывами, профилями на картах и упоминаниями в соцсетях."
      />

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => {
          const Icon = icons[service.icon]
          return (
            <article
              key={service.title}
              data-reveal
              style={revealDelay(i % 3)}
              className="card-lift group flex flex-col rounded-2xl border border-border bg-card p-6"
            >
              <span className="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                {service.title}
              </h3>
              <p className="mb-5 mt-3 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
              <ul className="mt-auto flex flex-col gap-2.5 border-t border-border pt-5">
                {service.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-foreground/90">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>
    </section>
  )
}
