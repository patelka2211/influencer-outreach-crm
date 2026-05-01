import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBrandDashboardData } from '../services/dashboardService'
import { useAuth } from '../context/AuthContext'

function BrandDashboard() {
  const { profile } = useAuth()

  const [dashboardData, setDashboardData] = useState({
    influencers: [],
    campaigns: [],
    outreach: [],
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

  const recentOutreach = dashboardData.outreach.slice(0, 5)

  if (loading) {
    return <p>Loading dashboard...</p>
  }

  return (
    <div>
      <div className="page-header dashboard-header">
        <div>
          <h1>Brand Manager Dashboard</h1>
          <p className="muted">
            Welcome{profile?.name ? `, ${profile.name}` : ''}. Track influencer
            outreach, campaigns, and recent activity.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/influencers" className="primary-link-button">
            Add Influencer
          </Link>
          <Link to="/pipeline" className="secondary-link-button">
            Open Pipeline
          </Link>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Influencers</span>
          <strong>{dashboardData.totals.totalInfluencers}</strong>
          <p>Influencer profiles stored in the CRM</p>
        </div>

        <div className="stat-card">
          <span>Total Campaigns</span>
          <strong>{dashboardData.totals.totalCampaigns}</strong>
          <p>Campaigns created by brand managers</p>
        </div>

        <div className="stat-card">
          <span>Active Campaigns</span>
          <strong>{dashboardData.totals.activeCampaigns}</strong>
          <p>Campaigns currently marked active</p>
        </div>

        <div className="stat-card">
          <span>Total Outreach</span>
          <strong>{dashboardData.totals.totalOutreach}</strong>
          <p>Influencer-campaign outreach records</p>
        </div>
      </section>

      <section className="stats-grid status-grid">
        <div className="stat-card small-stat">
          <span>Contacted</span>
          <strong>{dashboardData.statusCounts.CONTACTED}</strong>
        </div>

        <div className="stat-card small-stat">
          <span>Replied</span>
          <strong>{dashboardData.statusCounts.REPLIED}</strong>
        </div>

        <div className="stat-card small-stat">
          <span>Shipped</span>
          <strong>{dashboardData.statusCounts.SHIPPED}</strong>
        </div>

        <div className="stat-card small-stat">
          <span>Posted</span>
          <strong>{dashboardData.statusCounts.POSTED}</strong>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <div className="section-header">
            <div>
              <h2>Recent Outreach Activity</h2>
              <p className="muted">
                Latest outreach records across influencer campaigns.
              </p>
            </div>
            <Link to="/pipeline" className="table-link">
              View Pipeline
            </Link>
          </div>

          {recentOutreach.length === 0 ? (
            <p className="muted">No outreach records have been created yet.</p>
          ) : (
            <div className="activity-list">
              {recentOutreach.map((record) => (
                <div key={record.id} className="activity-item">
                  <div>
                    <strong>
                      {record.influencers?.name || 'Unknown Influencer'}
                    </strong>
                    <p className="muted">
                      {record.campaigns?.name || 'No campaign assigned'}
                    </p>
                  </div>

                  <span className="status-pill">{record.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-header">
            <div>
              <h2>Campaign Overview</h2>
              <p className="muted">
                Quick view of the most recent campaigns.
              </p>
            </div>
            <Link to="/campaigns" className="table-link">
              View Campaigns
            </Link>
          </div>

          {dashboardData.campaigns.length === 0 ? (
            <p className="muted">No campaigns have been created yet.</p>
          ) : (
            <div className="compact-table">
              {dashboardData.campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="compact-row">
                  <div>
                    <strong>{campaign.name}</strong>
                    <p className="muted">
                      {campaign.start_date || 'No start date'} to{' '}
                      {campaign.end_date || 'No end date'}
                    </p>
                  </div>

                  <span className="status-pill">{campaign.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default BrandDashboard