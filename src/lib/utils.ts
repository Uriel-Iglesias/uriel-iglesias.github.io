import type { Transaction } from '../types'

// ────────────────────────────────────────────────────────────────────────────
// Dinero
// ────────────────────────────────────────────────────────────────────────────

const numberFmt = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** `30` → `"€30,00"` (siempre con € delante y dos decimales, formato es-ES). */
export function formatMoney(amount: number): string {
  return `€${numberFmt.format(Math.abs(amount))}`
}

/**
 * Importe con signo y € para listas y detalle.
 * income → `"+€30,00"`, expense → `"−€2,00"`.
 */
export function formatSigned(amount: number, type: 'income' | 'expense'): string {
  const sign = type === 'income' ? '+' : '−' // U+2212 minus, más bonito que '-'
  return `${sign}${formatMoney(amount)}`
}

/** Balance neto con signo (positivo/negativo según el número). */
export function formatBalance(amount: number): string {
  if (amount > 0) return `+${formatMoney(amount)}`
  if (amount < 0) return `−${formatMoney(amount)}`
  return formatMoney(0)
}

// ────────────────────────────────────────────────────────────────────────────
// Fechas (todo en español, sin librerías)
// ────────────────────────────────────────────────────────────────────────────

/** Fecha de hoy en formato `YYYY-MM-DD` usando la zona horaria local. */
export function todayISO(): string {
  const d = new Date()
  return toISODate(d)
}

/** `Date` → `YYYY-MM-DD` en zona local (sin saltos de día por UTC). */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parsea `YYYY-MM-DD` a `Date` local (mediodía para evitar líos de DST). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0)
}

const LONG = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
const MONTH_YEAR = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
const DAY_HEADER = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** `"9 de junio 2026"` (para el header). */
export function formatLongDate(d: Date = new Date()): string {
  // Intl da "9 de junio de 2026"; quitamos el "de" antes del año para casar el diseño.
  return LONG.format(d).replace(/ de (\d{4})$/, ' $1')
}

/** `"Junio 2026"` (selector de mes en estadísticas). */
export function formatMonthYear(year: number, month: number): string {
  return cap(MONTH_YEAR.format(new Date(year, month, 1)))
}

/** `"Lun 9 jun"` (cabecera de día en la lista). */
export function formatDayHeader(iso: string): string {
  const parts = DAY_HEADER.format(parseISODate(iso)) // "lun, 9 jun"
  return cap(parts.replace(',', '').replace('.', ''))
}

// ────────────────────────────────────────────────────────────────────────────
// Agrupado / cálculo
// ────────────────────────────────────────────────────────────────────────────

export interface DayGroup {
  date: string // YYYY-MM-DD
  net: number // ingresos - gastos del día
  items: Transaction[]
}

/** Agrupa movimientos por día, ordenados por fecha desc; dentro del día, por created_at desc. */
export function groupByDay(transactions: Transaction[]): DayGroup[] {
  const map = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const arr = map.get(t.date)
    if (arr) arr.push(t)
    else map.set(t.date, [t])
  }
  const groups: DayGroup[] = []
  for (const [date, items] of map) {
    items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    const net = items.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
    groups.push({ date, net, items })
  }
  groups.sort((a, b) => (a.date < b.date ? 1 : -1))
  return groups
}

export function sumByType(transactions: Transaction[], type: 'income' | 'expense'): number {
  return transactions.reduce((s, t) => (t.type === type ? s + t.amount : s), 0)
}

export function balanceOf(transactions: Transaction[]): number {
  return transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
}

export function isInMonth(iso: string, year: number, month: number): boolean {
  const d = parseISODate(iso)
  return d.getFullYear() === year && d.getMonth() === month
}

/** Semana del mes (1..6) para una fecha ISO. */
export function weekOfMonth(iso: string): number {
  const day = parseISODate(iso).getDate()
  return Math.floor((day - 1) / 7) + 1
}
