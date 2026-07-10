import { motion } from 'framer-motion'
import { User, Mail, Shield, Calendar, Activity, CheckCircle, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ProtectedLayout from '../components/ProtectedLayout'

import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../auth/AuthContext'

export default function Profile() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const fields = [
    { icon: User, label: 'Full Name', value: user?.full_name },
    { icon: Mail, label: 'Email Address', value: isAdmin ? 'admin@demo.com' : 'rahul@gmail.com' },
    { icon: Shield, label: 'Role', value: isAdmin ? 'Admin' : 'User' },
    { icon: Activity, label: 'Status', value: 'Active' },
  ]

  return (
    <ProtectedLayout>

      <div className="page-content">
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="page-header" style={{ marginBottom: 20 }}>
            <h2 className="page-title">My Profile</h2>
          </div>
          {/* Profile Card */}
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '32px' }}
          >
            {/* Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #fff' }}>
              <div className="avatar" style={{ width: 80, height: 80, fontSize: 32 }}>
                {user?.full_name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{user?.full_name}</div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 'bold', opacity: 0.7, letterSpacing: '0.5px' }}>ID: #{user?.user_id}</div>
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{isAdmin ? 'Admin' : 'User'}</div>
              </div>
            </div>

            {/* Profile Fields */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {fields.map(({ icon: Icon, label, value }, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 0',
                  borderBottom: i < fields.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} color="#fff" />
                    </div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {label}
                    </div>
                  </div>
                  <div style={{ fontSize: 15, color: '#fff', fontWeight: 'bold', textAlign: 'right' }}>
                    {label === 'Role' ? value :
                     label === 'Status' ? (
                       <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                         <CheckCircle size={15} color="#fff" />
                         <span>{value}</span>
                       </span>
                     ) : value}
                  </div>
                </div>
              ))}
            </div>

            {/* Logout Button */}
            <div style={{ marginTop: 32 }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: 'transparent', border: '2px solid #fff',
                  color: '#fff', fontSize: 15, fontWeight: 'bold', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
