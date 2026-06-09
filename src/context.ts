import { createContext, useContext } from 'react'
import type { AuthState } from './hooks/useAuth'
import type { TransactionsStore } from './hooks/useTransactions'

export interface AppContextValue {
  auth: AuthState
  tx: TransactionsStore
}

export const AppContext = createContext<AppContextValue | null>(null)

/** Acceso compartido a auth + movimientos. Disponible en cualquier página. */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppContext.Provider>')
  return ctx
}
