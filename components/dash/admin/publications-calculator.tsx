'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Download, RotateCcw, Target } from 'lucide-react'
import { formatUsd, tierFor, unitPrice } from '@/lib/pricing'
import { reviewsNeeded, splitByAverage } from '@/lib/dash/rating-target'
import { Card } from '@/components/dash/ui'
import { Donut } from '@/components/dash/charts'
import { Input } from '@/components/dash/fields'
import { cn } from '@/lib/utils'

type Platform = {
  key: string
  name: string
  category: string
  basePrice: number
  /** Latest known rating and review count for this platform, from weekly entries; null/0 if never entered. */
  currentRating: number | null
  currentCount: number
}

/** Community platforms (Reddit, Quora, Product Hunt) don't show a star rating — they sell posts and comments instead of reviews. */
const NO_STAR_RATING_CATEGORY = 'Сообщества'

type Mode = 'quantity' | 'rating'

type Row = Platform & {
  hasStarRating: boolean
  mode: Mode
  target: number
  avgRating: number
  needed: number | null
  qty: number
  autoPrice: number
  price: number
  isCustomPrice: boolean
  postQty: number
  commentQty: number
  postPrice: number
  commentPrice: number
  split: { n5: number; n4: number; n3: number }
  subtotal: number
}

// Above the common 4.5★ brand target, so "До рейтинга" isn't "impossible" by default.
const DEFAULT_AVG_RATING = 4.7

/**
 * Per-brand publications quote.
 *
 * Review platforms: each row can be driven two ways —
 * - "Количество" — type how many publications directly.
 * - "До рейтинга" — set a target profile rating; the needed total is solved
 *   from the review-count-weighted average used everywhere else
 *   (lib/data/overview.ts).
 * Either way, "Средний рейтинг публикаций" picks what the new reviews
 * themselves average — splitByAverage (lib/dash/rating-target.ts) turns that
 * into an exact 5★/4★/3★ headcount; a uniform wall of 5★ reads as fake, and
 * this is also what the target-mode math treats as the incoming rating.
 *
 * Community platforms have no star rating at all, so instead of one
 * quantity they get two: posts and comments, each with its own price.
 *
 * Price is a plain editable field everywhere, pre-filled from the landing
 * page's volume pricing (lib/pricing.ts) but freely overridable — real
 * quotes rarely match the list price exactly.
 * Nothing here is saved; it's a scratchpad for building a quote on a call.
 */
