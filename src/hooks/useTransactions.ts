import { useCallback, useEffect, useRef, useState } from 'react'
import type { NewTransaction, Transaction } from '../types'
import * as db from '../lib/db'

export interface TransactionsStore {
  transactions: Transaction[]
  loading: boolean
  /** Operaciones pendientes de sincronizar con Supabase (0 en modo local). */
  pending: number
  add: (input: NewTransaction) => Promise<Transaction>
  remove: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Fuente de verdad de los movimientos para la UI.
 * Local-first: estado instantáneo desde caché (por usuario) + sync en segundo plano.
 */
export function useTransactions(userId: string | null): TransactionsStore {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [pending, setPending] = useState<number>(0)
  const userIdRef = useRef(userId)
  userIdRef.current = userId

  const syncPending = useCallback(() => {
    const uid = userIdRef.current
    setPending(uid ? db.pendingCount(uid) : 0)
  }, [])

  const refresh = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid) return
    const list = await db.loadAll(uid)
    setTransactions(list)
    syncPending()
  }, [syncPending])

  // Carga inicial / cambio de usuario.
  useEffect(() => {
    if (!userId) {
      setTransactions([])
      setPending(0)
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    // Pinta la caché de este usuario de inmediato y luego refresca desde servidor.
    setTransactions(db.readCache(userId))
    setPending(db.pendingCount(userId))
    db.loadAll(userId)
      .then((list) => {
        if (!active) return
        setTransactions(list)
        setPending(db.pendingCount(userId))
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [userId])

  // Reintentar sincronización al recuperar conexión / volver a la app (iOS PWA).
  useEffect(() => {
    if (!userId) return
    const wake = () => {
      db.flushOutbox(userId).then(() => refresh())
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') wake()
    }
    window.addEventListener('online', wake)
    window.addEventListener('focus', wake)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', wake)
      window.removeEventListener('focus', wake)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, refresh])

  const add = useCallback<TransactionsStore['add']>(
    async (input) => {
      const uid = userIdRef.current ?? 'local-user'
      const tx = await db.addTransaction(uid, input)
      setTransactions((prev) =>
        [tx, ...prev].sort((a, b) => {
          if (a.date !== b.date) return a.date < b.date ? 1 : -1
          return a.created_at < b.created_at ? 1 : -1
        }),
      )
      syncPending()
      return tx
    },
    [syncPending],
  )

  const remove = useCallback<TransactionsStore['remove']>(
    async (id) => {
      const uid = userIdRef.current ?? 'local-user'
      await db.deleteTransaction(uid, id)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      syncPending()
    },
    [syncPending],
  )

  return { transactions, loading, pending, add, remove, refresh }
}
