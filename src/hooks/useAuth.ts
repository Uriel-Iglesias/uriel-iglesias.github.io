import { useEffect, useState } from 'react'
import { supabase, supabaseEnabled } from '../lib/supabase'
import { clearLocal } from '../lib/db'

export interface AuthUser {
  id: string
  email: string | null
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  /** `true` cuando no hay Supabase: la app va 100% local sin login real. */
  localMode: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const LOCAL_USER: AuthUser = { id: 'local-user', email: 'local@finanzas' }

/**
 * Autenticación.
 * - Con Supabase: email + contraseña, sesión persistente.
 * - Sin Supabase (modo local): siempre autenticado como un único usuario local.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(supabaseEnabled ? null : LOCAL_USER)
  const [loading, setLoading] = useState<boolean>(supabaseEnabled)

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return

    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const s = data.session
      setUser(s ? { id: s.user.id, email: s.user.email ?? null } : null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? { id: session.user.id, email: session.user.email ?? null } : null)
      setLoading(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn: AuthState['signIn'] = async (email, password) => {
    if (!supabaseEnabled || !supabase) {
      setUser(LOCAL_USER)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? translateError(error.message) : null }
  }

  const signOut: AuthState['signOut'] = async () => {
    const current = user?.id
    if (supabaseEnabled && supabase) {
      await supabase.auth.signOut()
      // Limpia la caché local de ese usuario tras cerrar sesión en el servidor,
      // para que el siguiente login no vea datos de la cuenta anterior.
      if (current) clearLocal(current)
    } else {
      setUser(null)
    }
  }

  return { user, loading, localMode: !supabaseEnabled, signIn, signOut }
}

function translateError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Email o contraseña incorrectos'
  if (/email not confirmed/i.test(msg)) return 'Confirma tu email antes de entrar'
  if (/network/i.test(msg)) return 'Sin conexión. Inténtalo de nuevo'
  return msg
}
