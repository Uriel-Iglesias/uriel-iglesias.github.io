import { useNavigate } from 'react-router-dom'
import type { Transaction } from '../types'
import { useApp } from '../context'
import { categoryName } from '../lib/categories'
import { isInMonth, parseISODate } from '../lib/utils'

/** Escapa un campo CSV: si contiene `;`, comilla doble o salto de línea, lo
 * envuelve en comillas dobles y duplica las comillas internas. */
function escapeCSV(value: string): string {
  if (/[";\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Construye un CSV (separador `;`, BOM al principio) a partir de movimientos. */
function toCSV(rows: Transaction[]): string {
  const header = 'Fecha;Tipo;Categoria;Descripcion;Importe'
  const lines = [header]

  for (const t of rows) {
    const d = parseISODate(t.date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const fecha = `${day}/${month}/${d.getFullYear()}`

    const tipo = t.type === 'income' ? 'Ingreso' : 'Gasto'
    const categoria = escapeCSV(categoryName(t.category))
    const descripcion = escapeCSV(t.description)
    const importe =
      (t.type === 'expense' ? '-' : '') + t.amount.toFixed(2).replace('.', ',')

    lines.push(`${fecha};${tipo};${categoria};${descripcion};${importe}`)
  }

  return '﻿' + lines.join('\r\n')
}

/** Descarga un CSV (el BOM ya viene dentro de `csv`). */
function download(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function Export() {
  const { tx } = useApp()
  const navigate = useNavigate()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const monthRows = tx.transactions.filter((t) => isInMonth(t.date, year, month))
  const monthCount = monthRows.length
  const totalCount = tx.transactions.length

  const monthFilename = `finanzas-${year}-${String(month + 1).padStart(2, '0')}.csv`

  const exportMonth = () => {
    download(monthFilename, toCSV(monthRows))
  }

  const exportAll = () => {
    download('finanzas-todo.csv', toCSV(tx.transactions))
  }

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <header className="sticky top-0 z-30 border-b border-sep/60 bg-bg/80 px-5 pb-3 pt-safe backdrop-blur-xl">
        <div className="flex items-center justify-between pt-2.5">
          <button
            onClick={() => navigate('/')}
            className="-ml-1 flex h-9 items-center gap-0.5 pr-2 text-[17px] font-medium text-blue active:opacity-60"
          >
            <span className="text-xl leading-none">‹</span> Inicio
          </button>
          <h1 className="text-[17px] font-semibold">Exportar</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 space-y-3.5 px-5 pb-[calc(env(safe-area-inset-bottom)+32px)] pt-3.5">
        <p className="text-[14px] text-ink2">
          Descarga tus movimientos en formato CSV, compatible con Excel y Hojas de
          cálculo. Ideal para guardar una copia o analizar tus finanzas con más
          detalle.
        </p>

        <div className="space-y-3">
          <button
            onClick={exportMonth}
            disabled={monthCount === 0}
            className={`h-[52px] w-full rounded-18 bg-blue text-[16px] font-semibold text-white transition-opacity active:opacity-80 ${
              monthCount === 0 ? 'opacity-40' : ''
            }`}
          >
            Exportar CSV del mes
          </button>

          <button
            onClick={exportAll}
            disabled={totalCount === 0}
            className={`h-[52px] w-full rounded-18 border border-sep bg-card text-[16px] font-semibold text-ink transition-opacity active:opacity-60 ${
              totalCount === 0 ? 'opacity-40' : ''
            }`}
          >
            Exportar todo
          </button>
        </div>

        <p className="tabular pt-1 text-center text-[13px] text-ink2">
          {monthCount} {monthCount === 1 ? 'movimiento' : 'movimientos'} este mes ·{' '}
          {totalCount} en total
        </p>
      </main>
    </div>
  )
}
