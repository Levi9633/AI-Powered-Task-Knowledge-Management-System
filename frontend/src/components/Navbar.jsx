import { Bell } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

export default function Navbar({ title }) {
  const { user, isAdmin } = useAuth()

  return (
    <header style={{
      height: 60,
      background: 'rgba(5,5,5,0.85)',
      backdropFilter: 'blur(18px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
    }}>
      <div>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      </div>
    </header>
  )
}
