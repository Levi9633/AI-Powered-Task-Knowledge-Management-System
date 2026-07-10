import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Sidebar from './Sidebar'
import Loader from './Loader'

export default function ProtectedLayout({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return <div className="loader-container" style={{ minHeight: '100vh' }}><div className="loader" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
