import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, FileText, CheckSquare, Clock, Search, TrendingUp, LogIn, Edit3, PlusCircle, Activity, LogOut } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import ProtectedLayout from '../components/ProtectedLayout'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import { useAuth } from '../auth/AuthContext'
import api from '../api/axios'
import UserDashboard from './UserDashboard'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1a1a1a', border: '1px solid #333', padding: '10px 14px', borderRadius: 8 }}>
        <p style={{ margin: 0, color: '#888', fontSize: 12, marginBottom: 4 }}>{label}</p>
        <p style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

const getActivityStyling = (type) => {
  switch (type) {
    case 'LOGIN': return { icon: LogIn, color: '#5de187ff', bg: 'rgba(93, 225, 135, 0.15)', border: '1px solid rgba(93, 225, 135, 0.3)' }
    case 'LOGOUT': return { icon: LogOut, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }
    case 'SEARCH': return { icon: Search, color: '#fff', bg: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255,255,255,0.3)' }
    case 'TASK_CREATED': return { icon: PlusCircle, color: '#fff', bg: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255,255,255,0.3)' }
    case 'TASK_UPDATE': return { icon: Edit3, color: '#fff', bg: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255,255,255,0.3)' }
    case 'DOCUMENT_UPLOAD': return { icon: FileText, color: '#5de187ff', bg: 'rgba(93, 225, 135, 0.15)', border: '1px solid rgba(93, 225, 135, 0.3)' }
    default: return { icon: Activity, color: '#fff', bg: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255,255,255,0.3)' }
  }
}

export default function Dashboard() {
  const { isAdmin } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiView, setApiView] = useState('Admin')

  useEffect(() => {
    if (isAdmin) {
      api.get('/analytics')
        .then(r => setAnalytics(r.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  if (!isAdmin) {
    return <UserDashboard />
  }

  const taskChartData = useMemo(() => analytics ? [
    { name: 'Completed', value: analytics.completed_tasks, fill: '#5de187ff' },
    { name: 'Pending', value: analytics.pending_tasks, fill: '#a1a1aa' },
  ] : [], [analytics])

  const apiHitsData = useMemo(() => analytics?.api_hits?.slice(0, 10).map(hit => ({
    name: hit.endpoint.length > 15 ? hit.endpoint.slice(0, 15) + '…' : hit.endpoint,
    fullEndpoint: hit.endpoint,
    Admin: hit.admin_hits,
    User: hit.user_hits,
    Anonymous: hit.anonymous_hits
  })) || [], [analytics])

  return (
    <ProtectedLayout>
      <div className="page-content">
        {loading ? <Loader /> : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* User Task Distribution (User Engagement) */}
            {analytics?.user_task_metrics && analytics.user_task_metrics.length > 0 && (
              <div className="glass-card" style={{ marginBottom: 24, padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>User Engagement</div>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart 
                    data={analytics.user_task_metrics.map(u => ({
                      name: u.user_name,
                      Total: u.total,
                      Pending: u.pending,
                      Completed: u.completed
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="name" tick={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis allowDecimals={false} tick={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={false} content={<CustomTooltip />} />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 20, fontSize: 12, fontWeight: 'bold' }} iconType="circle" />
                    <Bar dataKey="Total" fill="#ffffff" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="Pending" fill="#a1a1aa" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="Completed" fill="#5de187ff" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
              <StatCard icon={Users} label="Total Users" value={analytics?.total_users ?? 0} />
              <StatCard icon={FileText} label="Total Documents" value={analytics?.total_documents ?? 0} />
              <StatCard icon={CheckSquare} label="Total Tasks" value={analytics?.total_tasks ?? 0} />
              <StatCard icon={TrendingUp} label="Completed Tasks" value={analytics?.completed_tasks ?? 0} color="#5de187ff" />
              <StatCard icon={Clock} label="Pending" value={analytics?.pending_tasks ?? 0} />
              <StatCard icon={Search} label="Total Searches" value={analytics?.total_searches ?? 0} />
            </div>

            {/* Charts */}
            <div className="charts-grid">
              {/* Task Chart */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Task Overview</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#5de187ff', marginBottom: 20 }}>
                  Completion rate: {analytics?.task_completion_rate ?? 0}%
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie 
                      data={taskChartData} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="40%" 
                      cy="50%" 
                      innerRadius={45} 
                      outerRadius={75} 
                      stroke="none" 
                      label={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }}
                    >
                      {taskChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip cursor={false} content={<CustomTooltip />} />
                    <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: 12, fontWeight: 'bold' }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* API Hits Chart */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>API Hits</div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 'bold' }}>
                      Usage across all endpoints
                    </div>
                  </div>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 4 }}>
                    <button 
                      onClick={() => setApiView('Admin')}
                      style={{ padding: '6px 16px', borderRadius: 16, border: 'none', background: apiView === 'Admin' ? '#5de187ff' : 'transparent', color: apiView === 'Admin' ? '#000' : '#888', fontWeight: 'bold', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      Admin
                    </button>
                    <button 
                      onClick={() => setApiView('User')}
                      style={{ padding: '6px 16px', borderRadius: 16, border: 'none', background: apiView === 'User' ? '#fff' : 'transparent', color: apiView === 'User' ? '#000' : '#888', fontWeight: 'bold', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      User
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={apiHitsData} barSize={24} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#fff', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: '#6b6b6b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                      contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} 
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 12, fontWeight: 'bold' }} iconType="circle" />
                    <Bar dataKey={apiView} fill={apiView === 'Admin' ? '#5de187ff' : '#fff'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>


            {/* Recent Activity */}
            <div className="glass-card" style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Recent Activity</div>
                <div style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>Live Feed</div>
              </div>
              
              {analytics?.recent_activities?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {analytics.recent_activities.slice(0, 8).map((act, i) => {
                    const style = getActivityStyling(act.activity_type)
                    const Icon = style.icon
                    return (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: style.bg, border: style.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={20} color={style.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, marginBottom: 4 }}>{act.activity_description}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            <strong style={{ color: '#aaa' }}>{act.user_name}</strong> • {new Date(act.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 'bold', letterSpacing: '0.5px', color: style.color, background: style.bg, border: style.border }}>
                          {act.activity_type.replace('_', ' ')}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontSize: 14 }}>No recent activity found.</div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </ProtectedLayout>
  )
}
