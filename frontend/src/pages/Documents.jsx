import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Trash2, FileText, X, File } from 'lucide-react'
import ProtectedLayout from '../components/ProtectedLayout'

import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import { useAuth } from '../auth/AuthContext'
import api from '../api/axios'

export default function Documents() {
  const { isAdmin } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef()

  const fetchDocs = () => {
    api.get('/documents')
      .then(r => setDocs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDocs() }, [])

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setError('')
    const form = new FormData()
    form.append('file', selectedFile)
    try {
      await api.post('/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setModalOpen(false)
      setSelectedFile(null)
      fetchDocs()
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return
    await api.delete(`/documents/${id}`)
    setDocs(p => p.filter(d => d.document_id !== id))
  }

  const filtered = docs.filter(d =>
    d.original_file_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }

  return (
    <ProtectedLayout>

      <div className="page-content">
        <div className="page-header">
          <div>
            <h2 className="page-title">Knowledge Base</h2>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { setModalOpen(true); setSelectedFile(null); setError('') }}>
              <Upload size={15} /> Upload Document
            </button>
          )}
        </div>

        {/* Search filter */}
        <div style={{ marginBottom: 20 }}>
          <input
            className="input"
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>

        {/* Table */}
        <div className="glass-card">
          {loading ? <Loader /> : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Pages</th>
                    <th>Chunks</th>
                    <th>Upload Date</th>
                    <th>Uploaded By</th>
                    <th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: '40px', color: '#4a4a4a' }}>
                      No documents found. {isAdmin ? 'Upload your first document.' : ''}
                    </td></tr>
                  ) : filtered.map(doc => (
                    <motion.tr key={doc.document_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={14} color="#fff" />
                          <span style={{ color: '#fff', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.original_file_name}
                          </span>
                        </div>
                      </td>
                      <td><StatusBadge status={doc.file_type} /></td>
                      <td>{doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '—'}</td>
                      <td>{doc.total_pages ?? '—'}</td>
                      <td>{doc.total_chunks ?? '—'}</td>
                      <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                      <td>{doc.uploader_name || `User #${doc.uploaded_by}`}</td>
                      <td><StatusBadge status={doc.processing_status} /></td>
                      {isAdmin && (
                        <td>
                          <button
                            className="btn btn-danger btn-icon"
                            onClick={() => handleDelete(doc.document_id)}
                          >
                            <Trash2 size={18} color="#dc2626" strokeWidth={2.5} />
                          </button>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedFile(null); setError('') }}
          title="Upload Document"
          footer={
            <>
              <button className="btn" onClick={() => { setModalOpen(false); setSelectedFile(null) }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={!selectedFile || uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </>
          }
        >
          {error && (
            <div style={{ background: 'rgba(217,67,67,0.1)', border: '1px solid rgba(217,67,67,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#d94343' }}>
              {error}
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <File size={36} color="#4a4a4a" style={{ margin: '0 auto' }} />
            {selectedFile ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{selectedFile.name}</div>
                <div style={{ color: '#6b6b6b', fontSize: 12, marginTop: 4 }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
                <button
                  style={{ marginTop: 8, background: 'none', border: 'none', color: '#d94343', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, margin: '8px auto 0' }}
                  onClick={e => { e.stopPropagation(); setSelectedFile(null) }}
                >
                  <X size={12} /> Remove
                </button>
              </div>
            ) : (
              <>
                <p>Drag & drop or click to select a file</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>PDF and TXT files only</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.txt" hidden onChange={e => setSelectedFile(e.target.files[0])} />
        </Modal>
      </div>
    </ProtectedLayout>
  )
}
