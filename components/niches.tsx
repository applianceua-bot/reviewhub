import { Bitcoin, Cloud, Dices, Heart, Landmark, Network, type LucideIcon } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { niches } from '@/lib/site'
import { revealDelay } from '@/lib/utils'

const icons: Record<(typeof niches)[number]['icon'], LucideIcon> = {
  dices: Dices,
  landmark: Landmark,
  bitcoin: Bitcoin,
  cloud: Cloud,
  network: Network,
  heart: Heart,
}

/**
 * Six niches in a 3-column grid (two rows of three), so every card gets a
 * readable line length.
 */
export function Niches() {
  return (
    <section id="niches" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 md:py-24">
      <SectionHeading
        eyebrow="Ниши"
        title="Управление репутацией в сложных нишах"
        description="Crypto, iGaming, fintech, SaaS, affiliate и dating — отрасли, где клиенты особенно внимательно читают отзывы, а одна волна негатива может стоить бизнесу продаж."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {niches.map((niche, i) => {
          const Icon = icons[niche.icon]
          return (
            <article
              key={niche.title}
              data-reveal
              style={revealDelay(i % 3)}
              className="card-lift group flex flex-col rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display text-lg font-semibold text-foreground">{niche.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{niche.description}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
