import { motion } from 'framer-motion'

export default function StatCard({ label, value, sub, color }) {
  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '20px 22px', cursor: 'default' }}
    >
      <div style={{ fontSize: 13, fontWeight: 'bold', color: color || '#b5b5b5', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: color || '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 4 }}>{sub}</div>}
    </motion.div>
  )
}
