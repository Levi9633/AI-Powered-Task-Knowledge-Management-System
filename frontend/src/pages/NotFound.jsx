import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, textAlign: 'center', padding: 20,
    }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 80, fontWeight: 800, color: 'rgba(255,255,255,0.08)', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 16 }}>Page Not Found</h1>
        <p style={{ fontSize: 14, color: '#6b6b6b', marginTop: 8, marginBottom: 24 }}>
          The page you're looking for doesn't exist.
        </p>
        <Link to="/dashboard">
          <button className="btn btn-primary" style={{ gap: 8 }}>
            <Home size={15} /> Back to Dashboard
          </button>
        </Link>
      </motion.div>
    </div>
  )
}
