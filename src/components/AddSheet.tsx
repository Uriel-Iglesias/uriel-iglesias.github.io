import { useEffect, useState } from 'react'
import type { Category, NewTransaction, Transaction, TransactionType } from '../types'
import { categoriesFor } from '../lib/categories'
import { todayISO } from '../lib/utils'
import Sheet from './Sheet'
import CategoryGrid from './CategoryGrid'

interface AddSheetProps {
  open: boolean
  type: TransactionType
  /** Si se pasa, el sheet entra en modo edición (pre-rellenado). */
  editing?: Transaction | null
  onClose: () => void
  onSave: (t: NewTransaction) => void | Promise<void>
}

/** Sheet para añadir o editar un movimiento (máximo 2 toques para guardar). */
export default function AddSheet({ open, type, editing, onClose, onSave }: AddSheetProps) {
  const [kind, setKind] = useState<TransactionType>(type)
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)

  // Al abrir: pre-rellena si es edición, o estado limpio respetando el tipo pulsado.
  useEffect(() => {
    if (!open) return
    setSaving(false)
    if (editing) {
      setKind(editing.type)
      setAmount(String(editing.amount).replace('.', ','))
      setCategoryId(editing.category)
      setNote(editing.description)
      setDate(editing.date)
    } else {
      setKind(type)
      setAmount('')
      setCategoryId(null)
      setNote('')
      setDate(todayISO())
    }
  }, [open, type, editing])

  function parseAmount(): number {
    const n = parseFloat(amount.replace(',', '.'))
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  function selectKind(next: TransactionType) {
    setKind(next)
    setCategoryId(null)
  }

  function handleAmount(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^0-9.,]/g, '').replace(/([.,].*)[.,]/g, '$1')
    setAmount(v)
  }

  function handlePick(cat: Category) {
    setCategoryId(cat.id)
    if (cat.preset != null) setAmount(String(cat.preset))
    if (note.trim() === '') setNote(cat.name)
  }

  async function handleSave() {
    const n = parseAmount()
    if (n <= 0 || saving) return
    setSaving(true)
    const tx: NewTransaction = {
      type: kind,
      amount: n,
      category: categoryId ?? (kind === 'income' ? 'otros-in' : 'otros-ex'),
      description: note.trim(),
      date,
    }
    try {
      await onSave(tx)
    } finally {
      // Rehabilita el botón aunque el guardado falle (el padre cierra si va bien).
      setSaving(false)
    }
  }

  const isIncome = kind === 'income'
  const invalid = parseAmount() <= 0 || saving

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="Añadir movimiento">
      <div className="space-y-4 pt-1">
        {/* Toggle segmentado Ingreso / Gasto */}
        <div className="grid grid-cols-2 rounded-full bg-bg p-1">
          <button
            type="button"
            onClick={() => selectKind('income')}
            aria-pressed={isIncome}
            className={`flex h-11 items-center justify-center rounded-full text-[15px] font-semibold transition-colors ${
              isIncome ? 'bg-card text-green shadow-card' : 'text-ink2'
            }`}
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => selectKind('expense')}
            aria-pressed={!isIncome}
            className={`flex h-11 items-center justify-center rounded-full text-[15px] font-semibold transition-colors ${
              !isIncome ? 'bg-card text-red shadow-card' : 'text-ink2'
            }`}
          >
            Gasto
          </button>
        </div>

        {/* Importe grande */}
        <div className="flex items-center justify-center gap-1 py-2">
          <span className="text-3xl text-ink2">€</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={handleAmount}
            placeholder="0"
            aria-label="Importe"
            className="tabular w-full min-w-0 bg-transparent text-center text-[60px] font-bold outline-none"
          />
        </div>

        {/* Grid de categorías */}
        <CategoryGrid categories={categoriesFor(kind)} selectedId={categoryId} onSelect={handlePick} />

        {/* Campos opcionales */}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (opcional)"
          aria-label="Nota"
          className="h-12 w-full rounded-14 bg-bg px-4 text-[16px] outline-none"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Fecha"
          className="h-12 w-full rounded-14 bg-bg px-4 text-[16px] outline-none"
        />

        {/* Guardar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={invalid}
          className={`h-[52px] w-full rounded-18 font-semibold text-white transition-opacity ${
            isIncome ? 'bg-green' : 'bg-red'
          } ${invalid ? 'opacity-40' : ''}`}
        >
          {editing ? 'Guardar cambios' : isIncome ? 'Guardar ingreso' : 'Guardar gasto'}
        </button>
      </div>
    </Sheet>
  )
}
