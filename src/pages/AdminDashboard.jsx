import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminDashboardData,
  updateUserActiveStatus,
} from '../services/adminService'
import { useAuth } from '../context/AuthContext'

function AdminDashboard() {
  const { profile } = useAuth()

  const [adminData, setAdminData] = useState({
    users: [],
    totals: {
      totalUsers: 0,
      brandManagers: 0,
      admins: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      totalInfluencers: 0,
      totalCampaigns: 0,
      totalOutreach: 0,
    },
  })

  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState('')
  const [error, setError] = useState('')

  async function loadAdminDashboard() {
    try {
      setLoading(true)
      setError('')

      const data = await getAdminDashboardData()
      setAdminData(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not load admin dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminDashboard()
  }, [])

  async function handleToggleActive(user) {
    try {
      setUpdatingUserId(user.id)
      setError('')

      await updateUserActiveStatus(user.id, !user.is_active)
      await loadAdminDashboard()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not update user status.')
    } finally {
      setUpdatingUserId('')
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return '—'

    return new Date(dateValue).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return <p>Loading admin dashboard...</p>
  }

  return (
    <div>
      <div className="page-header dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="muted">
            Welcome{profile?.name ? `, ${profile.name}` : ''}. Manage system
            users and review platform-wide CRM activity.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/login" className="primary-link-button">
            Register New User
          </Link>

          <button
            type="button"
            className="secondary-action-button"
            onClick={loadAdminDashboard}
          >
            Refresh Data
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="stats-grid admin-stats-grid">
        <div className="stat-card">
          <span>Total Users</span>
          <strong>{adminData.totals.totalUsers}</strong>
          <p>All user profiles currently stored in the system</p>
        </div>

        <div className="stat-card">
          <span>Brand Managers</span>
          <strong>{adminData.totals.brandManagers}</strong>
          <p>Users with access to CRM campaign workflows</p>
        </div>

        <div className="stat-card">
          <span>Admins</span>
          <strong>{adminData.totals.admins}</strong>
          <p>Users with system management privileges</p>
        </div>

        <div className="stat-card">
          <span>Active Users</span>
          <strong>{adminData.totals.activeUsers}</strong>
          <p>Accounts currently allowed to access the CRM</p>
        </div>
      </section>

      <section className="stats-grid admin-stats-grid">
        <div className="stat-card small-stat">
          <span>Inactive Users</span>
          <strong>{adminData.totals.inactiveUsers}</strong>
        </div>

        <div className="stat-card small-stat">
          <span>Influencers</span>
          <strong>{adminData.totals.totalInfluencers}</strong>
        </div>

        <div className="stat-card small-stat">
          <span>Campaigns</span>
          <strong>{adminData.totals.totalCampaigns}</strong>
        </div>

        <div className="stat-card small-stat">
          <span>Outreach Records</span>
          <strong>{adminData.totals.totalOutreach}</strong>
        </div>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>User Management</h2>
            <p className="muted">
              Review registered users, roles, and account status.
            </p>
          </div>

          <span className="status-pill">
            {adminData.users.length} users
          </span>
        </div>

        {adminData.users.length === 0 ? (
          <p className="muted">No users have been registered yet.</p>
        ) : (
          <div className="list-rows">
            {adminData.users.map((user) => (
              <div key={user.id} className="list-card">
                <div className="list-card-info">
                  <span className="list-card-title">{user.name || '—'}</span>
                  <div className="list-card-meta">
                    <span>{user.email}</span>
                    <span className="role-badge">
                      {user.role === 'ADMIN' ? 'Admin' : 'Brand Manager'}
                    </span>
                    <span className={user.is_active ? 'active-status-badge' : 'inactive-status-badge'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </div>
                <div className="list-card-actions">
                  <button type="button" className="secondary-button">
                    Reset Password
                  </button>
                  <button
                    type="button"
                    className={user.is_active ? 'danger-button' : 'secondary-button'}
                    onClick={() => handleToggleActive(user)}
                    disabled={updatingUserId === user.id}
                  >
                    {updatingUserId === user.id
                      ? 'Updating...'
                      : user.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card admin-note-card">
        <h2>System Settings</h2>
        <p className="muted">
          Pipeline stages are currently configured as Contacted, Replied,
          Shipped, and Posted. These stages support the outreach workflow used
          by Brand Managers.
        </p>

        <div className="pipeline-stage-preview">
          <span className="status-pill status-pill--contacted">CONTACTED</span>
          <span className="status-pill status-pill--replied">REPLIED</span>
          <span className="status-pill status-pill--shipped">SHIPPED</span>
          <span className="status-pill status-pill--posted">POSTED</span>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard