// Tipos centrales de la app. Toda la app comparte estas definiciones.

export type TransactionType = 'income' | 'expense'

/** Filtro de la lista del dashboard. */
export type Filter = 'all' | 'income' | 'expense'

/** Un movimiento (ingreso o gasto) tal y como se guarda. */
export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  /** Siempre positivo. El signo se deriva de `type`. */
  amount: number
  /** id estable de la categoría (ver lib/categories.ts). */
  category: string
  description: string
  /** Fecha del movimiento en formato `YYYY-MM-DD`. */
  date: string
  /** ISO timestamp de creación. */
  created_at: string
}

/** Datos necesarios para crear un movimiento nuevo (el resto se genera). */
export interface NewTransaction {
  type: TransactionType
  amount: number
  category: string
  description: string
  date: string
}

/** Definición de una categoría seleccionable en el grid. */
export interface Category {
  /** id estable, p.ej. `bus`, `stand-google-1`. Se guarda en transaction.category. */
  id: string
  emoji: string
  name: string
  type: TransactionType
  /** Precio predefinido en € que rellena el importe al tocar la categoría. */
  preset?: number
}
