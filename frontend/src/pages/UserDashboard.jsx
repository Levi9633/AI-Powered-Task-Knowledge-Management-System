import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Search, Send, Clock, PlayCircle, Loader2, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import ProtectedLayout from '../components/ProtectedLayout'
import Navbar from '../components/Navbar'
import { useAuth } from '../auth/AuthContext'
import api from '../api/axios'
import '../index.css'

export default function UserDashboard() {
  const { user } = useAuth()
  
  // Tasks State
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [expandedTask, setExpandedTask] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submittingTask, setSubmittingTask] = useState(null)

  // AI Chat State
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', content: `Hello ${(user?.full_name || 'User').split(' ')[0]}! I'm your AI corporate assistant. Ask me anything about company knowledge or documents.` }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, isTyping])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get('/tasks')
      setTasks(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingTasks(false)
    }
  }, [])

  const handleTaskSubmit = useCallback(async (taskId) => {
    if (!answers[taskId]?.trim()) return
    setSubmittingTask(taskId)
    try {
      await api.patch(`/tasks/${taskId}`, {
        status: 'Completed',
        answer: answers[taskId]
      })
      
      // Update local state to reflect completion
      setTasks(prevTasks => prevTasks.map(t => 
        t.task_id === taskId ? { ...t, status: 'Completed', answer: answers[taskId] } : t
      ))
      setExpandedTask(null)
    } catch (error) {
      console.error(error)
      alert('Failed to submit task')
    } finally {
      setSubmittingTask(null)
    }
  }, [answers])

  const handleChatSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || isTyping) return

    const query = chatInput.trim()
    setChatInput('')
    setChatHistory(prev => [...prev, { role: 'user', content: query }])
    setIsTyping(true)

    try {
      const res = await api.post('/search', { query, top_k: 8 })
      const aiResponse = res.data.llm_response || "I couldn't generate an answer."
      setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }])
    } catch (error) {
      console.error(error)
      setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error while searching." }])
    } finally {
      setIsTyping(false)
    }
  }, [chatInput, isTyping])

  const pendingCount = useMemo(() => tasks.filter(t => t.status === 'Pending').length, [tasks])
  const completedCount = useMemo(() => tasks.filter(t => t.status === 'Completed').length, [tasks])

  return (
    <ProtectedLayout>
      <div className="user-workspace">
        
        {/* LEFT PANEL: TASKS */}
        <div className="workspace-panel tasks-panel">
          <div className="panel-header">
            <h2 style={{ fontSize: 26, margin: '0 0 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              Assigned Tasks
            </h2>
            <div className="task-stats-row">
              <div className="stat-pill total">
                <span className="stat-num">{tasks.length}</span> Total
              </div>
              <div className="stat-pill pending">
                <span className="stat-num">{pendingCount}</span> Pending
              </div>
              <div className="stat-pill completed">
                <span className="stat-num">{completedCount}</span> Completed
              </div>
            </div>
          </div>

          <div className="task-list">
            {loadingTasks ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}><Loader2 className="spinner" size={24} /></div>
            ) : tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>No tasks assigned yet.</div>
            ) : (
              tasks.map(task => {
                const isExpanded = expandedTask === task.task_id
                const isCompleted = task.status === 'Completed'

                return (
                  <div key={task.task_id} className={`task-card ${isExpanded ? 'expanded' : ''} ${isCompleted ? 'completed' : ''}`}>
                    <div 
                      className="task-card-header" 
                      onClick={() => setExpandedTask(isExpanded ? null : task.task_id)}
                    >
                      <div className="task-info">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          {isCompleted ? (
                            <span className="badge badge-success"><CheckSquare size={12} /> Completed</span>
                          ) : (
                            <span className="badge badge-warning"><Clock size={12} /> Pending</span>
                          )}
                          <span className="badge">Due: {task.due_date || 'No Date'}</span>
                        </div>
                      </div>
                      <div className="task-action">
                        {isCompleted ? <CheckSquare color="#5de187ff" size={20} /> : <PlayCircle color="#b5b5b5" size={20} />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="task-card-body"
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="task-desc">
                            <strong>Question / Instructions:</strong>
                            <p>{task.description}</p>
                          </div>
                          
                          <div className="task-answer-section">
                            {isCompleted ? (
                              <div className="completed-answer">
                                <strong>Your Answer:</strong>
                                <p>{task.answer || 'Completed without answer.'}</p>
                              </div>
                            ) : (
                              <>
                                <textarea 
                                  className="input" 
                                  placeholder="Type your answer here..."
                                  value={answers[task.task_id] || ''}
                                  onChange={(e) => setAnswers({...answers, [task.task_id]: e.target.value})}
                                  rows={4}
                                  style={{ resize: 'vertical', minHeight: 100, marginBottom: 16, background: 'rgba(255,255,255,0.05)', border: '2px solid #fff', color: '#fff', fontWeight: 'bold' }}
                                />
                                <button 
                                  className="btn"
                                  onClick={() => handleTaskSubmit(task.task_id)}
                                  disabled={!answers[task.task_id]?.trim() || submittingTask === task.task_id}
                                  style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '14px', borderRadius: 12, background: 'transparent', border: '2px solid #fff', color: '#fff', fontSize: 15, fontWeight: 'bold' }}
                                >
                                  {submittingTask === task.task_id ? <Loader2 className="spinner" size={18} /> : 'Submit Answer'}
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: AI CHAT */}
        <div className="workspace-panel chat-panel">
          <div className="panel-header" style={{ paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: 26, margin: 0, color: '#fff' }}>
              AI Assistant
            </h2>
          </div>

          <div className="chat-messages">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`chat-bubble-wrapper ${msg.role}`}>
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.role === 'ai' ? (
                    <div className="markdown-body"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble-wrapper ai">
                <div className="chat-bubble ai typing">
                  <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-area">
            <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ask a question about the documents..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={isTyping}
                style={{ flex: 1, borderRadius: 24, padding: '12px 20px', background: 'rgba(255,255,255,0.05)', border: '2px solid #fff', color: '#fff', fontWeight: 'bold' }}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isTyping || !chatInput.trim()}
                style={{ borderRadius: '50%', width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #fff', color: '#fff', background: 'transparent' }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </ProtectedLayout>
  )
}
