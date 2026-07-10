import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, CheckSquare, Search,
  BarChart2, User, LogOut, Zap, Menu, X
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const items = navItems.filter(item => !item.adminOnly || isAdmin)

  const SidebarContent = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '0',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #fff', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>AI-Powered Task & Knowledge</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginTop: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>Management System</div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 16px',
              borderRadius: 9,
              marginBottom: 4,
              fontSize: 16,
              fontWeight: isActive ? 600 : 400,
              color: '#fff',
              background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: isActive ? '1px solid #fff' : '1px solid transparent',
              boxShadow: isActive ? '0 0 12px rgba(255,255,255,0.04)' : 'none',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
            })}
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </nav>


    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: 'var(--sidebar-width)',
        background: '#131313',
        borderRight: '1px solid #fff',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }} className="desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="mobile-menu-btn"
        style={{
          display: 'none',
          position: 'fixed', top: 16, left: 16,
          zIndex: 200, background: 'rgba(255,255,255,0.08)',
          border: '1px solid #fff',
          borderRadius: 8, padding: 8, color: '#fff',
        }}
      >
        <Menu size={20} />
      </button>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 150 }}
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: 240, background: '#131313',
                borderRight: '1px solid #fff',
                zIndex: 200,
              }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}
