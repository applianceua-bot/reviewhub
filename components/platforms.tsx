import { SectionHeading } from '@/components/section-heading'
import { PlatformLogo } from '@/components/platform-logo'
import { reviewPlatforms, blogPlatforms } from '@/lib/site'

/** Площадки, которые не участвуют в калькуляторе, но тоже входят в нашу работу. */
const employerPlatforms = [
  { id: 'glassdoor', name: 'Glassdoor', domain: 'glassdoor.com' },
  { id: 'indeed', name: 'Indeed', domain: 'indeed.com' },
  { id: 'appstore', name: 'App Store', domain: 'apple.com' },
  { id: 'googleplay', name: 'Google Play', domain: 'play.google.com' },
] as const

const groups = [
  { category: 'Review-платформы', items: reviewPlatforms },
  { category: 'Blog-платформы и сообщества', items: blogPlatforms },
  { category: 'Работодатель и сторы приложений', items: employerPlatforms },
]

export function Platforms() {
  return (
    <section id="platforms" className="scroll-mt-20 border-y border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionHeading
          eyebrow="Площадки"
          title="Площадки, которые формируют мнение о бренде"
          description="Отзовики, поисковые системы, тематические сообщества, площадки для работодателей и сторы приложений — работаем со всеми каналами, которые видит ваша аудитория, независимо от страны."
        />

        <div className="mt-12 flex flex-col gap-8">
          {groups.map((group) => (
            <div key={group.category} className="flex flex-col gap-4 md:flex-row md:items-start">
              <span className="w-full shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground md:w-52 md:pt-2.5">
                {group.category}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {group.items.map((platform) => (
                  <span
                    key={platform.name}
                    className="flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-sm text-foreground/90 transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <PlatformLogo domain={platform.domain} name={platform.name} size={18} />
                    {platform.name}
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
