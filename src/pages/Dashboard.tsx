import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context'
import type { Filter, Transaction, TransactionType } from '../types'
import { balanceOf, formatLongDate, isInMonth, sumByType } from '../lib/utils'
import BalanceCard from '../components/BalanceCard'
import MonthStats from '../components/MonthStats'
import FilterChips from '../components/FilterChips'
import TransactionList from '../components/TransactionList'
import AddSheet from '../components/AddSheet'
import DetailSheet from '../components/DetailSheet'

export default function Dashboard() {
  const { tx } = useApp()
  const navigate = useNavigate()

  const [filter, setFilter] = useState<Filter>('all')
  const [addType, setAddType] = useState<TransactionType | null>(null)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [undo, setUndo] = useState<Transaction | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout>>()

  // Limpia el temporizador del "deshacer" al desmontar.
  useEffect(() => () => clearTimeout(undoTimer.current), [])

  const closeAdd = () => {
    setAddType(null)
    setEditing(null)
  }

  const showUndo = (deleted: Transaction) => {
    clearTimeout(undoTimer.current)
    setUndo(deleted)
    undoTimer.current = setTimeout(() => setUndo(null), 5000)
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const { totalIncome, totalExpense, balance, monthIncome, monthExpense, filtered } = useMemo(() => {
    const all = tx.transactions
    const monthTx = all.filter((t) => isInMonth(t.date, year, month))
    return {
      totalIncome: sumByType(all, 'income'),
      totalExpense: sumByType(all, 'expense'),
      balance: balanceOf(all),
      monthIncome: sumByType(monthTx, 'income'),
      monthExpense: sumByType(monthTx, 'expense'),
      filtered: filter === 'all' ? all : all.filter((t) => t.type === filter),
    }
  }, [tx.transactions, filter, year, month])

  return (
    // Altura de viewport dinámica (dvh): la barra inferior queda SIEMPRE dentro del
    // área visible, por encima de la barra de Safari, así que siempre es pulsable.
    <div className="app-vh relative flex flex-col overflow-hidden bg-bg">
      {/* Header con blur */}
      <header className="z-30 shrink-0 border-b border-sep/60 bg-bg/80 px-5 pb-3 pt-safe backdrop-blur-xl">
        <div className="flex items-end justify-between pt-2.5">
          <div>
            <h1 className="text-[26px] font-bold leading-tight tracking-tight">💰 Finanzas</h1>
            <p className="mt-0.5 text-[13px] first-letter:uppercase text-ink2">{formatLongDate(now)}</p>
          </div>
          <div className="flex items-center gap-2">
            {tx.pending > 0 && (
              <span className="tabular rounded-full bg-blue/10 px-2 py-1 text-[11px] font-semibold text-blue">
                ↻ {tx.pending}
              </span>
            )}
            <HeaderButton label="Estadísticas" onClick={() => navigate('/stats')}>
              📊
            </HeaderButton>
            <HeaderButton label="Exportar" onClick={() => navigate('/export')}>
              ⤓
            </HeaderButton>
          </div>
        </div>
      </header>

      {/* Contenido (área scrollable entre header y barra) */}
      <main className="ios-scroll flex-1 space-y-3.5 overflow-y-auto px-5 pb-6 pt-3.5">
        <BalanceCard balance={balance} totalIncome={totalIncome} totalExpense={totalExpense} />
        <MonthStats income={monthIncome} expense={monthExpense} />

        <div className="pt-1">
          <FilterChips value={filter} onChange={setFilter} />
        </div>

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <TransactionList transactions={filtered} onSelect={setSelected} />
        )}
      </main>

      {/* Barra inferior (en el flujo, siempre visible dentro del dvh) */}
      <nav className="z-40 shrink-0 border-t border-sep/60 bg-bg/90 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-xl">
        <div className="flex gap-3">
          <ActionButton color="green" onClick={() => setAddType('income')}>
            ＋ Ingreso
          </ActionButton>
          <ActionButton color="red" onClick={() => setAddType('expense')}>
            ＋ Gasto
          </ActionButton>
        </div>
      </nav>

      {/* Toast "Deshacer" tras borrar */}
      {undo && (
        <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+82px)] z-[45] flex items-center justify-between rounded-14 bg-dark px-4 py-3 text-white shadow-sheet">
          <span className="text-[14px]">Movimiento eliminado</span>
          <button
            type="button"
            onClick={async () => {
              const t = undo
              clearTimeout(undoTimer.current)
              setUndo(null)
              await tx.restore(t)
            }}
            className="text-[14px] font-semibold text-green-vivid active:opacity-70"
          >
            Deshacer
          </button>
        </div>
      )}

      {/* Sheets */}
      <AddSheet
        open={addType !== null}
        type={addType ?? 'expense'}
        editing={editing}
        onClose={closeAdd}
        onSave={async (input) => {
          if (editing) await tx.update(editing.id, input)
          else await tx.add(input)
          closeAdd()
        }}
      />
      <DetailSheet
        open={selected !== null}
        transaction={selected}
        onClose={() => setSelected(null)}
        onEdit={() => {
          if (!selected) return
          setEditing(selected)
          setAddType(selected.type)
          setSelected(null)
        }}
        onDelete={async (id) => {
          const deleted = selected
          await tx.remove(id)
          setSelected(null)
          if (deleted) showUndo(deleted)
        }}
      />
    </div>
  )
}

function HeaderButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-lg shadow-card active:scale-95"
    >
      {children}
    </button>
  )
}

function ActionButton({
  children,
  color,
  onClick,
}: {
  children: React.ReactNode
  color: 'green' | 'red'
  onClick: () => void
}) {
  const bg = color === 'green' ? 'bg-green' : 'bg-red'
  return (
    <button
      onClick={onClick}
      className={`h-[52px] flex-1 rounded-18 ${bg} text-[17px] font-semibold text-white transition-transform active:scale-[0.97]`}
    >
      {children}
    </button>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-22 bg-card py-14 text-center shadow-card">
      <span className="text-4xl">🧾</span>
      <p className="mt-3 text-[15px] font-semibold text-ink">Aún no hay movimientos</p>
      <p className="mt-1 text-[13px] text-ink2">Toca ＋ Ingreso o ＋ Gasto para empezar</p>
    </div>
  )
}
