import type { CategorySlice } from '../hooks/useStats'
import { formatMoney } from '../lib/utils'

interface DonutChartProps {
  data: CategorySlice[]
  total: number
}

/** Dona SVG con los gastos por categoría y el total en el centro. */
export default function DonutChart({ data, total }: DonutChartProps) {
  const denom = total > 0 ? total : Math.max(1, data.reduce((s, d) => s + d.value, 0))

  let acumulado = 0

  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 36 36" role="img" aria-label="Gastos por categoría">
        <g>
          <circle cx={18} cy={18} r={15.915} fill="none" stroke="#e5e5ea" strokeWidth={4} />
          {data.map((slice) => {
            const dash = (slice.value / denom) * 100
            const offset = -((acumulado / denom) * 100)
            acumulado += slice.value
            return (
              <circle
                key={slice.category}
                cx={18}
                cy={18}
                r={15.915}
                fill="none"
                stroke={slice.color}
                strokeWidth={4}
                strokeDasharray={`${dash} ${100}`}
                strokeDashoffset={offset}
                transform="rotate(-90 18 18)"
                strokeLinecap="butt"
              />
            )
          })}
        </g>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-[14px] font-bold">{formatMoney(total)}</span>
        <span className="text-ink2 text-[10px]">Gastos</span>
      </div>
    </div>
  )
}
