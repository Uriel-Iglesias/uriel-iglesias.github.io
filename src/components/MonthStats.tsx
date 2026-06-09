import { formatMoney } from '../lib/utils'

interface MonthStatsProps {
  income: number
  expense: number
}

/** Resumen del mes: dos tarjetas con ingresos (verde) y gastos (rojo). */
export default function MonthStats({ income, expense }: MonthStatsProps) {
  return (
    <div>
      <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-ink2">
        Este mes
      </p>

      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="rounded-22 bg-card p-4 shadow-card">
          <p className="text-[13px] text-ink2">Ingresos</p>
          <p className="tabular mt-1 text-[22px] font-bold text-green">
            {formatMoney(income)}
          </p>
        </div>

        <div className="rounded-22 bg-card p-4 shadow-card">
          <p className="text-[13px] text-ink2">Gastos</p>
          <p className="tabular mt-1 text-[22px] font-bold text-red">
            {formatMoney(expense)}
          </p>
        </div>
      </div>
    </div>
  )
}
