import type { NewTransaction, Transaction } from '../types'
import { supabase, supabaseEnabled } from './supabase'

/**
 * Capa de datos local-first.
 *
 * - Siempre hay una caché en localStorage → la UI es instantánea y funciona offline.
 * - La caché y la "outbox" se separan POR USUARIO (evita filtrar datos entre cuentas).
 * - Si Supabase está activo, las escrituras son optimistas y se sincronizan en
 *   segundo plano (fire-and-forget); lo que falle o se haga offline se encola en la
 *   outbox y se reintenta al volver online / al abrir la app.
 * - Si Supabase NO está activo, la caché ES la base de datos.
 *
 * Tabla esperada en Supabase: `transactions` (ver README).
 */

const TABLE = 'transactions'

const cacheKey = (userId: string) => `finanzas:transactions:${userId}:v1`
const outboxKey = (userId: string) => `finanzas:outbox:${userId}:v1`

// ── caché local ──────────────────────────────────────────────────────────────

export function readCache(userId: string): Transaction[] {
  try {
    const raw = localStorage.getItem(cacheKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Transaction[]) : []
  } catch {
    return []
  }
}

export function writeCache(userId: string, list: Transaction[]): void {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(list))
  } catch {
    // cuota llena / modo privado: la app sigue con el estado en memoria.
  }
}

/** Borra caché y outbox de un usuario (al cerrar sesión). */
export function clearLocal(userId: string): void {
  try {
    localStorage.removeItem(cacheKey(userId))
    localStorage.removeItem(outboxKey(userId))
  } catch {
    /* ignore */
  }
}

// ── outbox (operaciones pendientes de sincronizar) ───────────────────────────

type OutboxOp = { kind: 'insert'; tx: Transaction } | { kind: 'delete'; id: string }

function readOutbox(userId: string): OutboxOp[] {
  try {
    const raw = localStorage.getItem(outboxKey(userId))
    return raw ? (JSON.parse(raw) as OutboxOp[]) : []
  } catch {
    return []
  }
}

function writeOutbox(userId: string, ops: OutboxOp[]): void {
  try {
    localStorage.setItem(outboxKey(userId), JSON.stringify(ops))
  } catch {
    /* ignore */
  }
}

function enqueue(userId: string, op: OutboxOp): void {
  writeOutbox(userId, [...readOutbox(userId), op])
}

/**
 * Cancela pares insert+delete del mismo id (la fila nunca llegó al servidor, así
 * que no hay nada que sincronizar) y conserva el resto. Evita "resucitar" filas.
 */
function compact(ops: OutboxOp[]): OutboxOp[] {
  const inserted = new Set(ops.flatMap((o) => (o.kind === 'insert' ? [o.tx.id] : [])))
  const deleted = new Set(ops.flatMap((o) => (o.kind === 'delete' ? [o.id] : [])))
  const cancelled = new Set([...inserted].filter((id) => deleted.has(id)))
  return ops.filter((o) => !cancelled.has(o.kind === 'insert' ? o.tx.id : o.id))
}

export function pendingCount(userId: string): number {
  return readOutbox(userId).length
}

// ── helpers ──────────────────────────────────────────────────────────────────

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

function sortDesc(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.created_at < b.created_at ? 1 : -1
  })
}

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Carga inicial: devuelve la caché de inmediato y, si hay Supabase + conexión,
 * vacía la outbox y refresca desde el servidor MEZCLANDO con lo que siga pendiente
 * (no descarta inserts/deletes aún sin sincronizar).
 */
export async function loadAll(userId: string): Promise<Transaction[]> {
  const cached = sortDesc(readCache(userId))
  if (!supabaseEnabled || !supabase || !isOnline()) return cached

  try {
    await flushOutbox(userId)
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error

    const remote = (data ?? []) as Transaction[]

    // Mezcla con lo que SIGA pendiente tras el flush (lo que no se pudo enviar).
    const ob = readOutbox(userId)
    const pendingInserts = ob.flatMap((o) => (o.kind === 'insert' ? [o.tx] : []))
    const pendingDeletes = new Set(ob.flatMap((o) => (o.kind === 'delete' ? [o.id] : [])))
    const pendingInsertIds = new Set(pendingInserts.map((t) => t.id))

    const merged = sortDesc([
      ...pendingInserts,
      ...remote.filter((t) => !pendingInsertIds.has(t.id) && !pendingDeletes.has(t.id)),
    ])

    writeCache(userId, merged)
    return merged
  } catch {
    // Fallo de red: nos quedamos con la caché.
    return cached
  }
}

/** Crea un movimiento (optimista). Devuelve la transacción completa ya cacheada. */
export async function addTransaction(userId: string, input: NewTransaction): Promise<Transaction> {
  const tx: Transaction = {
    id: newId(),
    user_id: userId,
    type: input.type,
    amount: input.amount,
    category: input.category,
    description: input.description,
    date: input.date,
    created_at: new Date().toISOString(),
  }

  // 1) Optimista: a la caché ya.
  writeCache(userId, sortDesc([tx, ...readCache(userId)]))

  // 2) Sincroniza en segundo plano SIN bloquear al llamante (cierre de sheet instantáneo).
  if (supabaseEnabled && supabase) {
    if (isOnline()) {
      void (async () => {
        try {
          const { error } = await supabase.from(TABLE).upsert(tx) // idempotente ante reintentos
          if (error) enqueue(userId, { kind: 'insert', tx })
        } catch {
          enqueue(userId, { kind: 'insert', tx })
        }
      })()
    } else {
      enqueue(userId, { kind: 'insert', tx })
    }
  }

  return tx
}

/** Elimina un movimiento (optimista). */
export async function deleteTransaction(userId: string, id: string): Promise<void> {
  writeCache(userId, readCache(userId).filter((t) => t.id !== id))

  if (!supabaseEnabled || !supabase) return

  // Si la fila aún estaba pendiente de insertar, nunca llegó al servidor:
  // basta con descartar ese insert y no encolar ningún delete.
  const ob = readOutbox(userId)
  if (ob.some((o) => o.kind === 'insert' && o.tx.id === id)) {
    writeOutbox(userId, ob.filter((o) => !(o.kind === 'insert' && o.tx.id === id)))
    return
  }

  if (isOnline()) {
    void (async () => {
      try {
        const { error } = await supabase.from(TABLE).delete().eq('id', id)
        if (error) enqueue(userId, { kind: 'delete', id })
      } catch {
        enqueue(userId, { kind: 'delete', id })
      }
    })()
  } else {
    enqueue(userId, { kind: 'delete', id })
  }
}

/** Intenta enviar todas las operaciones pendientes. Silencioso si no hay red. */
export async function flushOutbox(userId: string): Promise<void> {
  if (!supabaseEnabled || !supabase || !isOnline()) return

  const ops = compact(readOutbox(userId))
  writeOutbox(userId, ops)
  if (ops.length === 0) return

  const remaining: OutboxOp[] = []
  for (const op of ops) {
    try {
      if (op.kind === 'insert') {
        const { error } = await supabase.from(TABLE).upsert(op.tx)
        if (error) throw error
      } else {
        const { error } = await supabase.from(TABLE).delete().eq('id', op.id)
        if (error) throw error
      }
    } catch {
      remaining.push(op) // reintentamos en la próxima
    }
  }
  writeOutbox(userId, remaining)
}
