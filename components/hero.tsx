import { Send, ArrowRight, Star } from 'lucide-react'
import { ActionLink } from '@/components/action'
import { CountUp } from '@/components/count-up'
import { RatingGrowth } from '@/components/rating-growth'
import { stats, site } from '@/lib/site'

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[-10%] -z-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-16 md:pb-16 md:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* copy */}
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3 fill-current" />
                ))}
              </span>
              Управляем онлайн-репутацией брендов с 2016 года
            </div>

            <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Управление <span className="text-primary">репутацией</span>{' '}
              <br />
              бренда в интернете
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg lg:mx-0">
              {site.name} — SERM-агентство. Мы делаем так, чтобы по запросу с названием вашей
              компании клиенты видели доверие, а не негатив: вытесняем плохие статьи из поиска,
              работаем с отзывами и поднимаем рейтинг на Trustpilot, G2, в Google и App Store.
              Работаем с компаниями из любой страны.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <ActionLink href="#lead" size="lg" className="w-full sm:w-auto">
                Получить бесплатный аудит репутации
                <ArrowRight className="size-4" />
              </ActionLink>
              <ActionLink
                href={site.telegram}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                <Send className="size-4" />
                Написать в Telegram
              </ActionLink>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Аудит поисковой выдачи и отзывов — бесплатно. Отвечаем в течение рабочего дня.
            </p>
          </div>

          {/* signature animated element */}
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <RatingGrowth />
          </div>
        </div>

        <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card px-5 py-6 text-center">
              <dt className="font-display text-3xl font-bold text-foreground md:text-4xl">
                <CountUp
                  value={s.value}
                  decimals={s.decimals ?? 0}
                  suffix={s.suffix ?? ''}
                />
              </dt>
              <dd className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
