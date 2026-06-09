import { formatMoney } from '../lib/utils'

interface BalanceCardProps {
  balance: number
  totalIncome: number
  totalExpense: number
}

/** Tarjeta negra con el balance total y dos pills (ingresos / gastos). */
export default function BalanceCard({ balance, totalIncome, totalExpense }: BalanceCardProps) {
  const balanceColor = balance > 0 ? 'text-green-vivid' : balance < 0 ? 'text-red-vivid' : 'text-white'
  const sign = balance < 0 ? '−' : ''

  return (
    <div className="rounded-22 bg-dark px-6 py-7 text-white shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
        Balance actual
      </p>

      <p className={`tabular mt-1.5 text-[52px] font-bold leading-none ${balanceColor}`}>
        {sign}
        {formatMoney(balance)}
      </p>

      <div className="mt-5 flex gap-2.5">
        <Pill color="green" icon="↑" label="Ingresos" value={totalIncome} />
        <Pill color="red" icon="↓" label="Gastos" value={totalExpense} />
      </div>
    </div>
  )
}

function Pill({
  color,
  icon,
  label,
  value,
}: {
  color: 'green' | 'red'
  icon: string
  label: string
  value: number
}) {
  const tint = color === 'green' ? 'text-green-vivid' : 'text-red-vivid'
  return (
    <div className="flex flex-1 items-center gap-2 rounded-14 bg-white/[0.08] px-3.5 py-2.5">
      <span className={`text-base font-bold ${tint}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-white/45">{label}</p>
        <p className="tabular truncate text-[15px] font-semibold text-white">{formatMoney(value)}</p>
      </div>
    </div>
  )
}
