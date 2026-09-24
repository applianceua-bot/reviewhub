import { SectionHeading } from '@/components/section-heading'
import { PlatformLogo } from '@/components/platform-logo'
import {
  reviewPlatforms,
  igamingPlatforms,
  cryptoPlatforms,
  fintechPlatforms,
  blogPlatforms,
} from '@/lib/site'
import { revealDelay } from '@/lib/utils'

/** Площадки, которые не участвуют в калькуляторе, но тоже входят в нашу работу. */
const employerPlatforms = [
  { id: 'glassdoor', name: 'Glassdoor', domain: 'glassdoor.com' },
  { id: 'indeed', name: 'Indeed', domain: 'indeed.com' },
  { id: 'appstore', name: 'App Store', domain: 'apple.com' },
  { id: 'googleplay', name: 'Google Play', domain: 'play.google.com' },
] as const

/** Review platforms are one list (shared with the calculator), split here for display. */
const softwareIds = new Set(['g2', 'capterra', 'trustradius', 'getapp'])

type Chip = { id: string; name: string; domain: string; region?: string }

const reviewChips: readonly Chip[] = reviewPlatforms
const isRegional = (p: Chip) => Boolean(p.region)

const groups: { category: string; items: readonly Chip[] }[] = [
  {
    category: 'Международные отзовики',
    items: reviewChips.filter((p) => !softwareIds.has(p.id) && !isRegional(p)),
  },
  { category: 'Региональные отзовики', items: reviewChips.filter(isRegional) },
  { category: 'B2B и отзывы о софте', items: reviewChips.filter((p) => softwareIds.has(p.id)) },
  { category: 'iGaming: отзывы и жалобы игроков', items: igamingPlatforms },
  { category: 'Crypto: биржи и кошельки', items: cryptoPlatforms },
  { category: 'Fintech, банки и брокеры', items: fintechPlatforms },
  { category: 'Сообщества и обсуждения', items: blogPlatforms },
  { category: 'Работодатели и сторы приложений', items: employerPlatforms },
]

export function Platforms() {
  return (
    <section id="platforms" className="scroll-mt-20 border-y border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <SectionHeading
          eyebrow="Площадки"
          title="Отзывы на Trustpilot, G2, Google и других площадках"
          description="Работаем с отзовиками, которые Google показывает на первой странице по запросу «название бренда + reviews»: международными и региональными, а также с сообществами, площадками для работодателей и сторами приложений."
        />

        <div className="mt-12 flex flex-col gap-8">
          {groups.map((group) => (
            <div
              key={group.category}
              data-reveal
              className="flex flex-col gap-4 md:flex-row md:items-start"
            >
              <span className="w-full shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground md:w-52 md:pt-2.5">
                {group.category}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {group.items.map((platform, i) => (
                  <span
                    key={platform.id}
                    data-reveal
                    style={revealDelay(i, 40)}
                    className="flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-sm text-foreground/90 transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground"
                  >
                    <PlatformLogo domain={platform.domain} name={platform.name} size={18} />
                    {platform.name}
                    {platform.region && (
                      <span className="text-xs text-muted-foreground">· {platform.region}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
