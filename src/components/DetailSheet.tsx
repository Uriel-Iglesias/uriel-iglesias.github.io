import { useEffect, useState } from 'react'
import type { Transaction } from '../types'
import { categoryEmoji, categoryName, pillColor } from '../lib/categories'
import { formatLongDate, formatSigned, parseISODate } from '../lib/utils'
import Sheet from './Sheet'

interface DetailSheetProps {
  open: boolean
  transaction: Transaction | null
  onClose: () => void
  onDelete: (id: string) => void | Promise<void>
}

/**
 * Sheet de detalle de un movimiento, con acción de eliminar.
 * Conserva la última transacción no nula (`shown`) para no parpadear mientras
 * el sheet anima su salida (en ese momento `transaction` ya puede ser null).
 */
export default function DetailSheet({ open, transaction, onClose, onDelete }: DetailSheetProps) {
  const [shown, setShown] = useState<Transaction | null>(transaction)

  useEffect(() => {
    if (transaction != null) setShown(transaction)
  }, [transaction])

  const tx = shown

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="Detalle del movimiento">
      {tx && (
        <div className="flex flex-col items-center gap-3 pt-2">
          {/* Pill con emoji de la categoría */}
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: pillColor(tx.category) }}
          >
            <span className="text-3xl">{categoryEmoji(tx.category, tx.type)}</span>
          </div>

          {/* Importe */}
          <p
            className={`tabular text-[40px] font-bold ${
              tx.type === 'income' ? 'text-green' : 'text-red'
            }`}
          >
            {formatSigned(tx.amount, tx.type)}
          </p>

          {/* Descripción */}
          <p className="text-center text-ink2">
            {tx.description.trim() || categoryName(tx.category)}
          </p>

          {/* Tarjeta de metadatos */}
          <div className="grid w-full grid-cols-3 rounded-18 bg-bg p-1">
            <Field label="Categoría" value={categoryName(tx.category)} />
            <Field label="Fecha" value={formatLongDate(parseISODate(tx.date))} />
            <Field label="Tipo" value={tx.type === 'income' ? 'Ingreso' : 'Gasto'} />
          </div>

          {/* Eliminar */}
          <button
            type="button"
            onClick={async () => {
              await onDelete(tx.id)
            }}
            className="h-[52px] w-full rounded-18 bg-red/10 font-semibold text-red transition-colors active:bg-red/20"
          >
            Eliminar movimiento
          </button>
        </div>
      )}
    </Sheet>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-2 py-2.5 text-center">
      <span className="text-[11px] uppercase text-ink2">{label}</span>
      <span className="mt-0.5 text-[15px] font-medium">{value}</span>
    </div>
  )
}
