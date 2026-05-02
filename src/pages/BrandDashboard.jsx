import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBrandDashboardData } from '../services/dashboardService'
import { useAuth } from '../context/AuthContext'

const STATUS_LABELS = ['CONTACTED', 'REPLIED', 'SHIPPED', 'POSTED']
const AVATAR_VARIANTS = ['a', 'b', 'c', 'd']

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function capitalize(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function BrandDashboard() {
  const { profile } = useAuth()

  const [dashboardData, setDashboardData] = useState({
    influencers: [],
    campaigns: [],
    outreach: [],
    activeOutreach: [],
    statusCounts: {
      CONTACTED: 0,
      REPLIED: 0,
      SHIPPED: 0,
      POSTED: 0,
    },
    totals: {
      totalInfluencers: 0,
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalOutreach: 0,
    },
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    try {
      setLoading(true)
      setError('')
      const data = await getBrandDashboardData()
      setDashboardData(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const recentOutreach = dashboardData.activeOutreach.slice(0, 5)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const snapshotByStatus = STATUS_LABELS.reduce((acc, s) => {
    acc[s] = dashboardData.activeOutreach.filter(r => r.status === s)
    return acc
  }, {})

  if (loading) {
    return (
      <div>
        <div className="page-header dashboard-header">
          <div>
            <div className="skeleton" style={{ width: 240, height: 32, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 360, height: 13 }} />
          </div>
          <div className="dashboard-actions">
            <div className="skeleton" style={{ width: 110, height: 36, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: 130, height: 36, borderRadius: 10 }} />
          </div>
        </div>
        <div className="skeleton" style={{ width: 72, height: 10, marginBottom: 11 }} />
        <section className="stats-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: 110, height: 11, marginBottom: 10 }} />
              <div className="skeleton" style={{ width: 52, height: 30, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: 150, height: 11 }} />
            </div>
          ))}
        </section>
        <div className="skeleton" style={{ width: 140, height: 10, marginBottom: 14 }} />
        <div className="snapshot-board">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="snapshot-column">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="skeleton" style={{ width: 70, height: 10 }} />
                <div className="skeleton" style={{ width: 24, height: 18, borderRadius: 20 }} />
              </div>
              <div className="skeleton" style={{ height: 54, borderRadius: 10, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 54, borderRadius: 10 }} />
            </div>
          ))}
        </div>
        <div className="dashboard-grid">
          <section className="card">
            <div className="section-header" style={{ marginBottom: 16 }}>
              <div className="skeleton" style={{ width: 180, height: 13 }} />
              <div className="skeleton" style={{ width: 80, height: 13 }} />
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="dash-act-row">
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                <div className="dash-act-info" style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '55%', height: 12, marginBottom: 5 }} />
                  <div className="skeleton" style={{ width: '40%', height: 11 }} />
                </div>
                <div className="skeleton" style={{ width: 64, height: 20, borderRadius: 20 }} />
              </div>
            ))}
          </section>
          <section className="card">
            <div className="section-header" style={{ marginBottom: 16 }}>
              <div className="skeleton" style={{ width: 150, height: 13 }} />
              <div className="skeleton" style={{ width: 55, height: 13 }} />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="dash-camp-row">
                <div className="dash-camp-top">
                  <div className="skeleton" style={{ width: '50%', height: 12 }} />
                  <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 20 }} />
                </div>
                <div className="skeleton" style={{ width: '35%', height: 11, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 6, borderRadius: 4, marginBottom: 6 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="skeleton" style={{ width: '28%', height: 11 }} />
                  <div className="skeleton" style={{ width: '38%', height: 11 }} />
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header dashboard-header">
        <div>
          <h1>{greeting}{profile?.name ? `, ${profile.name}` : ''}</h1>
          <p className="muted">
            {todayStr}&nbsp;·&nbsp;{dashboardData.totals.activeCampaigns} active campaign{dashboardData.totals.activeCampaigns === 1 ? '' : 's'}&nbsp;·&nbsp;{dashboardData.totals.totalInfluencers} influencer{dashboardData.totals.totalInfluencers === 1 ? '' : 's'} tracked
          </p>
        </div>
        <div className="dashboard-actions">
          <Link to="/pipeline" className="secondary-link-button">Open Pipeline</Link>
          <Link to="/influencers" className="primary-link-button">+ Add Influencer</Link>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {/* ── Stat Cards ── */}
      <p className="dash-section-label">Overview</p>
      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Influencers</span>
          <strong>{dashboardData.totals.totalInfluencers}</strong>
          <p>Profiles stored in the CRM</p>
        </div>
        <div className="stat-card">
          <span>Active Campaigns</span>
          <strong>{dashboardData.totals.activeCampaigns}</strong>
          <p>Campaigns currently running</p>
        </div>
        <div className="stat-card">
          <span>Total Outreach</span>
          <strong>{dashboardData.totals.totalOutreach}</strong>
          <p>Across all campaigns</p>
        </div>
        <div className="stat-card">
          <span>Posted</span>
          <strong>{dashboardData.statusCounts.POSTED}</strong>
          <p>Influencers who have posted</p>
        </div>
      </section>

      {/* ── Pipeline Snapshot ── */}
      <p className="dash-section-label">Pipeline Snapshot</p>
      <div className="snapshot-board">
        {STATUS_LABELS.map((status) => {
          const records = snapshotByStatus[status]
          const visible = records.slice(0, 2)
          const extra = records.length - visible.length
          return (
            <div key={status} className="snapshot-column">
              <div className="snapshot-column-header">
                <h3>{capitalize(status)}</h3>
                <span>{records.length}</span>
              </div>
              <div className="snapshot-cards">
                {visible.length === 0 ? (
                  <span className="snapshot-empty">Empty</span>
                ) : (
                  <>
                    {visible.map((r) => (
                      <div key={r.id} className="snapshot-card">
                        <span className="snapshot-card-name">{r.influencers?.name || 'Unknown'}</span>
                        {r.influencers?.handle && (
                          <span className="snapshot-card-handle">
                            {r.influencers.handle.startsWith('@') ? r.influencers.handle : `@${r.influencers.handle}`}
                          </span>
                        )}
                        {r.influencers?.platform && (
                          <span className={`platform-badge ${r.influencers.platform.toLowerCase()}`}>
                            {r.influencers.platform}
                          </span>
                        )}
                      </div>
                    ))}
                    {extra > 0 && (
                      <Link to="/pipeline" className="snapshot-more">+ {extra} more</Link>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Bottom Grid ── */}
      <div className="dashboard-grid">
        {/* Recent outreach activity */}
        <section className="card">
          <div className="section-header">
            <h2>Recent outreach activity</h2>
            <Link to="/pipeline" className="table-link">View pipeline</Link>
          </div>
          {recentOutreach.length === 0 ? (
            <p className="muted">No outreach records have been created yet.</p>
          ) : (
            <div className="dash-act-list">
              {recentOutreach.map((record, i) => (
                <div key={record.id} className="dash-act-row">
                  <div className={`dash-avatar dash-avatar--${AVATAR_VARIANTS[i % 4]}`}>
                    {getInitials(record.influencers?.name)}
                  </div>
                  <div className="dash-act-info">
                    <span className="dash-act-name">{record.influencers?.name || 'Unknown Influencer'}</span>
                    <span className="dash-act-sub">{record.campaigns?.name || 'No campaign'}</span>
                  </div>
                  <span className={`status-pill status-pill--${record.status.toLowerCase()}`}>
                    {capitalize(record.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Campaign overview */}
        <section className="card">
          <div className="section-header">
            <h2>Campaign overview</h2>
            <Link to="/campaigns" className="table-link">View all</Link>
          </div>
          {dashboardData.campaigns.length === 0 ? (
            <p className="muted">No campaigns have been created yet.</p>
          ) : (
            <div className="dash-camp-list">
              {dashboardData.campaigns.filter(c => c.status !== 'ARCHIVED').slice(0, 3).map((campaign) => {
                const total  = dashboardData.outreach.filter(r => r.campaign_id === campaign.id).length
                const posted = dashboardData.outreach.filter(r => r.campaign_id === campaign.id && r.status === 'POSTED').length
                const pct    = total === 0 ? 0 : Math.round((posted / total) * 100)
                const startDate = formatDate(campaign.start_date)
                const endDate   = formatDate(campaign.end_date)
                return (
                  <div key={campaign.id} className="dash-camp-row">
                    <div className="dash-camp-top">
                      <span className="dash-camp-name">{campaign.name}</span>
                      <span className={`status-pill status-pill--${campaign.status.toLowerCase()}`}>
                        {capitalize(campaign.status)}
                      </span>
                    </div>
                    {(startDate || endDate) && (
                      <div className="dash-camp-dates">{startDate ?? '—'} → {endDate ?? '—'}</div>
                    )}
                    <div className="dash-progress-track">
                      <div className="dash-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="dash-camp-meta">
                      <span>{total === 0 ? 'Not started' : `${pct}% complete`}</span>
                      <span>{posted} of {total} influencer{total === 1 ? '' : 's'} posted</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default BrandDashboard
