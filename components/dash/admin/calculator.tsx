'use client'

import Link from 'next/link'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Calculator as CalculatorIcon, FileText, Loader2 } from 'lucide-react'
import type { BrandFacts, SavedPlan } from '@/lib/data/forecast'
import {
  averageOfShares,
  computePlanRow,
  defaultPlanRow,
  projectRating,
  requiredAverage,
  reviewsNeeded,
  riskScenario,
  type PlanRow,
} from '@/lib/dash/forecast'
import { platformColor, platformName } from '@/lib/dash/constants'
import { saveForecastPlan } from '@/app/admin/actions'
import { buttonClass, inputClass } from '@/components/dash/styles'
import { cn } from '@/lib/utils'

/*
 * "Калькулятор" — same layout as repcontrol's publications calculator
 * (Площадка → Цель → Результат → Риск-сценарий → Бюджет на квартал →
 * Отчёт по кварталу), counting reviews from real customers: how many are
 * needed to reach the target, how many invitations that takes at the
 * brand's conversion, and what the work costs.
 */

const tile = 'rounded-lg border border-input bg-muted/40 px-3 py-2'
const tileLabel = 'block text-[10px] font-medium uppercase tracking-wide text-muted-foreground'
const tileValue = 'text-lg font-semibold tabular-nums'
const small = inputClass('h-8 text-xs')
const th = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap'
const td = 'px-3 py-1.5 whitespace-nowrap'

