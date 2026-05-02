import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    deleteCampaign,
    getCampaignById,
    getCampaignOutreach,
} from '../services/campaignService'
import { getInfluencers } from '../services/influencerService'
import {
    createOutreachRecord,
    deleteOutreachRecord,
} from '../services/outreachService'

const STATUS_ORDER = ['CONTACTED', 'REPLIED', 'SHIPPED', 'POSTED']

function CampaignProfile() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [campaign, setCampaign] = useState(null)
    const [outreachRecords, setOutreachRecords] = useState([])
    const [influencers, setInfluencers] = useState([])
    const [selectedInfluencerId, setSelectedInfluencerId] = useState('')

    const [loading, setLoading] = useState(true)
    const [assigning, setAssigning] = useState(false)
    const [error, setError] = useState('')

    async function loadCampaignProfile() {
        try {
            setLoading(true)
            setError('')

            const [campaignData, outreachData, influencerData] = await Promise.all([
                getCampaignById(id),
                getCampaignOutreach(id),
                getInfluencers(),
            ])

            setCampaign(campaignData)
            setOutreachRecords(outreachData || [])
            setInfluencers(influencerData || [])
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not load campaign profile.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
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

    async function handleAssignInfluencer(e) {
        e.preventDefault()

        if (!selectedInfluencerId) {
            setError('Please select an influencer first.')
            return
        }

        const alreadyAssigned = outreachRecords.some(
            (record) => record.influencer_id === selectedInfluencerId
        )

        if (alreadyAssigned) {
            setError('This influencer is already assigned to this campaign.')
            return
        }

        try {
            setAssigning(true)
            setError('')

            await createOutreachRecord({
                influencer_id: selectedInfluencerId,
                campaign_id: id,
            })

            setSelectedInfluencerId('')

            const updatedOutreach = await getCampaignOutreach(id)
            setOutreachRecords(updatedOutreach || [])
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not assign influencer to campaign.')
        } finally {
            setAssigning(false)
        }
    }

    async function handleRemoveInfluencer(outreachId) {
        const confirmed = window.confirm(
            'Are you sure you want to remove this influencer from the campaign?'
        )

        if (!confirmed) return

        try {
            setError('')

            await deleteOutreachRecord(outreachId)

            setOutreachRecords((current) =>
                current.filter((record) => record.id !== outreachId)
            )
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not remove influencer from campaign.')
        }
    }

    async function handleDeleteCampaign() {
        const confirmed = window.confirm(
            'Are you sure you want to delete this campaign? This may also remove related outreach records depending on your database rules.'
        )

        if (!confirmed) return

        try {
            setError('')
            await deleteCampaign(id)
            navigate('/campaigns')
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not delete campaign.')
        }
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

                <div className="dashboard-actions">
                    <Link to={`/campaigns/${id}/edit`} className="primary-link-button">
                        Edit Campaign
                    </Link>

                    <button
                        type="button"
                        className="danger-button"
                        onClick={handleDeleteCampaign}
                    >
                        Remove Campaign
                    </button>
                </div>
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
                                <span className={`status-pill status-pill--${campaign.status.toLowerCase()}`}>{campaign.status}</span>
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

                <div className="profile-main-column">
                    <section className="card assign-card">
                        <h2>Assign Influencer</h2>
                        <p className="muted">
                            Add an influencer to this campaign and start their outreach record.
                        </p>

                        <form onSubmit={handleAssignInfluencer} className="assign-form">
                            <select
                                value={selectedInfluencerId}
                                onChange={(e) => setSelectedInfluencerId(e.target.value)}
                            >
                                <option value="">Select influencer</option>
                                {influencers.map((influencer) => (
                                    <option key={influencer.id} value={influencer.id}>
                                        {influencer.name} ({influencer.platform})
                                    </option>
                                ))}
                            </select>

                            <button type="submit" disabled={assigning}>
                                {assigning ? 'Assigning...' : 'Assign Influencer'}
                            </button>
                        </form>
                    </section>

                    <section className="card">
                        <h2>Assigned Influencers</h2>
                        <p className="muted">
                            Influencers assigned to this campaign, including outreach status and notes.
                        </p>

                        {outreachRecords.length === 0 ? (
                            <p className="muted">
                                No influencers have been assigned to this campaign yet.
                            </p>
                        ) : (
                            <div className="campaign-assignment-list">
                                {outreachRecords.map((record) => (
                                    <div key={record.id} className="campaign-assignment-card">
                                        <div className="campaign-assignment-header">
                                            <div>
                                                {record.influencers?.id ? (
                                                    <Link
                                                        to={`/influencers/${record.influencers.id}`}
                                                        className="campaign-assignment-title"
                                                    >
                                                        {record.influencers.name}
                                                    </Link>
                                                ) : (
                                                    <strong>Unknown Influencer</strong>
                                                )}

                                                <p className="muted">
                                                    {record.influencers?.platform || 'Platform'} ·{' '}
                                                    {record.influencers?.handle || 'No handle'}
                                                </p>

                                                <p className="muted">
                                                    Current outreach status:{' '}
                                                    <span className={`status-pill status-pill--${record.status.toLowerCase()}`}>{record.status}</span>
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className="danger-button"
                                                onClick={() => handleRemoveInfluencer(record.id)}
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        {record.notes?.length > 0 ? (
                                            <div className="campaign-notes-block">
                                                <strong>Recent Notes</strong>

                                                <ul>
                                                    {record.notes.slice(0, 3).map((note) => (
                                                        <li key={note.id}>
                                                            <p>{note.content}</p>
                                                            <span>
                                                                {note.created_at
                                                                    ? new Date(note.created_at).toLocaleString()
                                                                    : 'No date'}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <p className="muted no-notes-text">
                                                No notes have been added for this influencer yet.
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}

export default CampaignProfile