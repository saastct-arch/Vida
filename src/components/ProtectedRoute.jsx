import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

// Protege rotas autenticadas. Sem sessão → redireciona para /login.
export default function ProtectedRoute({ children }) {
  const { user, carregando } = useAuth()
  const location = useLocation()

  if (carregando) {
    return (
      <div className="center" style={{ minHeight: '100vh' }}>
        <div className="font-display" style={{ color: 'var(--blue)', letterSpacing: '0.2em' }}>NEXUS</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
