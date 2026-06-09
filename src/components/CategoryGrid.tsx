import type { Category } from '../types'

interface CategoryGridProps {
  categories: Category[]
  selectedId: string | null
  onSelect: (c: Category) => void
}

/** Grid de categorías seleccionables (3 columnas). */
export default function CategoryGrid({ categories, selectedId, onSelect }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {categories.map((category) => {
        const selected = category.id === selectedId
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category)}
            aria-label={category.name}
            aria-pressed={selected}
            className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-18 border-2 px-1 py-3 transition-colors ${
              selected ? 'border-blue bg-blue/5' : 'border-transparent bg-card'
            }`}
          >
            <span className="no-select text-2xl">{category.emoji}</span>
            <span
              className={`text-center text-[11px] leading-tight ${
                selected ? 'text-ink' : 'text-ink2'
              }`}
            >
              {category.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
