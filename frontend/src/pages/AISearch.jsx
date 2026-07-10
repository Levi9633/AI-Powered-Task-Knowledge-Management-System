import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, FileText } from 'lucide-react'
import ProtectedLayout from '../components/ProtectedLayout'
import Navbar from '../components/Navbar'
import Loader from '../components/Loader'
import api from '../api/axios'

function HighlightText({ text, query }) {
  if (!query) return <span>{text}</span>
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 2, color: '#fff', padding: '0 2px' }}>{part}</mark>
          : part
      )}
    </span>
  )
}

export default function AISearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  /**
   * AI Search workflow (user_flow.txt + similarity_search.txt):
   * Open Search → Enter Question → Click Search → Relevant Results → Read Information
   */
  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const { data } = await api.post('/search', { query: query.trim(), top_k: 8 })
      setResults(data)
    } catch (err) {
      setResults({ results: [], total_results: 0, query })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedLayout>
      <Navbar title="AI Search" />
      <div className="page-content">
        {/* Hero search area */}
        <div className="search-hero">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
            <Sparkles size={20} color="#b5b5b5" />
            <span style={{ fontSize: 13, color: '#6b6b6b', fontWeight: 500 }}>Semantic Search powered by all-MiniLM-L6-v2</span>
          </div>
          <h1>Search the Knowledge Base</h1>
          <p style={{ fontSize: 14, color: '#6b6b6b', marginTop: 8, marginBottom: 24 }}>
            Ask a natural language question to find relevant document chunks
          </p>

          <form onSubmit={handleSearch}>
            <div className="search-bar-wrapper">
              <Search size={16} color="#6b6b6b" />
              <input
                className="search-bar-input"
                placeholder="e.g. What is the leave policy? How does the onboarding work?"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button type="submit" className="search-btn" disabled={loading || !query.trim()}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading && <Loader />}

        <AnimatePresence>
          {!loading && results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Result summary */}
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Search size={14} color="#6b6b6b" />
                <span style={{ fontSize: 13, color: '#6b6b6b' }}>
                  <strong style={{ color: '#b5b5b5' }}>{results.total_results}</strong> result{results.total_results !== 1 ? 's' : ''} for "
                  <strong style={{ color: '#fff' }}>{results.query}</strong>"
                </span>
              </div>

              {results.results.length === 0 ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                  <Search size={32} color="#4a4a4a" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: '#6b6b6b', fontSize: 15 }}>No matching results found.</p>
                  <p style={{ color: '#4a4a4a', fontSize: 13, marginTop: 6 }}>Try uploading more documents or using different keywords.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {results.results.map((r, i) => (
                    <motion.div
                      key={i}
                      className="glass-card"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{ padding: '20px 24px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 7,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <FileText size={15} color="#b5b5b5" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{r.file_name}</div>
                            <div style={{ fontSize: 11, color: '#6b6b6b', marginTop: 2 }}>Document #{r.document_id}</div>
                          </div>
                        </div>
                        {/* Similarity score */}
                        <div style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 20, padding: '4px 10px',
                          fontSize: 11, fontWeight: 600, color: '#b5b5b5',
                        }}>
                          {(r.similarity_score * 100).toFixed(1)}% match
                        </div>
                      </div>

                      {/* Matching content with highlight */}
                      <div style={{
                        fontSize: 13, color: '#9e9e9e', lineHeight: 1.7,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: 8, padding: '12px 14px',
                      }}>
                        <HighlightText text={r.chunk_text} query={query} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && !searched && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#4a4a4a' }}>
            <Search size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>Enter a question above to search the knowledge base</p>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
