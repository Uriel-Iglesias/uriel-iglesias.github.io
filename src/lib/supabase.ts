import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/** `true` cuando hay credenciales de Supabase configuradas en `.env`. */
export const supabaseEnabled: boolean = Boolean(url && anonKey)

/**
 * Cliente de Supabase, o `null` en modo local (sin credenciales).
 * Sesión persistente en localStorage y auto-refresh del token.
 */
export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'finanzas-auth',
      },
    })
  : null
