'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, Mail, Send, ShieldCheck } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { PlatformLogo } from '@/components/platform-logo'
import { reviewPlatforms, blogPlatforms, site } from '@/lib/site'

type Group = 'review' | 'blog'

const groups: { id: Group; label: string; platforms: typeof reviewPlatforms | typeof blogPlatforms }[] = [
  { id: 'review', label: 'Отзывы', platforms: reviewPlatforms },
  { id: 'blog', label: 'Блоги и сообщества', platforms: blogPlatforms },
]

const TIERS = [
  { id: 'low', min: 1, max: 49, label: '1–49 шт.', factor: 1 },
  { id: 'mid', min: 50, max: 149, label: '50+ шт.', factor: 10 / 15 },
  { id: 'high', min: 150, max: 1000, label: '150+ шт.', factor: 8 / 15 },
] as const

function tierFor(qty: number) {
  return TIERS.find((t) => qty >= t.min && qty <= t.max) ?? TIERS[TIERS.length - 1]
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function PriceCalculator() {
  const [group, setGroup] = useState<Group>('review')
  const [platformId, setPlatformId] = useState(reviewPlatforms[0].id as string)
  const [quantity, setQuantity] = useState(50)

  const allPlatforms = [...reviewPlatforms, ...blogPlatforms]
  const platform = allPlatforms.find((p) => p.id === platformId) ?? reviewPlatforms[0]
  const activePlatforms = groups.find((g) => g.id === group)!.platforms

  const tier = tierFor(quantity)
  const unitPrice = useMemo(() => Math.round(platform.basePrice * tier.factor), [platform, tier])
  const total = unitPrice * quantity

  function selectGroup(id: Group) {
    setGroup(id)
    const first = groups.find((g) => g.id === id)!.platforms[0]
    setPlatformId(first.id as string)
  }

  return (
    <section id="calculator" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:py-28">
      <SectionHeading
        eyebrow="Цены"
        title={`Цена публикации: от $${Math.round(reviewPlatforms[0].basePrice * TIERS[2].factor)} на ${reviewPlatforms[0].name}`}
        description="Выберите площадку и нужный объём публикаций — стоимость в USD рассчитается автоматически."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => selectGroup(g.id)}
                aria-pressed={group === g.id}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  group === g.id
                    ? 'border-primary/60 bg-primary/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Площадка
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {activePlatforms.map((p) => {
              const active = platformId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatformId(p.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors ${
                    active
                      ? 'border-primary/60 bg-primary/10 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground'
                  }`}
                >
                  <PlatformLogo domain={p.domain} name={p.name} size={28} />
                  <span className="truncate">{p.name}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Количество публикаций
            </p>
            <span className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground">
              {quantity} <span className="font-normal text-muted-foreground">шт.</span>
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={1000}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
            aria-label="Количество публикаций"
          />
          <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
            <span>1</span>
            <span>50</span>
            <span>150</span>
            <span>500</span>
            <span>1000</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {TIERS.map((t) => {
              const active = tier.id === t.id
              const price = Math.round(platform.basePrice * t.factor)
              return (
                <div
                  key={t.id}
                  className={`rounded-xl border px-3 py-3 text-center ${
                    active ? 'border-primary/60 bg-primary/10' : 'border-border bg-background'
                  }`}
                >
                  <p
                    className={`text-xs font-medium uppercase tracking-wide ${
                      active ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {t.label}
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">
                    {formatUsd(price)}
                    <span className="text-xs font-normal text-muted-foreground">/шт</span>
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-b from-card to-card/40 p-6 md:p-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Стоимость</p>
            <p className="mt-3 text-sm text-muted-foreground">Итого</p>
            <p className="mt-1 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {formatUsd(total)}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {formatUsd(unitPrice)} за публикацию · {tier.label}
            </span>

            <dl className="mt-6 flex flex-col gap-3 border-t border-border pt-5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Площадка</dt>
                <dd className="flex items-center gap-1.5 font-medium text-foreground">
                  <PlatformLogo domain={platform.domain} name={platform.name} size={20} />
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary"
                  >
                    {platform.name}
                    <ExternalLink className="size-3" />
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Количество публикаций</dt>
                <dd className="font-medium text-foreground">{quantity}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border bg-background/60 p-3.5 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              2 недели гарантии после публикации. В случае блокировки — бесплатная замена.
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <a
              href={site.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-[0.95rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Send className="size-4" />
              Отправить расчёт в Telegram
            </a>
            <a
              href="#lead"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-6 text-[0.95rem] font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
            >
              <Mail className="size-4" />
              Отправить в форме
            </a>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Цены в USD. Финальная стоимость зависит от ниши, языка и текущей видимости бренда.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
