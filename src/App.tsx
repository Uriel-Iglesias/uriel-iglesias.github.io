import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { AppContext, useApp } from './context'
import Dashboard from './pages/Dashboard'
import Stats from './pages/Stats'
import Login from './pages/Login'
import Export from './pages/Export'

export default function App() {
  const auth = useAuth()
  const tx = useTransactions(auth.user?.id ?? null)

  if (auth.loading) {
    return (
      <div className="flex h-full items-center justify-center bg-bg text-ink2">
        <span className="text-3xl">💰</span>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ auth, tx }}>
      <Routes>
        <Route path="/login" element={auth.user ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/stats"
          element={
            <Protected>
              <Stats />
            </Protected>
          }
        />
        <Route
          path="/export"
          element={
            <Protected>
              <Export />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppContext.Provider>
  )
}

function Protected({ children }: { children: JSX.Element }) {
  const { auth } = useApp()
  if (!auth.user) return <Navigate to="/login" replace />
  return children
}
