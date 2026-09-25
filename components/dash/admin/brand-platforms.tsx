'use client'

import { useState } from 'react'
import { GripVertical, X, ChevronUp, ChevronDown } from 'lucide-react'
import { removeBrandPlatform, reorderBrandPlatforms } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

type Platform = { key: string; name: string }

/**
 * Drag-to-reorder list of a brand's active platforms. Reordering updates
 * local state immediately and persists in the background (reorderBrandPlatforms
 * doesn't redirect, unlike every other admin mutation, so the list doesn't
 * jump or lose scroll position mid-drag). Up/down buttons cover touch and
 * keyboard use, since native HTML5 drag-and-drop only works with a mouse.
 */
export function BrandPlatformsList({ brandId, platforms, back }: { brandId: number; platforms: Platform[]; back: string }) {
  const [order, setOrder] = useState(platforms)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)

  function commit(next: Platform[]) {
    setOrder(next)
    reorderBrandPlatforms(brandId, next.map((p) => p.key)).catch(() => {})
  }

  function moveTo(key: string, targetKey: string) {
    if (key === targetKey) return
    const from = order.findIndex((p) => p.key === key)
    const to = order.findIndex((p) => p.key === targetKey)
    if (from === -1 || to === -1) return
    const next = [...order]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    commit(next)
  }

  function moveBy(key: string, delta: number) {
    const from = order.findIndex((p) => p.key === key)
    const to = from + delta
    if (from === -1 || to < 0 || to >= order.length) return
    const next = [...order]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    commit(next)
  }

  if (order.length === 0) {
    return <p className="text-sm text-muted-foreground">Площадки не выбраны — добавьте хотя бы одну ниже.</p>
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {order.map((p, i) => (
        <li
          key={p.key}
          draggable
          onDragStart={() => setDragKey(p.key)}
          onDragOver={(e) => {
            e.preventDefault()
            if (overKey !== p.key) setOverKey(p.key)
          }}
          onDragLeave={() => setOverKey((k) => (k === p.key ? null : k))}
          onDrop={(e) => {
            e.preventDefault()
            if (dragKey) moveTo(dragKey, p.key)
            setDragKey(null)
            setOverKey(null)
          }}
          onDragEnd={() => {
            setDragKey(null)
            setOverKey(null)
          }}
          className={cn(
            'flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm',
            dragKey === p.key && 'opacity-40',
            overKey === p.key && dragKey !== p.key && 'border-primary/50 bg-primary/5',
          )}
        >
          <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/60 active:cursor-grabbing" />
          <span className="min-w-0 flex-1 truncate">{p.name}</span>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => moveBy(p.key, -1)}
              disabled={i === 0}
              aria-label={`${p.name}: выше`}
              className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronUp className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => moveBy(p.key, 1)}
              disabled={i === order.length - 1}
              aria-label={`${p.name}: ниже`}
              className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronDown className="size-3.5" />
            </button>
            <form action={removeBrandPlatform}>
              <input type="hidden" name="brand_id" value={brandId} />
              <input type="hidden" name="platform" value={p.key} />
              <input type="hidden" name="back" value={back} />
              <button
                type="submit"
                aria-label={`Убрать ${p.name}`}
                className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-negative/10 hover:text-negative"
              >
                <X className="size-3.5" />
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  )
}
