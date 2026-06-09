import { useMemo } from 'react'
import type { Transaction } from '../types'
import { isInMonth, weekOfMonth } from '../lib/utils'
import { pillColor } from '../lib/categories'

export interface WeekBar {
  label: string // "S1".."S5"
  income: number
  expense: number
}

export interface CategorySlice {
  category: string // id de categoría
  value: number
  color: string
}

export interface MonthStatsData {
  income: number
  expense: number
  balance: number
  /** Barras por semana del mes (siempre incluye las semanas presentes en el mes). */
  weeks: WeekBar[]
  /** Gastos por categoría, ordenados desc. */
  byCategory: CategorySlice[]
  /** Top 5 categorías de gasto (para la dona). */
  topExpenses: CategorySlice[]
  count: number
}

// Gama cálida/neutra: sin verde (=ingreso) ni azul (=selección) para no romper la
// semántica de color de la app en la dona de GASTOS.
const DONUT_COLORS = ['#ff3b30', '#ff9500', '#ffcc00', '#ff6482', '#bf5af2', '#ff9f0a', '#d6336c']

/** Estadísticas de un mes concreto (year, month 0-11). */
export function useStats(transactions: Transaction[], year: number, month: number): MonthStatsData {
  return useMemo(() => {
    const inMonth = transactions.filter((t) => isInMonth(t.date, year, month))

    let income = 0
    let expense = 0
    const weekMap = new Map<number, { income: number; expense: number }>()
    const expenseByCat = new Map<string, number>()

    for (const t of inMonth) {
      const w = weekOfMonth(t.date)
      const bucket = weekMap.get(w) ?? { income: 0, expense: 0 }
      if (t.type === 'income') {
        income += t.amount
        bucket.income += t.amount
      } else {
        expense += t.amount
        bucket.expense += t.amount
        expenseByCat.set(t.category, (expenseByCat.get(t.category) ?? 0) + t.amount)
      }
      weekMap.set(w, bucket)
    }

    const maxWeek = inMonth.length > 0 ? Math.max(...weekMap.keys()) : 0
    const weeks: WeekBar[] = []
    for (let w = 1; w <= Math.max(maxWeek, 4); w++) {
      const b = weekMap.get(w) ?? { income: 0, expense: 0 }
      weeks.push({ label: `S${w}`, income: b.income, expense: b.expense })
    }

    const byCategory: CategorySlice[] = [...expenseByCat.entries()]
      .map(([category, value]) => ({ category, value, color: pillColor(category) }))
      .sort((a, b) => b.value - a.value)

    const topExpenses: CategorySlice[] = byCategory.slice(0, 5).map((s, i) => ({
      ...s,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }))

    return {
      income,
      expense,
      balance: income - expense,
      weeks,
      byCategory,
      topExpenses,
      count: inMonth.length,
    }
  }, [transactions, year, month])
}
