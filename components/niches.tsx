import { SectionHeading } from '@/components/section-heading'
import { niches } from '@/lib/site'

export function Niches() {
  return (
    <section id="niches" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:py-28">
      <SectionHeading
        eyebrow="Ниши"
        title="Ниши, в которых мы разбираемся глубже других"
        description="Crypto, iGaming, fintech, SaaS и affiliate — ниши с самыми высокими требованиями к репутации бренда."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {niches.map((niche) => (
          <div
            key={niche.title}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
          >
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-3 select-none font-display text-6xl font-bold text-primary/10"
            >
              {niche.num}
            </span>
            <h3 className="relative font-display text-lg font-semibold text-foreground">{niche.title}</h3>
            <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{niche.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
