/**
 * CSV/TSV helpers ported from repcontrol's lib/csv.ts: the delimiter is
 * sniffed from the header line, header keys are lower-cased. Quoted cells
 * ("a, b") are supported so exports from spreadsheets import cleanly.
 */

function splitLine(line: string, delim: string) {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"' && cell === '') quoted = true
    else if (ch === delim) {
      cells.push(cell)
      cell = ''
    } else cell += ch
  }
  cells.push(cell)
  return cells.map((c) => c.trim())
}

export function parseDelimitedText(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0)
  if (!lines.length) return []
  const delim = lines[0].includes('\t') ? '\t' : lines[0].includes(';') && !lines[0].includes(',') ? ';' : ','
  const headers = splitLine(lines[0], delim).map((h) => h.toLowerCase())
  return lines.slice(1).map((line) => {
    const cells = splitLine(line, delim)
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']))
  })
}

/** Accepts M/D/YYYY (repcontrol exports), YYYY-MM-DD and DD.MM.YYYY. Returns 'YYYY-MM-DD' or null. */
export function parseDateLoose(value: string | undefined) {
  const v = (value ?? '').trim()
  let y: number, m: number, d: number
  let match
  if ((match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v))) [y, m, d] = [+match[1], +match[2], +match[3]]
  else if ((match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(v))) [m, d, y] = [+match[1], +match[2], +match[3]]
  else if ((match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(v))) [d, m, y] = [+match[1], +match[2], +match[3]]
  else return null
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Status of the review link from a free-text "Process" column. */
export function normalizeProcess(value: string | undefined): 'live' | 'removed' | 'unknown' {
  const s = (value ?? '').toLowerCase()
  if (s.includes('remov') || s.includes('delet') || s.includes('удал')) return 'removed'
  if (s.includes('publish') || s.includes('опубл') || s.includes('live') || s.includes('жив')) return 'live'
  return 'unknown'
}

/**
 * Reviewer email from a "Mail" column. Old exports store "email:password";
 * only the address is kept — anything after the first colon is dropped.
 */
export function parseEmail(value: string | undefined) {
  const email = (value ?? '').split(':')[0].trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null
}

/** Review type from a free-text "Type" column: written by a real customer, or a fake being fought. */
export function normalizeType(value: string | undefined): 'real' | 'fake' | 'unknown' {
  const s = (value ?? '').toLowerCase()
  if (s.includes('real') || s.includes('настоящ') || s.includes('реальн')) return 'real'
  if (s.includes('fake') || s.includes('фейк') || s.includes('spam') || s.includes('спам')) return 'fake'
  return 'unknown'
}
