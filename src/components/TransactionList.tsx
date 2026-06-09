import type { Transaction } from '../types'
import { formatBalance, formatDayHeader, groupByDay } from '../lib/utils'
import TransactionItem from './TransactionItem'

interface TransactionListProps {
  transactions: Transaction[]
  onSelect: (tx: Transaction) => void
}

/** Lista de movimientos agrupados por día, con cabecera de día y neto. */
export default function TransactionList({ transactions, onSelect }: TransactionListProps) {
  const groups = groupByDay(transactions)

  return (
    <div>
      {groups.map((group) => {
        const netColor =
          group.net > 0 ? 'text-green' : group.net < 0 ? 'text-red' : 'text-ink2'

        return (
          <section key={group.date}>
            <div className="mt-5 mb-2 flex items-center justify-between px-1">
              <span className="text-[13px] font-semibold text-ink2">
                {formatDayHeader(group.date)}
              </span>
              <span className={`tabular text-[13px] font-semibold ${netColor}`}>
                {formatBalance(group.net)}
              </span>
            </div>

            <div className="overflow-hidden rounded-22 bg-card shadow-card [&>*+*]:border-t [&>*+*]:border-sep">
              {group.items.map((t) => (
                <TransactionItem key={t.id} tx={t} onClick={() => onSelect(t)} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
