import type { Category, TransactionType } from '../types'

// Categorías de INGRESOS. El orden define el orden en el grid.
export const INCOME_CATEGORIES: Category[] = [
  { id: 'stand-google-1', emoji: '📊', name: 'Stand Google ×1', type: 'income', preset: 30 },
  { id: 'stand-google-2', emoji: '📊', name: 'Stand Google ×2', type: 'income', preset: 50 },
  { id: 'stand-google-3', emoji: '📊', name: 'Stand Google ×3', type: 'income', preset: 60 },
  { id: 'llavero-gold', emoji: '🔑', name: 'Llavero Gold', type: 'income' },
  { id: 'llavero-diamond', emoji: '💎', name: 'Llavero Diamond', type: 'income' },
  { id: 'papa', emoji: '👨', name: 'Papá', type: 'income' },
  { id: 'mama', emoji: '👩', name: 'Mamá', type: 'income' },
  { id: 'salario', emoji: '💼', name: 'Salario', type: 'income' },
  { id: 'venta', emoji: '🏷️', name: 'Venta', type: 'income' },
  { id: 'regalo-in', emoji: '🎁', name: 'Regalo', type: 'income' },
  { id: 'otros-in', emoji: '💰', name: 'Otros', type: 'income' },
]

// Categorías de GASTOS.
export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'bus', emoji: '🚌', name: 'Bus', type: 'expense', preset: 2 },
  { id: 'comida', emoji: '🍕', name: 'Comida', type: 'expense' },
  { id: 'cafe', emoji: '☕', name: 'Café', type: 'expense' },
  { id: 'supermercado', emoji: '🛒', name: 'Supermercado', type: 'expense' },
  { id: 'snack', emoji: '🍪', name: 'Snack', type: 'expense' },
  { id: 'bebidas', emoji: '🥤', name: 'Bebidas', type: 'expense' },
  { id: 'taxi', emoji: '🚕', name: 'Taxi / Uber', type: 'expense' },
  { id: 'transporte', emoji: '🚇', name: 'Transporte', type: 'expense' },
  { id: 'gasolina', emoji: '⛽', name: 'Gasolina', type: 'expense' },
  { id: 'ropa', emoji: '👕', name: 'Ropa', type: 'expense' },
  { id: 'calzado', emoji: '👟', name: 'Calzado', type: 'expense' },
  { id: 'electronica', emoji: '📱', name: 'Electrónica', type: 'expense' },
  { id: 'musica', emoji: '🎵', name: 'Música', type: 'expense' },
  { id: 'juguetes', emoji: '🧸', name: 'Juguetes', type: 'expense' },
  { id: 'muebles', emoji: '🪑', name: 'Muebles', type: 'expense' },
  { id: 'tiendas', emoji: '🏪', name: 'Tiendas', type: 'expense' },
  { id: 'deportes', emoji: '⚽', name: 'Deportes', type: 'expense' },
  { id: 'ocio', emoji: '🎬', name: 'Ocio', type: 'expense' },
  { id: 'viajes', emoji: '✈️', name: 'Viajes', type: 'expense' },
  { id: 'regalos-ex', emoji: '🎁', name: 'Regalos', type: 'expense' },
  { id: 'juegos', emoji: '🎮', name: 'Juegos', type: 'expense' },
  { id: 'medico', emoji: '🏥', name: 'Médico', type: 'expense' },
  { id: 'farmacia', emoji: '💊', name: 'Farmacia', type: 'expense' },
  { id: 'gimnasio', emoji: '🏋️', name: 'Gimnasio', type: 'expense' },
  { id: 'estudios', emoji: '📚', name: 'Estudios', type: 'expense' },
  { id: 'casa', emoji: '🏠', name: 'Casa / Alquiler', type: 'expense' },
  { id: 'facturas', emoji: '💡', name: 'Facturas', type: 'expense' },
  { id: 'higiene', emoji: '🧴', name: 'Higiene', type: 'expense' },
  { id: 'belleza', emoji: '💅', name: 'Belleza', type: 'expense' },
  { id: 'mascotas', emoji: '🐾', name: 'Mascotas', type: 'expense' },
  { id: 'suscripcion', emoji: '🔄', name: 'Suscripción', type: 'expense' },
  { id: 'material-negocio', emoji: '🧵', name: 'Material negocio', type: 'expense' },
  { id: 'envios', emoji: '📦', name: 'Envíos', type: 'expense' },
  { id: 'otros-ex', emoji: '💸', name: 'Otros', type: 'expense' },
]

export const ALL_CATEGORIES: Category[] = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

const CATEGORY_MAP = new Map<string, Category>(ALL_CATEGORIES.map((c) => [c.id, c]))

export function categoriesFor(type: TransactionType): Category[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

/** Devuelve la categoría por id, o `undefined` si no existe (datos antiguos). */
export function getCategory(id: string): Category | undefined {
  return CATEGORY_MAP.get(id)
}

/** Nombre legible de una categoría; cae al id crudo si no se encuentra. */
export function categoryName(id: string): string {
  return CATEGORY_MAP.get(id)?.name ?? id
}

/** Emoji de una categoría; cae a 💸/💰 según el tipo si no se encuentra. */
export function categoryEmoji(id: string, type: TransactionType): string {
  return CATEGORY_MAP.get(id)?.emoji ?? (type === 'income' ? '💰' : '💸')
}

/**
 * Color suave (HSL) para el pill del emoji, derivado de forma estable del id.
 * Da variedad tipo iOS sin tener que asignar 45 colores a mano.
 */
export function pillColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 65%, 92%)`
}
