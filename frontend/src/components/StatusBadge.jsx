export default function StatusBadge({ status }) {
  const map = {
    Completed: 'badge-completed',
    Pending: 'badge-pending',
    Failed: 'badge-failed',
    Processing: 'badge-processing',
    Low: 'badge-low',
    Medium: 'badge-medium',
    High: 'badge-high',
    Admin: 'badge-admin',
    User: 'badge-user',
  }
  return <span className={`badge ${map[status] || 'badge-pending'}`}>{status}</span>
}
