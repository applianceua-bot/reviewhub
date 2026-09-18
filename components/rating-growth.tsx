'use client'

import { useEffect, useRef, useState } from 'react'
import { Star, TrendingUp, Check } from 'lucide-react'
import { CountUp } from '@/components/count-up'

/**
 * Signature animated element: a rating that visibly climbs.
 * An SVG trend line draws in, the score counts up, stars pop in,
 * and floating review chips rise around the card.
 */
export function RatingGrowth() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Climbing trend line (pathLength normalized to 100 for the draw animation).
  const line = 'M0 116 L40 108 L80 112 L120 88 L160 78 L200 56 L240 40 L280 20'
  const area = `${line} L280 140 L0 140 Z`

  return (
    <div
      ref={ref}
      className={`relative pt-20 pb-24 md:pt-24 md:pb-28 ${active ? 'rr-animate' : ''}`}
      aria-label="Рейтинг бренда растёт с 2.4 до 4.9 звёзд"
    >
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card to-card/40 p-6 md:p-7">
        {/* header: score + stars */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Рейтинг бренда
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold tracking-tight text-foreground">
                {active ? (
                  <CountUp value={4.9} decimals={1} duration={2000} />
                ) : (
                  '2.4'
                )}
              </span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-gold">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="rr-star size-5 fill-current"
                  style={{ animationDelay: `${1.5 + i * 0.14}s` }}
                />
              ))}
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <TrendingUp className="size-4" />
            +2.5
          </span>
        </div>

        {/* animated trend chart */}
        <div className="relative mt-6">
          <svg
            viewBox="0 0 280 140"
            className="h-40 w-full"
            preserveAspectRatio="none"
            role="img"
            aria-hidden="true"
            style={{ ['--rr-len' as string]: '100' }}
          >
            <defs>
              <linearGradient id="rr-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="rr-area" d={area} fill="url(#rr-fill)" />
            <path
              className="rr-line"
              d={line}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={100}
            />
            <circle className="rr-dot" cx="280" cy="20" r="5" fill="var(--color-primary)" />
            <circle className="rr-dot" cx="280" cy="20" r="9" fill="var(--color-primary)" fillOpacity="0.25" />
          </svg>
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Месяц 1</span>
            <span>Месяц 6</span>
          </div>
        </div>
      </div>

      {/* floating review chips — anchored in the padded gutter above/below the
          card, never over it, so the score and chart stay fully readable */}
      <ReviewChip
        position="top-0 left-0"
        enterDelay="2s"
        floatDelay="2.7s"
        floatDuration="6.5s"
        label="Trustpilot"
        value="+0.6 за неделю"
      />
      <ReviewChip
        position="top-0 right-0"
        enterDelay="2.3s"
        floatDelay="3s"
        floatDuration="7.8s"
        label="Google"
        value="Новый отзыв 5★"
      />
      <ReviewChip
        position="bottom-0 left-1/2 -translate-x-1/2"
        enterDelay="2.6s"
        floatDelay="3.3s"
        floatDuration="8.6s"
        label="G2"
        value="Негатив вытеснен"
      />
    </div>
  )
}

function ReviewChip({
  label,
  value,
  position,
  enterDelay,
  floatDelay,
  floatDuration,
}: {
  label: string
  value: string
  position: string
  enterDelay: string
  floatDelay: string
  floatDuration: string
}) {
  return (
    <div className={`rr-chip-enter absolute z-10 ${position}`} style={{ animationDelay: enterDelay }}>
      <div
        className="rr-float flex items-center gap-2 rounded-xl border border-border bg-card/95 px-2.5 py-1.5 shadow-lg shadow-black/30 backdrop-blur"
        style={{ animationDelay: floatDelay, animationDuration: floatDuration }}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Check className="size-3.5" />
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-semibold text-foreground">{label}</span>
          <span className="block text-[10px] text-muted-foreground">{value}</span>
        </span>
      </div>
    </div>
  )
}
