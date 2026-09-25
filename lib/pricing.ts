/**
 * Publication pricing — shared by the landing page's calculator
 * (components/price-calculator.tsx) and the admin panel's per-brand
 * calculator (components/dash/admin/publications-calculator.tsx), so a price
 * change in one place is a price change everywhere.
 */

export const PUBLICATION_TIERS = [
  { id: 'low', min: 1, max: 49, label: '1–49 шт.', factor: 1 },
  { id: 'mid', min: 50, max: 149, label: '50+ шт.', factor: 10 / 15 },
  { id: 'high', min: 150, max: 1000, label: '150+ шт.', factor: 8 / 15 },
] as const

export function tierFor(quantity: number) {
  return PUBLICATION_TIERS.find((t) => quantity >= t.min && quantity <= t.max) ?? PUBLICATION_TIERS[PUBLICATION_TIERS.length - 1]
}

/** Price per publication at this quantity, rounded to whole dollars. */
export function unitPrice(basePrice: number, quantity: number) {
  return Math.round(basePrice * tierFor(quantity).factor)
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}
