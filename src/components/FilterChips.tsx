import type { Filter } from '../types'

interface FilterChipsProps {
  value: Filter
  onChange: (f: Filter) => void
}

const CHIPS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'income', label: '↑ Ingresos' },
  { id: 'expense', label: '↓ Gastos' },
]

/** Chips horizontales para filtrar la lista de movimientos. */
export default function FilterChips({ value, onChange }: FilterChipsProps) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
      {CHIPS.map((chip) => {
        const active = value === chip.id
        return (
          <button
            key={chip.id}
            onClick={() => onChange(chip.id)}
            className={`flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full px-4 text-[14px] font-semibold transition-colors ${
              active ? 'bg-ink text-white' : 'bg-card text-ink2'
            }`}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
