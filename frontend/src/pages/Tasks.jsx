import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Filter } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import ProtectedLayout from '../components/ProtectedLayout'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import { useAuth } from '../auth/AuthContext'
import api from '../api/axios'

const CustomSelect = ({ value, onChange, options, minWidth }) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || options[0]?.label || '';

  return (
    <div style={{ position: 'relative', minWidth }}>
      <div 
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          background: '#131313', border: '2px solid #fff', borderRadius: 24,
          color: '#fff', fontWeight: 'bold', cursor: 'pointer', padding: '8px 16px',
          userSelect: 'none'
        }}
      >
        <span>{selectedLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
            background: '#131313', border: '2px solid #fff', borderRadius: 16,
            overflow: 'hidden', zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
          }}>
            {options.map(o => (
              <div 
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  padding: '10px 16px', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                  background: o.value === value ? 'rgba(255,255,255,0.1)' : 'transparent',
                  transition: 'background 0.2s', userSelect: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = o.value === value ? 'rgba(255,255,255,0.1)' : 'transparent'}
              >
                {o.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}


export default function Tasks() {
  const { isAdmin, user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'Medium', due_date: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchTasks = (status = statusFilter, assignedTo = assignedFilter) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (assignedTo) params.append('assigned_to', assignedTo)
    api.get(`/tasks?${params}`)
      .then(r => setTasks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      api.get('/tasks/users').then(r => setUsers(r.data)).catch(() => {})
    }
  }, [isAdmin])

  const handleFilterChange = (type, value) => {
    if (type === 'status') { setStatusFilter(value); fetchTasks(value, assignedFilter) }
    if (type === 'assigned') { setAssignedFilter(value); fetchTasks(statusFilter, value) }
  }

  const handleCreate = async () => {
    setError('')
    setSubmitting(true)
    try {
      await api.post('/tasks', {
        ...form,
        assigned_to: Number(form.assigned_to),
        due_date: form.due_date || null,
      })
      setModalOpen(false)
      setForm({ title: '', description: '', assigned_to: '', priority: 'Medium', due_date: '' })
      fetchTasks()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending'
    if (!confirm(`Mark task as ${newStatus}?`)) return
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus })
      setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, status: newStatus } : t))
    } catch (err) {
      alert(err.response?.data?.detail || 'Update failed')
    }
  }

  return (
    <ProtectedLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h2 className="page-title">Task Management</h2>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { setModalOpen(true); setError('') }}>
              <Plus size={15} /> Create Task
            </button>
          )}
        </div>

        {/* Filters — Dynamic Filtering (dynamic_filter_flow.txt) */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: 24, border: '2px solid #fff' }}>
            <Filter size={16} color="#fff" />
            <span style={{ fontSize: 14, color: '#fff', fontWeight: 'bold' }}>Filters</span>
          </div>
          <CustomSelect 
            value={statusFilter}
            onChange={val => handleFilterChange('status', val)}
            minWidth={150}
            options={[
              { value: '', label: 'All Status' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Completed', label: 'Completed' }
            ]}
          />
          {isAdmin && (
            <CustomSelect 
              value={assignedFilter}
              onChange={val => handleFilterChange('assigned', val)}
              minWidth={170}
              options={[
                { value: '', label: 'All Users' },
                ...users.map(u => ({ value: u.user_id, label: u.full_name }))
              ]}
            />
          )}
        </div>

        {/* Task table */}
        <div className="glass-card">
          {loading ? <Loader /> : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Assigned To</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Created</th>
                    <th>Completed Time</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#4a4a4a' }}>
                      {isAdmin ? 'No tasks yet. Create your first task.' : 'No tasks assigned to you yet.'}
                    </td></tr>
                  ) : tasks.map(task => (
                    <motion.tr key={task.task_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td>
                        <div style={{ fontWeight: 'bold', color: '#fff', maxWidth: 220 }}>{task.title}</div>
                      </td>
                      <td style={{ color: '#fff', fontWeight: 'bold' }}>{task.assignee_name || `User #${task.assigned_to}`}</td>
                      <td><StatusBadge status={task.priority} /></td>
                      <td><StatusBadge status={task.status} /></td>
                      <td style={{ color: '#fff', fontWeight: 'bold' }}>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</td>
                      <td style={{ color: '#fff', fontWeight: 'bold' }}>{new Date(task.created_at).toLocaleDateString()}</td>
                      <td style={{ color: '#fff', fontWeight: 'bold' }}>
                        {task.status === 'Completed' && task.updated_at 
                          ? new Date(task.updated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                          : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Task Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Create New Task"
          footer={
            <>
              <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={submitting || !form.title || !form.assigned_to}>
                {submitting ? 'Creating...' : 'Create Task'}
              </button>
            </>
          }
        >
          {error && (
            <div style={{ background: 'rgba(217,67,67,0.1)', border: '1px solid rgba(217,67,67,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#d94343' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">Title *</label>
              <input className="input" placeholder="Task title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Description *</label>
              <textarea
                className="input"
                placeholder="Task description..."
                rows={3}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Assign To *</label>
              <CustomSelect 
                value={form.assigned_to} 
                onChange={val => setForm(p => ({ ...p, assigned_to: val }))}
                options={[
                  { value: '', label: 'Select user...' },
                  ...users.map(u => ({ value: u.user_id, label: `${u.full_name} (${u.email})` }))
                ]}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Priority</label>
                <CustomSelect 
                  value={form.priority} 
                  onChange={val => setForm(p => ({ ...p, priority: val }))}
                  options={[
                    { value: 'Low', label: 'Low' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High', label: 'High' }
                  ]}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Due Date</label>
                <DatePicker 
                  selected={form.due_date ? new Date(form.due_date) : null}
                  onChange={date => setForm(p => ({ ...p, due_date: date ? date.toISOString().split('T')[0] : '' }))}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date..."
                  className="custom-date-picker-input"
                />
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </ProtectedLayout>
  )
}
