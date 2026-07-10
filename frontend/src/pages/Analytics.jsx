import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell
} from 'recharts'
import { CheckSquare, Clock, FileText, Search, TrendingUp, Activity } from 'lucide-react'
import ProtectedLayout from '../components/ProtectedLayout'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import api from '../api/axios'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff' }}>
        <p>{label}: <strong>{payload[0]?.value}</strong></p>
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const taskChart = data ? [
    { name: 'Total', value: data.total_tasks },
    { name: 'Completed', value: data.completed_tasks },
    { name: 'Pending', value: data.pending_tasks },
  ] : []

  const queryChart = data?.most_searched_queries?.slice(0, 8).map(q => ({
    name: q.search_query.length > 16 ? q.search_query.slice(0, 16) + '…' : q.search_query,
    count: q.count,
  })) || []

  const activityByType = data?.recent_activities?.reduce((acc, a) => {
    const existing = acc.find(x => x.type === a.activity_type)
    if (existing) existing.count++
    else acc.push({ type: a.activity_type, count: 1 })
    return acc
  }, []) || []

  return (
    <ProtectedLayout adminOnly>
      <Navbar title="Analytics" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h2 className="page-title">Analytics Dashboard</h2>
            <p className="page-subtitle">System-wide metrics generated from database records</p>
          </div>
        </div>

        {loading ? <Loader /> : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* KPI Cards */}
            <div className="stats-grid">
              <StatCard icon={CheckSquare} label="Total Tasks" value={data?.total_tasks ?? 0} />
              <StatCard icon={TrendingUp} label="Completed" value={data?.completed_tasks ?? 0} sub={`${data?.task_completion_rate ?? 0}% completion rate`} />
              <StatCard icon={Clock} label="Pending" value={data?.pending_tasks ?? 0} />
              <StatCard icon={FileText} label="Documents" value={data?.total_documents ?? 0} />
              <StatCard icon={Search} label="Total Searches" value={data?.total_searches ?? 0} />
              <StatCard icon={Activity} label="Success Rate" value={`${data?.task_completion_rate ?? 0}%`} />
            </div>

            {/* Charts Row 1 */}
            <div className="charts-grid">
              {/* Task Completion Chart */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Task Completion</div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 20 }}>Total vs Completed vs Pending</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={taskChart} barSize={40}>
                    <XAxis dataKey="name" tick={{ fill: '#6b6b6b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b6b6b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {taskChart.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? 'rgba(255,255,255,0.4)' : i === 1 ? 'rgba(255,255,255,0.85)' : 'rgba(150,150,150,0.4)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Activity by Type */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Activity Breakdown</div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 20 }}>By activity type (recent)</div>
                {activityByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={activityByType} layout="vertical" barSize={16}>
                      <XAxis type="number" tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="type" width={120} tick={{ fill: '#b5b5b5', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="rgba(255,255,255,0.25)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#4a4a4a', fontSize: 13 }}>No activity data yet</div>
                )}
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="charts-grid">
              {/* Most Searched Queries */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Most Searched Queries</div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 20 }}>Search logs grouped by query</div>
                {queryChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={queryChart} barSize={18}>
                      <XAxis dataKey="name" tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b6b6b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="rgba(255,255,255,0.3)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#4a4a4a', fontSize: 13 }}>No search data yet</div>
                )}
              </div>

              {/* Most Searched — Table */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Top Search Queries</div>
                {data?.most_searched_queries?.length > 0 ? (
                  <div>
                    {data.most_searched_queries.slice(0, 8).map((q, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#6b6b6b', fontWeight: 600 }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: 13, color: '#b5b5b5', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {q.search_query}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: '#6b6b6b', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10 }}>
                          {q.count}×
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#4a4a4a', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>No searches yet</div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
                <Activity size={14} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Recent Activity Timeline
              </div>
              {data?.recent_activities?.map((a, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-dot" style={{
                    background: a.activity_type === 'DOCUMENT_UPLOAD' ? 'rgba(255,255,255,0.6)'
                      : a.activity_type === 'TASK_CREATED' ? 'rgba(255,255,255,0.5)'
                      : a.activity_type === 'LOGIN' ? 'rgba(180,180,180,0.4)'
                      : 'rgba(130,130,130,0.4)'
                  }} />
                  <div className="activity-content">
                    <div className="activity-type">{a.activity_type.replace(/_/g, ' ')}</div>
                    <div className="activity-desc">{a.activity_description}</div>
                    <div className="activity-user">{a.user_name} · {new Date(a.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </ProtectedLayout>
  )
}
