import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context'
import { useStats } from '../hooks/useStats'
import { categoryEmoji, categoryName } from '../lib/categories'
import { formatBalance, formatMoney, formatMonthYear } from '../lib/utils'
import BarChart from '../components/BarChart'
import DonutChart from '../components/DonutChart'

export default function Stats() {
  const { tx } = useApp()
  const navigate = useNavigate()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const stats = useStats(tx.transactions, year, month)

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <header className="sticky top-0 z-30 border-b border-sep/60 bg-bg/80 px-5 pb-3 pt-safe backdrop-blur-xl">
        <div className="flex items-center justify-between pt-2.5">
          <button
            onClick={() => navigate('/')}
            className="-ml-1 flex min-h-[44px] items-center gap-0.5 pr-2 text-[17px] font-medium text-blue active:opacity-60"
          >
            <span className="text-xl leading-none">‹</span> Inicio
          </button>
          <h1 className="text-[17px] font-semibold">Estadísticas</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 space-y-3.5 px-5 pb-12 pt-3.5">
        {/* Selector de mes */}
        <div className="flex items-center justify-between rounded-18 bg-card px-2 py-2 shadow-card">
          <ArrowButton dir="left" onClick={() => shift(-1)} />
          <span className="text-[16px] font-semibold">{formatMonthYear(year, month)}</span>
          <ArrowButton dir="right" onClick={() => shift(1)} />
        </div>

        {stats.count === 0 ? (
          <div className="rounded-22 bg-card py-14 text-center shadow-card">
            <span className="text-4xl">📊</span>
            <p className="mt-3 text-[15px] font-semibold">Sin datos este mes</p>
          </div>
        ) : (
          <>
            {/* Balance del mes */}
            <div className="rounded-22 bg-dark px-6 py-5 text-white shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                Balance del mes
              </p>
              <p
                className={`tabular mt-1 text-[34px] font-bold leading-none ${
                  stats.balance >= 0 ? 'text-green-vivid' : 'text-red-vivid'
                }`}
              >
                {formatBalance(stats.balance)}
              </p>
              <div className="mt-3 flex gap-4 text-[13px]">
                <span className="text-green-vivid">↑ {formatMoney(stats.income)}</span>
                <span className="text-red-vivid">↓ {formatMoney(stats.expense)}</span>
              </div>
            </div>

            {/* Barras por semana */}
            <section className="rounded-22 bg-card p-5 shadow-card">
              <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-ink2">
                Ingresos vs Gastos por semana
              </h2>
              <BarChart data={stats.weeks} />
            </section>

            {/* Dona de gastos */}
            {stats.topExpenses.length > 0 && (
              <section className="rounded-22 bg-card p-5 shadow-card">
                <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-ink2">
                  Gastos por categoría
                </h2>
                <div className="flex items-center gap-5">
                  <DonutChart data={stats.topExpenses} total={stats.expense} />
                  <ul className="flex-1 space-y-2">
                    {stats.topExpenses.map((s) => (
                      <li key={s.category} className="flex items-center gap-2 text-[13px]">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: s.color }}
                        />
                        <span className="min-w-0 truncate text-ink2">{categoryName(s.category)}</span>
                        <span className="tabular ml-auto shrink-0 font-semibold">
                          {formatMoney(s.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Ranking de categorías */}
            <section className="rounded-22 bg-card p-2 shadow-card">
              <h2 className="px-3 pb-2 pt-3 text-[13px] font-semibold uppercase tracking-wide text-ink2">
                Mayor gasto
              </h2>
              <ul>
                {stats.byCategory.slice(0, 8).map((s) => (
                  <li
                    key={s.category}
                    className="flex items-center gap-3 border-t border-sep/70 px-3 py-2.5 first:border-t-0"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-lg">
                      {categoryEmoji(s.category, 'expense')}
                    </span>
                    <span className="text-[15px] font-medium">{categoryName(s.category)}</span>
                    <span className="tabular ml-auto text-[15px] font-semibold text-red">
                      {formatMoney(s.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function ArrowButton({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'left' ? 'Mes anterior' : 'Mes siguiente'}
      className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-blue active:bg-bg"
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  )
}
