/** Dependency-free charts: SVG line/donut scaled from a viewBox, HTML bars. */
import { revealDelay } from '@/lib/utils'

type AreaPoint = { label: string; value: number | null }

export function AreaChart({
  points,
  min,
  max,
  target,
  format = (v) => v.toFixed(2),
  height = 220,
}: {
  points: AreaPoint[]
  min?: number
  max?: number
  target?: number
  format?: (value: number) => string
  height?: number
}) {
  const W = 640
  const H = height
  const PAD = { top: 12, right: 12, bottom: 26, left: 40 }
  const values = points.map((p) => p.value).filter((v): v is number => v !== null)
  if (values.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Пока нет данных</p>
  }
  const lo = min ?? Math.floor((Math.min(...values, target ?? Infinity) - 0.1) * 10) / 10
  const hi = max ?? Math.ceil((Math.max(...values, target ?? -Infinity) + 0.1) * 10) / 10
  const x = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD.top - PAD.bottom)

  const defined = points.map((p, i) => ({ ...p, i })).filter((p) => p.value !== null) as { label: string; value: number; i: number }[]
  const line = defined.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(defined.at(-1)!.i).toFixed(1)},${H - PAD.bottom} L${x(defined[0].i).toFixed(1)},${H - PAD.bottom} Z`
  const ticks = [0, 0.5, 1].map((t) => lo + (hi - lo) * t)
  const labelEvery = Math.ceil(points.length / 6)

  return (
    <div data-reveal>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="График">
        <defs>
          <linearGradient id="dash-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">
              {format(t)}
            </text>
          </g>
        ))}
        {target !== undefined && target >= lo && target <= hi && (
          <g>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(target)} y2={y(target)} stroke="var(--warning)" strokeDasharray="4 4" opacity="0.7" />
            <text x={W - PAD.right} y={y(target) - 5} textAnchor="end" fontSize="11" fill="var(--warning)">
              цель {format(target)}
            </text>
          </g>
        )}
        <path className="dash-area" d={area} fill="url(#dash-area)" />
        <path className="dash-line" d={line} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" pathLength={1} />
        {defined.map((p, k) => (
          <circle
            key={p.i}
            className="dash-dot"
            cx={x(p.i)}
            cy={y(p.value)}
            r="3"
            fill="var(--card)"
            stroke="var(--chart-1)"
            strokeWidth="1.5"
            style={{ ['--dot-delay' as string]: `${1.1 + k * 0.05}s` }}
          >
            <title>{`${p.label}: ${format(p.value)}`}</title>
          </circle>
        ))}
        {points.map((p, i) =>
          // Skip a regular label that would collide with the last one.
          (i % labelEvery === 0 && points.length - 1 - i >= labelEvery / 2) || i === points.length - 1 ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor={i === points.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'} fontSize="11" fill="var(--muted-foreground)">
              {p.label}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  )
}

export function BarChart({
  points,
  height = 140,
  color = 'var(--chart-2)',
}: {
  points: { label: string; value: number }[]
  height?: number
  color?: string
}) {
  const max = Math.max(...points.map((p) => p.value), 1)
  const labelEvery = Math.ceil(points.length / 6)
  return (
    <div data-reveal>
      <div className="flex items-end gap-1.5 sm:gap-3" style={{ height }}>
        {points.map((p, i) => (
          <div key={i} className="group relative flex h-full flex-1 items-end justify-center">
            <div
              className="dash-bar-fill w-full max-w-7 rounded-t-[3px] opacity-85 group-hover:opacity-100"
              style={{ height: `${Math.max((p.value / max) * 100, 1)}%`, background: color, ...revealDelay(i, 25) }}
              title={`${p.label}: ${p.value}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 text-[11px] text-muted-foreground sm:gap-3">
        {points.map((p, i) => (
          <span key={i} className="flex-1 whitespace-nowrap text-center">
            {i % labelEvery === 0 || i === points.length - 1 ? p.label : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Donut({
  segments,
  center,
  caption,
}: {
  segments: { label: string; value: number; color: string }[]
  center: string
  caption?: string
}) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const R = 42
  const C = 2 * Math.PI * R
  let offset = 0
  return (
    <div data-reveal className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="dash-donut size-24 shrink-0 -rotate-90 sm:size-28">
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--muted)" strokeWidth="10" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * C
            const el = (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="10"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return el
          })}
        <text x="50" y="50" transform="rotate(90 50 50)" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="600" fill="var(--foreground)">
          {center}
        </text>
      </svg>
      <ul className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="truncate text-muted-foreground">{s.label}</span>
            <span className="ml-auto pl-2 font-medium tabular-nums">{s.value}</span>
          </li>
        ))}
        {caption && <li className="text-xs text-muted-foreground">{caption}</li>}
      </ul>
    </div>
  )
}
