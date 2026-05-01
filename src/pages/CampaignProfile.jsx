import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    getCampaignById,
    getCampaignOutreach,
} from '../services/campaignService'

const STATUS_ORDER = ['CONTACTED', 'REPLIED', 'SHIPPED', 'POSTED']

function CampaignProfile() {
    const { id } = useParams()

    const [campaign, setCampaign] = useState(null)
    const [outreachRecords, setOutreachRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadCampaignProfile() {
            try {
                setLoading(true)
                setError('')

                const [campaignData, outreachData] = await Promise.all([
                    getCampaignById(id),
                    getCampaignOutreach(id),
                ])

                setCampaign(campaignData)
                setOutreachRecords(outreachData || [])
            } catch (err) {
                console.error(err)
                setError(err.message || 'Could not load campaign profile.')
            } finally {
                setLoading(false)
            }
        }

        loadCampaignProfile()
    }, [id])

    function formatDate(dateValue) {
        if (!dateValue) return '—'

        return new Date(dateValue).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const statusCounts = STATUS_ORDER.reduce((counts, status) => {
        counts[status] = outreachRecords.filter(
            (record) => record.status === status
        ).length

        return counts
    }, {})

    const totalAssigned = outreachRecords.length
    const postedCount = outreachRecords.filter(
        (record) => record.status === 'POSTED'
    ).length

    const progressPercent =
        totalAssigned === 0 ? 0 : Math.round((postedCount / totalAssigned) * 100)

    if (loading) return <p>Loading campaign profile...</p>
    if (error) return <p className="error">{error}</p>
    if (!campaign) return <p>Campaign not found.</p>

    return (
        <div>
            <div className="page-header dashboard-header">
                <div>
                    <Link to="/campaigns" className="back-link">
                        ← Back to Campaigns
                    </Link>

                    <h1>{campaign.name}</h1>
                    <p className="muted">
                        Campaign profile, assigned influencers, and outreach progress.
                    </p>
                </div>

                <Link to={`/campaigns/${id}/edit`} className="primary-link-button">
                    Edit Campaign
                </Link>
            </div>

            <section className="stats-grid status-grid">
                <div className="stat-card small-stat">
                    <span>Contacted</span>
                    <strong>{statusCounts.CONTACTED || 0}</strong>
                </div>

                <div className="stat-card small-stat">
                    <span>Replied</span>
                    <strong>{statusCounts.REPLIED || 0}</strong>
                </div>

                <div className="stat-card small-stat">
                    <span>Shipped</span>
                    <strong>{statusCounts.SHIPPED || 0}</strong>
                </div>

                <div className="stat-card small-stat">
                    <span>Posted</span>
                    <strong>{statusCounts.POSTED || 0}</strong>
                </div>
            </section>

            <section className="card campaign-progress-card">
                <div className="section-header">
                    <div>
                        <h2>Campaign Progress</h2>
                        <p className="muted">
                            {postedCount} of {totalAssigned} assigned influencers have completed the outreach cycle.
                        </p>
                    </div>

                    <span className="status-pill">{progressPercent}% Complete</span>
                </div>

                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>

                <div className="progress-summary">
                    <span>Contacted: {statusCounts.CONTACTED || 0}</span>
                    <span>Replied: {statusCounts.REPLIED || 0}</span>
                    <span>Shipped: {statusCounts.SHIPPED || 0}</span>
                    <span>Posted: {statusCounts.POSTED || 0}</span>
                </div>
            </section>

            <div className="profile-grid">
                <section className="card">
                    <h2>Campaign Details</h2>

                    <div className="detail-list">
                        <div>
                            <span>Name</span>
                            <strong>{campaign.name}</strong>
                        </div>

                        <div>
                            <span>Status</span>
                            <strong>
                                <span className="status-pill">{campaign.status}</span>
                            </strong>
                        </div>

                        <div>
                            <span>Start Date</span>
                            <strong>{formatDate(campaign.start_date)}</strong>
                        </div>

                        <div>
                            <span>End Date</span>
                            <strong>{formatDate(campaign.end_date)}</strong>
                        </div>

                        <div>
                            <span>Description</span>
                            <strong>{campaign.description || '—'}</strong>
                        </div>
                    </div>
                </section>

                <section className="card">
                    <h2>Assigned Influencers</h2>

                    {outreachRecords.length === 0 ? (
                        <p className="muted">
                            No influencers have been assigned to this campaign yet.
                        </p>
                    ) : (
                        <div className="history-list">
                            {outreachRecords.map((record) => (
                                <div key={record.id} className="history-item">
                                    <div className="campaign-profile-row">
                                        <div>
                                            <strong>
                                                {record.influencers?.name || 'Unknown Influencer'}
                                            </strong>
                                            <p className="muted">
                                                {record.influencers?.platform || 'Platform'} ·{' '}
                                                {record.influencers?.handle || 'No handle'}
                                            </p>
                                        </div>

                                        <span className="status-pill">{record.status}</span>
                                    </div>

                                    {record.notes?.length > 0 && (
                                        <div className="recent-notes">
                                            <strong>Recent Notes</strong>
                                            <ul>
                                                {record.notes.slice(0, 3).map((note) => (
                                                    <li key={note.id}>{note.content}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

export default CampaignProfile