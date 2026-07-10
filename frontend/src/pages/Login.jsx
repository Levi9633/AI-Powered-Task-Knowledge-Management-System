import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, Lock, Mail } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import api from '../api/axios'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login({
        user_id: data.user_id,
        full_name: data.full_name,
        role_id: data.role_id,
        role_name: data.role_name,
      }, data.access_token)
      // Redirect based on role (user_flow.txt: Admin → Admin Dashboard, User → User Dashboard)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Advanced Tech Grid Background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
      }} />
      
      {/* Center ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '80vw', height: '80vw', maxWidth: 800, maxHeight: 800, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 800, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* Header Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48, width: '100%' }}>
          <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 48px)', whiteSpace: 'nowrap', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.15, textAlign: 'center' }}>
            AI-Powered Task & Knowledge Management
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-muted)', marginTop: 16, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800 }}>
            System Authentication
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card" style={{ width: '100%', maxWidth: 540, padding: '48px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '24px', background: 'rgba(0,0,0,0.4)' }}>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              style={{
                background: 'rgba(217,67,67,0.05)', border: '1px solid #d94343',
                borderRadius: 8, padding: '12px 16px', marginBottom: 24,
                fontSize: 13, color: '#d94343', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              <div style={{ width: 4, height: 14, background: '#d94343', borderRadius: 2 }} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email Input */}
            <div className="input-group">
              <label className="input-label" style={{ textTransform: 'uppercase', fontSize: 13, fontWeight: 800, letterSpacing: '1px', color: '#fff' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#ffffff' }} />
                <input
                  className="input"
                  type="email"
                  placeholder="rahul@gmail.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                  style={{ 
                    paddingLeft: 44, padding: '16px 16px 16px 44px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: 16, borderRadius: 12, color: '#fff'
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="input-group">
              <label className="input-label" style={{ textTransform: 'uppercase', fontSize: 13, fontWeight: 800, letterSpacing: '1px', color: '#fff' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#ffffff' }} />
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  style={{ 
                    paddingLeft: 44, paddingRight: 48, padding: '16px 48px 16px 44px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: 16, borderRadius: 12, color: '#fff', letterSpacing: showPass ? 'normal' : '2px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ 
                justifyContent: 'center', marginTop: 16, padding: '18px', 
                fontSize: 15, letterSpacing: '1.5px', textTransform: 'uppercase',
                background: '#ffffff', color: '#000000', border: 'none', borderRadius: 12,
                opacity: loading ? 0.7 : 1, fontWeight: 800,
                boxShadow: '0 4px 14px rgba(255,255,255,0.15)'
              }}
            >
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </div>

        {/* Demo credentials hint */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#ffffff', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.5px', lineHeight: 1.6 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>ADMIN:</span> admin@demo.com <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 8px' }}>|</span> <span style={{ color: 'rgba(255,255,255,0.7)' }}>PASS:</span> password123<br/>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>USER:</span> rahul@gmail.com <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 8px' }}>|</span> <span style={{ color: 'rgba(255,255,255,0.7)' }}>PASS:</span> password123
        </div>
      </motion.div>
    </div>
  )
}