function Section({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-border bg-card">
      <div className="px-5 pt-5">
        <h2 className="text-base font-medium">{title}</h2>
        {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function num(value: string, fallback = 0) {
  const n = parseFloat(value.replace(',', '.'))
  return Number.isFinite(n) ? n : fallback
}

const usd = (v: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD', maximumFractionDigits: v < 10 ? 2 : 0 }).format(v)

function monthNames(count: number) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth() + i, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
  )
}

function initialPlan(brand: BrandFacts, saved: SavedPlan | undefined): SavedPlan {
  const rows = brand.platforms.map((f) => saved?.rows.find((r) => r.platform === f.platform) ?? defaultPlanRow(f))
  return { conversion: saved?.conversion ?? brand.conversion ?? 0.1, rows }
}

export function RatingCalculator({
  brands,
  quarter,
  savedPlans,
}: {
  brands: BrandFacts[]
  quarter: string
  savedPlans: Record<number, SavedPlan>
}) {
  // ── Площадка / Цель ──
  const [brandId, setBrandId] = useState(brands[0]?.id ?? 0)
  const brand = brands.find((b) => b.id === brandId) ?? brands[0]
  const [platform, setPlatform] = useState(brand?.platforms[0]?.platform ?? '')
  const facts = brand?.platforms.find((p) => p.platform === platform) ?? brand?.platforms[0]

  const [target, setTarget] = useState(String(brand?.target ?? 4.5))
  const [months, setMonths] = useState('3')
  const [avgNew, setAvgNew] = useState(String(Math.round((facts?.impliedAvg ?? 4.6) * 100) / 100))
  const [conversionPct, setConversionPct] = useState(String(Math.round((brand?.conversion ?? 0.1) * 1000) / 10))

  useEffect(() => {
    if (!brand) return
    if (!brand.platforms.some((p) => p.platform === platform)) setPlatform(brand.platforms[0]?.platform ?? '')
    setTarget(String(brand.target))
    setConversionPct(String(Math.round((brand.conversion ?? 0.1) * 1000) / 10))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId])

  useEffect(() => {
    if (facts) setAvgNew(String(Math.round((facts.impliedAvg ?? 4.6) * 100) / 100))
  }, [facts?.platform, brandId]) // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => {
    if (!facts) return null
    const T = num(target)
    const s = num(avgNew)
    const m = Math.max(1, Math.round(num(months, 3)))
    const conv = num(conversionPct) / 100
    if (T < 1 || T > 5 || s < 1 || s > 5 || conv <= 0) return null
    const needed = reviewsNeeded(facts.rating, facts.count, T, s)
    const perMonth = needed === null ? null : Math.ceil(needed / m)
    const monthlyPace = facts.pace * 4.33
    const schedule = monthNames(m).map((label, i) => {
      const planned = perMonth === null ? 0 : Math.min(needed!, perMonth * (i + 1))
      return {
        label,
        planned: perMonth === null ? 0 : Math.max(0, Math.min(perMonth, needed! - perMonth * i)),
        ratingPlan: projectRating(facts.rating, facts.count, planned, s),
        ratingPace: projectRating(facts.rating, facts.count, monthlyPace * (i + 1), s),
      }
    })
    return {
      needed,
      perMonth,
      invitesPerMonth: perMonth === null ? null : Math.ceil(perMonth / conv),
      paceRating: projectRating(facts.rating, facts.count, monthlyPace * m, s),
      monthlyPace,
      schedule,
      months: m,
    }
  }, [facts, target, avgNew, months, conversionPct])

  // ── Какой должна быть средняя оценка / Сценарий по оценкам ──
  const defaultMonthly = facts ? Math.max(1, Math.round(facts.pace * 4.33)) : 10
  const [expected, setExpected] = useState(String(defaultMonthly * 3))
  const [shares, setShares] = useState<string[]>(() => (facts?.starShares ?? [70, 15, 5, 4, 6]).map(String))
  const [scenarioMonthly, setScenarioMonthly] = useState(String(defaultMonthly))

  useEffect(() => {
    if (!facts) return
    const monthly = Math.max(1, Math.round(facts.pace * 4.33))
    setExpected(String(monthly * Math.max(1, Math.round(num(months, 3)))))
    setScenarioMonthly(String(monthly))
    setShares((facts.starShares ?? [70, 15, 5, 4, 6]).map(String))
  }, [facts?.platform, brandId]) // eslint-disable-line react-hooks/exhaustive-deps

  const required = useMemo(() => {
    if (!facts) return null
    const n = Math.max(0, Math.round(num(expected)))
    const T = num(target)
    const avg = requiredAverage(facts.rating, facts.count, T, n)
    const minAtFive = reviewsNeeded(facts.rating, facts.count, T, 5)
    return { n, avg, minAtFive }
  }, [facts, expected, target])

  const scenario = useMemo(() => {
    if (!facts) return null
    const values = shares.map((s) => Math.max(0, num(s)))
    const avg = averageOfShares(values)
    const perMonth = Math.max(0, Math.round(num(scenarioMonthly)))
    const m = Math.max(1, Math.round(num(months, 3)))
    if (avg === null) return null
    return {
      avg,
      sum: values.reduce((s, x) => s + x, 0),
      months: monthNames(m).map((label, i) => ({
        label,
        rating: projectRating(facts.rating, facts.count, perMonth * (i + 1), avg),
      })),
    }
  }, [facts, shares, scenarioMonthly, months])

  // ── Риск-сценарий ──
  const [riskOne, setRiskOne] = useState('5')
  const [riskTwo, setRiskTwo] = useState('0')
  const risk = facts ? riskScenario(facts.rating, facts.count, Math.max(0, Math.round(num(riskOne))), Math.max(0, Math.round(num(riskTwo)))) : null

  // ── Бюджет на квартал ──
  const [plans, setPlans] = useState<Record<number, SavedPlan>>(() =>
    Object.fromEntries(brands.map((b) => [b.id, initialPlan(b, savedPlans[b.id])])),
  )
  const [quarterBrandId, setQuarterBrandId] = useState(brands[0]?.id ?? 0)
  const quarterBrand = brands.find((b) => b.id === quarterBrandId) ?? brands[0]
  const plan = quarterBrand ? plans[quarterBrand.id] : undefined
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const dirty = useRef<Set<number>>(new Set())

  function updateRow(platformKey: string, patch: Partial<PlanRow>) {
    if (!quarterBrand) return
    dirty.current.add(quarterBrand.id)
    setPlans((prev) => ({
      ...prev,
      [quarterBrand.id]: {
        ...prev[quarterBrand.id],
        rows: prev[quarterBrand.id].rows.map((r) => (r.platform === platformKey ? { ...r, ...patch } : r)),
      },
    }))
  }

  function updateConversion(value: string) {
    if (!quarterBrand) return
    dirty.current.add(quarterBrand.id)
    const v = Math.min(100, Math.max(0.1, num(value, 10))) / 100
    setPlans((prev) => ({ ...prev, [quarterBrand.id]: { ...prev[quarterBrand.id], conversion: v } }))
  }

  // Debounced autosave of edited brands.
  useEffect(() => {
    if (dirty.current.size === 0) return
    const timer = setTimeout(async () => {
      const ids = [...dirty.current]
      dirty.current.clear()
      setSyncStatus('saving')
      const results = await Promise.all(ids.map((id) => saveForecastPlan(id, quarter, plans[id])))
      const failed = results.find((r) => 'error' in r && r.error)
      setSyncStatus(failed ? 'error' : 'saved')
      setSavedAt(new Date().toISOString())
    }, 800)
    return () => clearTimeout(timer)
  }, [plans, quarter])

  const report = useMemo(
    () =>
      brands.flatMap((b) => {
        const p = plans[b.id]
        return p.rows
          .filter((r) => r.enabled)
          .map((r) => {
            const f = b.platforms.find((x) => x.platform === r.platform)!
            return { brand: b, row: r, res: computePlanRow(r, f, b.target, p.conversion) }
          })
      }),
    [brands, plans],
  )
  const reportTotal = report.reduce((s, r) => s + r.res.costPerQuarter, 0)

  function downloadReport() {
    const header = ['Бренд', 'Площадка', 'Рейтинг сейчас', 'Отзывов сейчас', 'Рейтинг будет', 'Отзывов/мес', 'Приглашений/мес', 'Бюджет/мес', 'Бюджет/квартал', '% от бюджета']
    const lines = report.map(({ brand: b, res }) => {
      const f = b.platforms.find((x) => x.platform === res.platform)!
      return [
        b.name,
        platformName(res.platform),
        res.ratingNow.toFixed(2),
        f.count,
        res.ratingThen.toFixed(2),
        res.perMonth,
        res.invitesPerMonth,
        res.costPerMonth.toFixed(2),
        res.costPerQuarter.toFixed(2),
        reportTotal ? ((res.costPerQuarter / reportTotal) * 100).toFixed(1) : '0',
      ]
    })
    const csv = [header, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rating-plan-${quarter.replace(' ', '-')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (!brand || !facts) {
    return (
      <p className="rounded-lg border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
        Нет данных: внесите хотя бы один снимок площадки во «Внесении данных».
      </p>
    )
  }

  const campaignHref = `/admin/plan?brand=${brand.id}&campaign_platform=${facts.platform}&campaign_name=${encodeURIComponent(
    `Приглашения: ${platformName(facts.platform)}, цель ${num(target).toFixed(1)}`,
  )}#campaign`

  return (
    <div className="flex flex-col gap-4">
      <Section title="Площадка" description="Текущие показатели из «Внесения данных» — от них идёт расчёт">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Сервис</span>
            <select value={brandId} onChange={(e) => setBrandId(Number(e.target.value))} className={small}>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Площадка</span>
            <select value={facts.platform} onChange={(e) => setPlatform(e.target.value)} className={small}>
              {brand.platforms.map((p) => (
                <option key={p.platform} value={p.platform}>
                  {platformName(p.platform)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className={tile}>
            <span className={tileLabel}>Текущий рейтинг</span>
            <span className={tileValue}>{facts.rating.toFixed(2)}</span>
          </div>
          <div className={tile}>
            <span className={tileLabel}>Текущее кол-во отзывов</span>
            <span className={tileValue}>{facts.count.toLocaleString('ru-RU')}</span>
          </div>
          <div className={tile}>
            <span className={tileLabel}>Темп, новых отзывов в неделю</span>
            <span className={tileValue}>{facts.pace.toFixed(1)}</span>
          </div>
          <div className="flex items-end text-xs text-muted-foreground">По состоянию на неделю от {facts.week}</div>
        </div>
      </Section>

      <Section title="Цель">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Целевой рейтинг</span>
            <input type="number" min="1" max="5" step="0.1" value={target} onChange={(e) => setTarget(e.target.value)} className={small} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Срок, месяцев</span>
            <input type="number" min="1" max="24" step="1" value={months} onChange={(e) => setMonths(e.target.value)} className={small} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground" title="По умолчанию — оценка по изменению рейтинга и числа отзывов за 8 недель">
              Средняя оценка новых отзывов
            </span>
            <input type="number" min="1" max="5" step="0.01" value={avgNew} onChange={(e) => setAvgNew(e.target.value)} className={small} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Конверсия приглашений, %</span>
            <input type="number" min="0.1" max="100" step="0.1" value={conversionPct} onChange={(e) => setConversionPct(e.target.value)} className={small} />
          </label>
        </div>
      </Section>

      <Section title="Результат">
        {!result ? (
          <p className="text-sm text-muted-foreground">Заполните поля выше корректными числами.</p>
        ) : result.needed === null ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Средняя оценка новых отзывов ({num(avgNew).toFixed(2)}) не выше цели ({num(target).toFixed(2)}) — рейтинг к цели не придёт,
            сколько бы отзывов ни пришло. Сначала нужно разобраться с причинами негатива: ответы, работа с поддержкой, продуктом.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className={tile}>
                <span className={tileLabel}>Нужно новых отзывов</span>
                <span className={tileValue}>{result.needed === 0 ? 'цель достигнута' : result.needed.toLocaleString('ru-RU')}</span>
              </div>
              <div className={tile}>
                <span className={tileLabel}>В месяц ({result.months} мес.)</span>
                <span className={tileValue}>{result.perMonth!.toLocaleString('ru-RU')}</span>
              </div>
              <div className="rounded-lg border border-positive/30 bg-positive/10 px-3 py-2">
                <span className={tileLabel}>Приглашений в месяц</span>
                <span className={cn(tileValue, 'text-positive')}>{result.invitesPerMonth!.toLocaleString('ru-RU')}</span>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
                <span className={tileLabel}>Рейтинг при текущем темпе</span>
                <span className={cn(tileValue, 'text-primary')}>{result.paceRating.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              «Рейтинг при текущем темпе» — что будет через {result.months} мес., если отзывы продолжат приходить как сейчас (
              {Math.round(result.monthlyPace)} в месяц) со средней оценкой {num(avgNew).toFixed(2)}. Расчёт по простому среднему; у некоторых
              площадок (TrustScore у Trustpilot) свежие отзывы весят больше.
            </p>

            {result.needed > 0 && (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className={th}>Месяц</th>
                      <th className={th}>Новых отзывов по плану</th>
                      <th className={th}>Рейтинг по плану</th>
                      <th className={th}>Рейтинг при текущем темпе</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.schedule.map((m) => (
                      <tr key={m.label}>
                        <td className={td}>{m.label}</td>
                        <td className={cn(td, 'tabular-nums')}>{m.planned}</td>
                        <td className={cn(td, 'tabular-nums')}>{m.ratingPlan.toFixed(2)}</td>
                        <td className={cn(td, 'tabular-nums text-muted-foreground')}>{m.ratingPace.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Link href={campaignHref} className={buttonClass('primary')}>
              <CalculatorIcon className="size-3.5" />
              Создать кампанию приглашений
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </Section>

      <Section
        title="Какой должна быть средняя оценка новых отзывов"
        description="Если за выбранный срок придёт столько новых отзывов, какой средней оценки они должны быть, чтобы рейтинг вышел на цель. Сравните со средней оценкой, которая приходит сейчас."
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Ожидаемо новых отзывов за срок</span>
            <input type="number" min="1" step="1" value={expected} onChange={(e) => setExpected(e.target.value)} className={small} />
          </label>
        </div>
        {required && required.n > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className={cn(tile, required.avg !== null && required.avg > 5 && 'border-warning/30 bg-warning/10')}>
              <span className={tileLabel}>Нужна средняя оценка новых</span>
              <span className={tileValue}>
                {required.avg === null ? '—' : required.avg <= facts.rating ? 'цель уже достигнута' : required.avg > 5 ? 'больше 5' : required.avg.toFixed(2)}
              </span>
            </div>
            <div className={tile}>
              <span className={tileLabel}>Сейчас приходит в среднем</span>
              <span className={tileValue}>{num(avgNew).toFixed(2)}</span>
            </div>
            <div className={tile}>
              <span className={tileLabel}>Минимум отзывов, если все 5★</span>
              <span className={tileValue}>{required.minAtFive === null ? '—' : required.minAtFive.toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex items-end text-xs text-muted-foreground">
              {required.avg !== null && required.avg > 5
                ? 'При таком количестве отзывов цель недостижима — нужно больше отзывов или больше времени.'
                : required.avg !== null && required.avg > num(avgNew)
                  ? 'Нужно выше, чем приходит сейчас: работа с качеством сервиса и ответами на негатив.'
                  : 'Текущей средней оценки достаточно — важен объём отзывов.'}
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Сценарий по оценкам"
        description="Если реальные отзывы будут приходить с таким распределением звёзд, какой рейтинг получится. По умолчанию — распределение из журнала отзывов этой площадки."
      >
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {['5★', '4★', '3★', '2★', '1★'].map((label, i) => (
            <label key={label} className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">{label}, %</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={shares[i]}
                onChange={(e) => setShares((prev) => prev.map((v, k) => (k === i ? e.target.value : v)))}
                className={small}
              />
            </label>
          ))}
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Отзывов в месяц</span>
            <input type="number" min="0" step="1" value={scenarioMonthly} onChange={(e) => setScenarioMonthly(e.target.value)} className={small} />
          </label>
        </div>
        {scenario && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className={tile}>
                <span className={tileLabel}>Средняя оценка новых</span>
                <span className={tileValue}>{scenario.avg.toFixed(2)}</span>
              </div>
              <div className={cn(tile, scenario.months.at(-1)!.rating >= num(target) && 'border-positive/30 bg-positive/10')}>
                <span className={tileLabel}>Рейтинг через {scenario.months.length} мес.</span>
                <span className={tileValue}>{scenario.months.at(-1)!.rating.toFixed(2)}</span>
              </div>
              {Math.round(scenario.sum) !== 100 && (
                <div className="col-span-2 flex items-end text-xs text-warning">Сумма долей {Math.round(scenario.sum)}% — считаю пропорционально.</div>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className={th}>Месяц</th>
                    <th className={th}>Рейтинг площадки</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scenario.months.map((m) => (
                    <tr key={m.label}>
                      <td className={td}>{m.label}</td>
                      <td className={cn(td, 'tabular-nums', m.rating >= num(target) && 'text-positive')}>{m.rating.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Риск-сценарий: если появятся негативные отзывы"
        description="Добавьте 1★/2★ отзывы к ТЕКУЩЕМУ рейтингу площадки и посмотрите, какой рейтинг получится. Чем меньше накоплено отзывов, тем сильнее их влияние — это аргумент заранее собирать отзывы реальных клиентов."
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Кол-во 1★ отзывов</span>
            <input type="number" min="0" step="1" value={riskOne} onChange={(e) => setRiskOne(e.target.value)} className={small} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Кол-во 2★ отзывов</span>
            <input type="number" min="0" step="1" value={riskTwo} onChange={(e) => setRiskTwo(e.target.value)} className={small} />
          </label>
        </div>
        {risk && (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className={tile}>
              <span className={tileLabel}>Рейтинг сейчас</span>
              <span className={tileValue}>{facts.rating.toFixed(2)}</span>
            </div>
            <div className="rounded-lg border border-negative/30 bg-negative/10 px-3 py-2">
              <span className={tileLabel}>Рейтинг с учётом риска</span>
              <span className={cn(tileValue, 'text-negative')}>{risk.ratingWithRisk.toFixed(2)}</span>
            </div>
            <div className={tile}>
              <span className={tileLabel}>Просадка</span>
              <span className={tileValue}>−{risk.ratingDrop.toFixed(2)}</span>
            </div>
            <div className={tile}>
              <span className={tileLabel}>Отзывов станет</span>
              <span className={tileValue}>{risk.newCount.toLocaleString('ru-RU')}</span>
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Бюджет на квартал — весь портфель"
        description={
          <>
            Для каждой площадки бренда выберите режим: «Вручную» — сколько отзывов в месяц ожидаете от кампаний приглашений, «По цели» —
            сколько нужно, чтобы выйти на целевой рейтинг бренда за квартал. Приглашения считаются по конверсии бренда. Стоимость = подписка
            площадки (из «Расходов») + отправка приглашений + подготовка ответов на новые отзывы. Переключайте «Сервис», чтобы заполнить план
            по каждому бренду. План сохраняется автоматически, итог и скачивание — в конце.
          </>
        }
      >
        {quarterBrand && plan && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">План по бренду · {quarter}</p>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                {syncStatus === 'saving' && (
                  <>
                    <Loader2 className="size-2.5 animate-spin" /> Сохраняю…
                  </>
                )}
                {syncStatus === 'saved' && savedAt && `Сохранено · ${new Date(savedAt).toLocaleTimeString('ru-RU')}`}
                {syncStatus === 'error' && <span className="text-negative">Не удалось сохранить</span>}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">Сервис</span>
                <select value={quarterBrand.id} onChange={(e) => setQuarterBrandId(Number(e.target.value))} className={small}>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">Конверсия приглашений, %</span>
                <input
                  key={quarterBrand.id}
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  defaultValue={Math.round(plan.conversion * 1000) / 10}
                  onChange={(e) => updateConversion(e.target.value)}
                  className={small}
                />
              </label>
              <div className="flex items-end text-xs text-muted-foreground">Цель бренда: {quarterBrand.target.toFixed(1)}</div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className={th} />
                    <th className={th}>Площадка</th>
                    <th className={th}>Отзывов сейчас</th>
                    <th className={th}>Режим</th>
                    <th className={th}>Отзывов/мес</th>
                    <th className={th}>Средняя оценка новых</th>
                    <th className={th}>Рейтинг</th>
                    <th className={th}>Приглашений/мес</th>
                    <th className={th} title="Стоимость отправки одного приглашения">Цена приглашения</th>
                    <th className={th} title="Стоимость подготовки одного ответа на отзыв">Цена ответа</th>
                    <th className={th}>Подписка/мес</th>
                    <th className={th}>Стоимость/мес</th>
                    <th className={th}>Стоимость/квартал</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {plan.rows.map((row) => {
                    const f = quarterBrand.platforms.find((x) => x.platform === row.platform)!
                    const res = computePlanRow(row, f, quarterBrand.target, plan.conversion)
                    return (
                      <tr key={`${quarterBrand.id}-${row.platform}`} className={cn(!row.enabled && 'opacity-45')}>
                        <td className={td}>
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) => updateRow(row.platform, { enabled: e.target.checked })}
                            aria-label={`Включить ${platformName(row.platform)}`}
                          />
                        </td>
                        <td className={td}>
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full" style={{ background: platformColor(row.platform) }} />
                            {platformName(row.platform)}
                          </span>
                        </td>
                        <td className={cn(td, 'tabular-nums')}>{f.count.toLocaleString('ru-RU')}</td>
                        <td className={td}>
                          <select
                            value={row.mode}
                            onChange={(e) => updateRow(row.platform, { mode: e.target.value as PlanRow['mode'] })}
                            className={inputClass('h-7 w-auto py-0 text-xs')}
                          >
                            <option value="manual">Вручную</option>
                            <option value="target">По цели</option>
                          </select>
                        </td>
                        <td className={td}>
                          {row.mode === 'manual' ? (
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={row.perMonth}
                              onChange={(e) => updateRow(row.platform, { perMonth: Math.max(0, num(e.target.value)) })}
                              className={inputClass('h-7 w-20 text-xs')}
                            />
                          ) : res.reachable ? (
                            <span className="tabular-nums">{res.perMonth}</span>
                          ) : (
                            <span className="text-xs text-warning" title="Средняя оценка новых отзывов не выше цели">недостижимо</span>
                          )}
                        </td>
                        <td className={td}>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.01"
                            value={row.avgNew}
                            onChange={(e) => updateRow(row.platform, { avgNew: Math.min(5, Math.max(1, num(e.target.value, 4.5))) })}
                            className={inputClass('h-7 w-20 text-xs')}
                          />
                        </td>
                        <td className={cn(td, 'tabular-nums')}>
                          {res.ratingNow.toFixed(2)} → <b className={res.ratingThen >= quarterBrand.target ? 'text-positive' : undefined}>{res.ratingThen.toFixed(2)}</b>
                        </td>
                        <td className={cn(td, 'tabular-nums')}>{res.invitesPerMonth.toLocaleString('ru-RU')}</td>
                        <td className={td}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.invitePrice}
                            onChange={(e) => updateRow(row.platform, { invitePrice: Math.max(0, num(e.target.value)) })}
                            className={inputClass('h-7 w-20 text-xs')}
                          />
                        </td>
                        <td className={td}>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={row.replyPrice}
                            onChange={(e) => updateRow(row.platform, { replyPrice: Math.max(0, num(e.target.value)) })}
                            className={inputClass('h-7 w-20 text-xs')}
                          />
                        </td>
                        <td className={cn(td, 'tabular-nums text-muted-foreground')}>{usd(f.subscription)}</td>
                        <td className={cn(td, 'tabular-nums')}>{usd(res.costPerMonth)}</td>
                        <td className={cn(td, 'tabular-nums font-medium')}>{usd(res.costPerQuarter)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Отчёт по кварталу (все бренды)</p>
            <button type="button" onClick={downloadReport} disabled={report.length === 0} className={buttonClass('secondary', 'h-8 text-xs')}>
              <FileText className="size-3.5" />
              Скачать отчёт (CSV)
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className={tile}>
              <span className={tileLabel}>Бюджет на квартал</span>
              <span className={tileValue}>{usd(reportTotal)}</span>
            </div>
            <div className={tile}>
              <span className={tileLabel}>В месяц</span>
              <span className={tileValue}>{usd(reportTotal / 3)}</span>
            </div>
            <div className={tile}>
              <span className={tileLabel}>Новых отзывов за квартал</span>
              <span className={tileValue}>{report.reduce((s, r) => s + r.res.quarterReviews, 0).toLocaleString('ru-RU')}</span>
            </div>
            <div className={tile}>
              <span className={tileLabel}>Приглашений за квартал</span>
              <span className={tileValue}>{report.reduce((s, r) => s + r.res.invitesPerMonth * 3, 0).toLocaleString('ru-RU')}</span>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className={th}>Бренд / площадка</th>
                  <th className={th}>Рейтинг сейчас</th>
                  <th className={th}>Отзывов сейчас</th>
                  <th className={th}>Рейтинг будет</th>
                  <th className={th}>Отзывов/мес</th>
                  <th className={th}>Приглашений/мес</th>
                  <th className={th}>Бюджет/мес</th>
                  <th className={th}>Бюджет/квартал</th>
                  <th className={th}>% от бюджета</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {brands.map((b) => {
                  const rows = report.filter((r) => r.brand.id === b.id)
                  if (rows.length === 0) return null
                  return (
                    <Fragment key={b.id}>
                      <tr className="bg-muted/20">
                        <td className={cn(td, 'font-semibold')} colSpan={9}>
                          {b.name}
                          {b.isDemo && <span className="ml-2 text-[10px] font-semibold uppercase text-warning">демо</span>}
                        </td>
                      </tr>
                      {rows.map(({ res }) => {
                        const f = b.platforms.find((x) => x.platform === res.platform)!
                        return (
                          <tr key={res.platform}>
                            <td className={cn(td, 'pl-6')}>{platformName(res.platform)}</td>
                            <td className={cn(td, 'tabular-nums')}>{res.ratingNow.toFixed(2)}</td>
                            <td className={cn(td, 'tabular-nums')}>{f.count.toLocaleString('ru-RU')}</td>
                            <td className={cn(td, 'tabular-nums', res.ratingThen >= b.target && 'text-positive')}>{res.ratingThen.toFixed(2)}</td>
                            <td className={cn(td, 'tabular-nums')}>{res.perMonth}</td>
                            <td className={cn(td, 'tabular-nums')}>{res.invitesPerMonth.toLocaleString('ru-RU')}</td>
                            <td className={cn(td, 'tabular-nums')}>{usd(res.costPerMonth)}</td>
                            <td className={cn(td, 'tabular-nums')}>{usd(res.costPerQuarter)}</td>
                            <td className={cn(td, 'tabular-nums text-muted-foreground')}>
                              {reportTotal ? `${((res.costPerQuarter / reportTotal) * 100).toFixed(1)}%` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  )
}
