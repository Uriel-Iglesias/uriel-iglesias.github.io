import type { WeekBar } from '../hooks/useStats'

interface BarChartProps {
  data: WeekBar[]
}

/** Gráfico de barras agrupadas (ingresos/gastos por semana) hecho con divs. */
export default function BarChart({ data }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)))

  return (
    <div>
      <div className="mb-3 flex gap-4 text-[12px] text-ink2">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green" />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red" />
          Gastos
        </span>
      </div>

      <div className="flex h-40 items-end justify-around">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-32 items-end gap-1">
              <div
                className="w-3.5 rounded-t bg-green"
                style={{ height: `${(d.income / max) * 100}%` }}
              />
              <div
                className="w-3.5 rounded-t bg-red"
                style={{ height: `${(d.expense / max) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-ink2">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