export function PublicationsCalculator({ platforms, brandName, targetRating }: { platforms: Platform[]; brandName: string; targetRating: number }) {
  const [mode, setMode] = useState<Record<string, Mode>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [targets, setTargets] = useState<Record<string, number>>({})
  const [avgRatings, setAvgRatings] = useState<Record<string, number>>({})
  const [prices, setPrices] = useState<Record<string, number>>({})
  // Community platforms sell two different things instead of one review.
  const [postQuantities, setPostQuantities] = useState<Record<string, number>>({})
  const [commentQuantities, setCommentQuantities] = useState<Record<string, number>>({})
  const [postPrices, setPostPrices] = useState<Record<string, number>>({})
  const [commentPrices, setCommentPrices] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState(false)

  const rows = useMemo(
    () =>
      platforms.map((p) => {
        const hasStarRating = p.category !== NO_STAR_RATING_CATEGORY
        const rowMode: Mode = hasStarRating ? mode[p.key] ?? 'quantity' : 'quantity'
        const target = targets[p.key] ?? targetRating
        const avgRating = avgRatings[p.key] ?? DEFAULT_AVG_RATING
        const needed = hasStarRating && rowMode === 'rating' ? reviewsNeeded(p.currentRating, p.currentCount, target, avgRating) : null

        const postQty = postQuantities[p.key] ?? 0
        const commentQty = commentQuantities[p.key] ?? 0
        const postPrice = postPrices[p.key] ?? p.basePrice
        const commentPrice = commentPrices[p.key] ?? Math.round(p.basePrice * 0.2)

        const qty = !hasStarRating ? postQty + commentQty : rowMode === 'rating' ? needed ?? 0 : quantities[p.key] ?? 0
        const autoPrice = qty > 0 ? unitPrice(p.basePrice, qty) : p.basePrice
        const customPrice = prices[p.key]
        const price = customPrice ?? autoPrice
        const split = hasStarRating ? splitByAverage(qty, avgRating) : { n5: 0, n4: 0, n3: 0 }
        const subtotal = !hasStarRating ? postQty * postPrice + commentQty * commentPrice : price * qty

        return {
          ...p,
          hasStarRating,
          mode: rowMode,
          target,
          avgRating,
          needed,
          qty,
          autoPrice,
          price,
          isCustomPrice: customPrice !== undefined,
          postQty,
          commentQty,
          postPrice,
          commentPrice,
          split,
          subtotal,
        }
      }),
    [platforms, mode, targets, avgRatings, quantities, prices, postQuantities, commentQuantities, postPrices, commentPrices, targetRating],
  )
  const total = rows.reduce((sum, r) => sum + r.subtotal, 0)
  const activeRows = rows.filter((r) => r.qty > 0)
  const starTotals = activeRows.reduce(
    (acc, r) => ({ n5: acc.n5 + r.split.n5, n4: acc.n4 + r.split.n4, n3: acc.n3 + r.split.n3 }),
    { n5: 0, n4: 0, n3: 0 },
  )

  function setQty(key: string, value: number) {
    setQuantities((prev) => ({ ...prev, [key]: clampCount(value) }))
  }

  function setAvgRating(key: string, value: number) {
    setAvgRatings((prev) => ({ ...prev, [key]: Math.max(3, Math.min(5, value || DEFAULT_AVG_RATING)) }))
  }

  function clampCount(value: number) {
    return Math.max(0, Math.min(100_000, Math.round(value) || 0))
  }

  async function copySummary() {
    const summary = activeRows
      .map((r) => {
        if (!r.hasStarRating) {
          const parts = []
          if (r.postQty > 0) parts.push(`${r.postQty} постов × ${formatUsd(r.postPrice)}`)
          if (r.commentQty > 0) parts.push(`${r.commentQty} комментариев × ${formatUsd(r.commentPrice)}`)
          return `${r.name}: ${parts.join(' + ')} = ${formatUsd(r.subtotal)}`
        }
        const mixNote = r.split.n3 > 0 || r.split.n4 > 0 ? ` (${r.split.n5}×5★ + ${r.split.n4}×4★${r.split.n3 > 0 ? ` + ${r.split.n3}×3★` : ''})` : ''
        return `${r.name}: ${r.qty} шт. × ${formatUsd(r.price)} = ${formatUsd(r.subtotal)}${mixNote}`
      })
      .join('\n')
    try {
      await navigator.clipboard.writeText(`Смета для ${brandName}\n${summary}\nИтого: ${formatUsd(total)}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <Card bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.key} className={cn('flex flex-col gap-3 p-4', r.qty > 0 && 'bg-primary/5')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{r.name}</span>
                {r.hasStarRating ? (
                  <div className="flex rounded-md border border-border p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setMode((prev) => ({ ...prev, [r.key]: 'quantity' }))}
                      className={cn('rounded px-2.5 py-1', r.mode === 'quantity' ? 'bg-muted text-foreground' : 'text-muted-foreground')}
                    >
                      Количество
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode((prev) => ({ ...prev, [r.key]: 'rating' }))}
                      className={cn('rounded px-2.5 py-1', r.mode === 'rating' ? 'bg-muted text-foreground' : 'text-muted-foreground')}
                    >
                      До рейтинга
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">без рейтинга — посты и комментарии</span>
                )}
              </div>

              {r.hasStarRating && (
                <p className="text-xs text-muted-foreground">
                  Сейчас: {r.currentRating !== null ? `${r.currentRating.toFixed(1)}★ · ${r.currentCount.toLocaleString('ru-RU')} отзывов` : 'нет данных'}
                </p>
              )}

              {!r.hasStarRating ? (
                <div className="flex flex-wrap items-end gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Постов</span>
                    <Input
                      type="number"
                      min={0}
                      value={r.postQty || ''}
                      placeholder="0"
                      onChange={(e) => setPostQuantities((prev) => ({ ...prev, [r.key]: clampCount(Number(e.target.value)) }))}
                      className="h-8 w-20"
                      aria-label={`${r.name}: количество постов`}
                    />
                  </label>
                  <PriceField
                    label="Цена за пост"
                    value={r.postPrice}
                    onChange={(v) => setPostPrices((prev) => ({ ...prev, [r.key]: v }))}
                  />
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Комментариев</span>
                    <Input
                      type="number"
                      min={0}
                      value={r.commentQty || ''}
                      placeholder="0"
                      onChange={(e) => setCommentQuantities((prev) => ({ ...prev, [r.key]: clampCount(Number(e.target.value)) }))}
                      className="h-8 w-20"
                      aria-label={`${r.name}: количество комментариев`}
                    />
                  </label>
                  <PriceField
                    label="Цена за комментарий"
                    value={r.commentPrice}
                    onChange={(v) => setCommentPrices((prev) => ({ ...prev, [r.key]: v }))}
                  />
                  <span className="ml-auto font-medium tabular-nums">{r.qty > 0 ? formatUsd(r.subtotal) : '—'}</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  {r.mode === 'quantity' ? (
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Количество</span>
                      <Input
                        type="number"
                        min={0}
                        max={1000}
                        value={r.qty || ''}
                        placeholder="0"
                        onChange={(e) => setQty(r.key, Number(e.target.value))}
                        className="h-8 w-24"
                        aria-label={`${r.name}: количество публикаций`}
                      />
                    </label>
                  ) : (
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Целевой рейтинг</span>
                      <Input
                        type="number"
                        step="0.1"
                        min={1}
                        max={5}
                        value={r.target}
                        onChange={(e) => setTargets((prev) => ({ ...prev, [r.key]: Number(e.target.value) || targetRating }))}
                        className="h-8 w-20"
                        aria-label={`${r.name}: целевой рейтинг`}
                      />
                    </label>
                  )}

                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Средний рейтинг публикаций</span>
                    <Input
                      type="number"
                      step="0.1"
                      min={3}
                      max={5}
                      value={r.avgRating}
                      onChange={(e) => setAvgRating(r.key, Number(e.target.value))}
                      className="h-8 w-20"
                      aria-label={`${r.name}: средний рейтинг публикаций`}
                    />
                  </label>

                  <PriceField
                    label="Цена за публикацию"
                    value={r.price}
                    onChange={(v) => setPrices((prev) => ({ ...prev, [r.key]: v }))}
                    isCustom={r.isCustomPrice}
                    onReset={() =>
                      setPrices((prev) => {
                        const { [r.key]: _drop, ...rest } = prev
                        return rest
                      })
                    }
                    tierHint={r.qty > 0 && !r.isCustomPrice ? tierFor(r.qty).label : undefined}
                  />
                  <span className="ml-auto font-medium tabular-nums">{r.qty > 0 ? formatUsd(r.subtotal) : '—'}</span>
                </div>
              )}

              {r.hasStarRating &&
                (r.mode === 'rating' ? (
                  <span className="flex items-center gap-1.5 text-sm">
                    <Target className="size-3.5 shrink-0 text-primary" />
                    {r.needed === null ? (
                      <span className="text-negative">недостижимо — средний рейтинг публикаций должен быть выше цели</span>
                    ) : r.needed === 0 ? (
                      <span className="text-positive">цель уже достигнута</span>
                    ) : (
                      <>
                        нужно <b className="tabular-nums">{r.needed}</b>: {r.split.n5}×5★{r.split.n4 > 0 && ` + ${r.split.n4}×4★`}
                        {r.split.n3 > 0 && ` + ${r.split.n3}×3★`}
                      </>
                    )}
                  </span>
                ) : (
                  r.qty > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {r.split.n5}×5★{r.split.n4 > 0 && ` + ${r.split.n4}×4★`}
                      {r.split.n3 > 0 && ` + ${r.split.n3}×3★`}
                    </span>
                  )
                ))}
            </li>
          ))}
        </ul>
      </Card>

      <div
        data-reveal
        className="flex flex-col justify-between rounded-lg border border-border bg-gradient-to-b from-card to-card/40 p-6"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Смета</p>
          <p className="mt-3 text-sm text-muted-foreground">Итого</p>
          <p className="mt-1 font-display text-4xl font-bold tracking-tight text-foreground">{formatUsd(total)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {activeRows.length > 0 ? `${activeRows.reduce((s, r) => s + r.qty, 0)} публикаций на ${activeRows.length} площадках` : 'Укажите количество или целевой рейтинг слева'}
          </p>

          {activeRows.length > 0 && (
            <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-xs">
              {activeRows.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground">{r.name}</span>
                  <span className="shrink-0 text-right tabular-nums">
                    {!r.hasStarRating ? (
                      <>
                        {r.postQty > 0 && `${r.postQty} постов`}
                        {r.postQty > 0 && r.commentQty > 0 && ' + '}
                        {r.commentQty > 0 && `${r.commentQty} коммент.`}
                      </>
                    ) : (
                      <>
                        {r.qty} шт.
                        <span className="text-muted-foreground">
                          {' '}
                          · {r.split.n5}×5★{r.split.n4 > 0 && ` + ${r.split.n4}×4★`}
                          {r.split.n3 > 0 && ` + ${r.split.n3}×3★`}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              ))}
              {starTotals.n5 + starTotals.n4 + starTotals.n3 > 0 && (
                <>
                  <div className="mt-1 flex items-center justify-between gap-3 border-t border-border pt-1.5 font-medium">
                    <span>Всего по оценкам</span>
                    <span className="tabular-nums">
                      {starTotals.n5}×5★ + {starTotals.n4}×4★ + {starTotals.n3}×3★
                    </span>
                  </div>
                  <Donut
                    center={String(starTotals.n5 + starTotals.n4 + starTotals.n3)}
                    segments={[
                      { label: '5★', value: starTotals.n5, color: 'var(--gold)' },
                      { label: '4★', value: starTotals.n4, color: 'var(--chart-2)' },
                      { label: '3★', value: starTotals.n3, color: 'var(--warning)' },
                    ].filter((s) => s.value > 0)}
                  />
                </>
              )}
            </div>
          )}
        </div>
        {activeRows.length > 0 && (
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={copySummary}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
            >
              {copied ? (
                <>
                  <Check className="size-4" /> Скопировано
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Скопировать смету
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
            >
              <Download className="size-4" /> Скачать PDF
            </button>
          </div>
        )}
      </div>

      <PrintableQuote brandName={brandName} rows={activeRows} total={total} starTotals={starTotals} />
    </div>
  )
}

/**
 * Rendered off-screen; only shown by the print stylesheet (.print-only in
 * globals.css) when "Скачать PDF" triggers window.print() — the browser's
 * own "Save as PDF" destination turns this into an actual file with zero
 * extra dependencies.
 */
function PrintableQuote({
  brandName,
  rows,
  total,
  starTotals,
}: {
  brandName: string
  rows: Row[]
  total: number
  starTotals: { n5: number; n4: number; n3: number }
}) {
  return (
    <div className="print-only">
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Смета на публикации — {brandName}</h1>
      <p style={{ fontSize: 12, color: '#555', marginBottom: 20 }}>{new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #111', textAlign: 'left' }}>
            <th style={{ padding: '6px 8px' }}>Площадка</th>
            <th style={{ padding: '6px 8px' }}>Количество</th>
            <th style={{ padding: '6px 8px' }}>Цена</th>
            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Сумма</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '6px 8px' }}>{r.name}</td>
              <td style={{ padding: '6px 8px' }}>
                {!r.hasStarRating
                  ? [r.postQty > 0 && `${r.postQty} постов`, r.commentQty > 0 && `${r.commentQty} комментариев`].filter(Boolean).join(' + ')
                  : `${r.qty} шт.${r.split.n5 + r.split.n4 + r.split.n3 > 0 ? ` (${r.split.n5}×5★${r.split.n4 > 0 ? ` + ${r.split.n4}×4★` : ''}${r.split.n3 > 0 ? ` + ${r.split.n3}×3★` : ''})` : ''}`}
              </td>
              <td style={{ padding: '6px 8px' }}>{!r.hasStarRating ? `${formatUsd(r.postPrice)} / ${formatUsd(r.commentPrice)}` : formatUsd(r.price)}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatUsd(r.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {starTotals.n5 + starTotals.n4 + starTotals.n3 > 0 && (
        <p style={{ marginTop: 16, fontSize: 13 }}>
          <b>Всего по оценкам:</b> {starTotals.n5}×5★ + {starTotals.n4}×4★ + {starTotals.n3}×3★
        </p>
      )}
      <p style={{ marginTop: 12, fontSize: 18, fontWeight: 700 }}>Итого: {formatUsd(total)}</p>
    </div>
  )
}

function PriceField({
  label,
  value,
  onChange,
  isCustom,
  onReset,
  tierHint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  isCustom?: boolean
  onReset?: () => void
  tierHint?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">$</span>
          <Input
            type="number"
            min={0}
            step="0.5"
            value={value}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="h-8 w-24 pl-5"
            aria-label={label}
          />
        </div>
        {isCustom && onReset && (
          <button type="button" onClick={onReset} title="Вернуть цену по тарифу" className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <RotateCcw className="size-3.5" />
          </button>
        )}
      </div>
      {tierHint && <span className="text-[11px] text-muted-foreground">по тарифу · {tierHint}</span>}
    </label>
  )
}
