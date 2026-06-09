import type { Transaction } from '../types'
import { categoryEmoji, categoryName, pillColor } from '../lib/categories'
import { formatSigned } from '../lib/utils'

interface TransactionItemProps {
  tx: Transaction
  onClick: () => void
}

/** Fila de un movimiento en la lista: pill con emoji, descripción/categoría e importe. */
export default function TransactionItem({ tx, onClick }: TransactionItemProps) {
  const name = categoryName(tx.category)
  const title = tx.description.trim() || name
  const amountColor = tx.type === 'income' ? 'text-green' : 'text-red'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title}, ${formatSigned(tx.amount, tx.type)}`}
      className="flex w-full min-h-[44px] items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-bg"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: pillColor(tx.category) }}
      >
        <span className="text-xl">{categoryEmoji(tx.category, tx.type)}</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{title}</p>
        <p className="truncate text-[13px] text-ink2">{name}</p>
      </div>

      <span
        className={`tabular whitespace-nowrap text-[16px] font-semibold ${amountColor}`}
      >
        {formatSigned(tx.amount, tx.type)}
      </span>
    </button>
  )
}
