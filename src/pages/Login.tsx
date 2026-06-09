import { useState } from 'react'
import { useApp } from '../context'

/** Pantalla de acceso: email + contraseña. El router redirige solo al entrar. */
export default function Login() {
  const { auth } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await auth.signIn(email.trim(), password)
    if (error) setError(error)
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-full flex-col justify-center bg-bg px-7 pt-safe pb-safe">
      <div className="mb-8 text-center">
        <span className="text-5xl">💰</span>
        <h1 className="mt-2 text-[28px] font-bold">Finanzas</h1>
        <p className="mt-1 text-ink2">Inicia sesión para continuar</p>
      </div>

      <form onSubmit={handle} className="w-full">
        <input
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 h-[52px] w-full rounded-14 border border-sep bg-card px-4 text-[16px] outline-none"
        />

        <input
          type="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 h-[52px] w-full rounded-14 border border-sep bg-card px-4 text-[16px] outline-none"
        />

        {error && <p className="mb-3 text-[14px] text-red">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !email || !password}
          className="h-[52px] w-full rounded-18 bg-blue font-semibold text-white disabled:opacity-40"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
