import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    deleteCampaign,
    getCampaignById,
    getCampaignOutreach,
    updateCampaignStatus,
} from '../services/campaignService'
import { getInfluencers } from '../services/influencerService'
import {
    createOutreachRecord,
    deleteOutreachRecord,
} from '../services/outreachService'
import { STATUS_ORDER } from '../constants/outreach'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import { useConfirm } from '../hooks/useConfirm'
import { useToast } from '../hooks/useToast'

function CampaignProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
    const { toast, showToast } = useToast()

    const [campaign, setCampaign] = useState(null)
    const [outreachRecords, setOutreachRecords] = useState([])
    const [influencers, setInfluencers] = useState([])
    const [selectedInfluencerId, setSelectedInfluencerId] = useState('')

    const [loading, setLoading] = useState(true)
    const [assigning, setAssigning] = useState(false)
    const [statusUpdating, setStatusUpdating] = useState(false)
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

    async function handleStatusTransition(newStatus) {
        try {
            setStatusUpdating(true)
            setError('')
            const updated = await updateCampaignStatus(id, newStatus)
            setCampaign(updated)
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not update campaign status.')
        } finally {
            setStatusUpdating(false)
        }
    }

    async function handleLaunchCampaign() {
        await handleStatusTransition('ACTIVE')
        showToast('Campaign launched')
    }

    async function handleCompleteCampaign() {
        const inProgress = outreachRecords.filter(r => r.status !== 'POSTED')
        const message = inProgress.length > 0
            ? `${inProgress.length} influencer${inProgress.length === 1 ? '' : 's'} haven't reached Posted yet. Mark as completed anyway?`
            : 'Mark this campaign as completed?'
        const ok = await confirm({
            title: 'Complete campaign',
            message,
            confirmLabel: 'Complete',
        })
        if (!ok) return
        await handleStatusTransition('COMPLETED')
        showToast('Campaign completed')
    }

    async function handleReactivateCampaign() {
        const ok = await confirm({
            title: 'Reactivate campaign',
            message: 'Reactivate this campaign to Active? Outreach will be editable again.',
            confirmLabel: 'Reactivate',
        })
        if (!ok) return
        await handleStatusTransition('ACTIVE')
        showToast('Campaign reactivated')
    }

    async function handleArchiveCampaign() {
        const ok = await confirm({
            title: 'Archive campaign',
            message: 'Archive this completed campaign? It will be hidden from the main list.',
            confirmLabel: 'Archive',
        })
        if (!ok) return
        await handleStatusTransition('ARCHIVED')
        showToast('Campaign archived')
    }

    async function handleRestoreCampaign() {
        const ok = await confirm({
            title: 'Restore campaign',
            message: 'Restore this campaign to completed status?',
            confirmLabel: 'Restore',
        })
        if (!ok) return
        await handleStatusTransition('COMPLETED')
        showToast('Campaign restored')
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
            showToast('Influencer assigned')
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not assign influencer to campaign.')
        } finally {
            setAssigning(false)
        }
    }

    async function handleRemoveInfluencer(outreachId) {
        const ok = await confirm({
            title: 'Remove influencer',
            message: 'Are you sure you want to remove this influencer from the campaign?',
            danger: true,
            confirmLabel: 'Remove',
        })
        if (!ok) return

        try {
            setError('')

            await deleteOutreachRecord(outreachId)

            setOutreachRecords((current) =>
                current.filter((record) => record.id !== outreachId)
            )
            showToast('Influencer removed')
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not remove influencer from campaign.')
        }
    }

    async function handleDeleteCampaign() {
        let message = 'Are you sure you want to delete this campaign? This may also remove related outreach records depending on your database rules.'
        if (campaign?.status === 'ACTIVE') {
            message = 'This campaign has active outreach records. Deleting it may remove all associated outreach data.'
        } else if (campaign?.status === 'COMPLETED') {
            message = 'This campaign is completed and has outreach data. Are you sure you want to permanently delete it?'
        }
        const ok = await confirm({
            title: 'Delete campaign',
            message,
            danger: true,
            confirmLabel: 'Delete',
        })
        if (!ok) return

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

    if (loading) return (
        <div>
            <div className="page-header dashboard-header">
                <div>
                    <div className="skeleton" style={{ width: 130, height: 11, marginBottom: 10 }} />
                    <div className="skeleton" style={{ width: 220, height: 32, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: 340, height: 13 }} />
                </div>
                <div className="dashboard-actions">
                    <div className="skeleton" style={{ width: 110, height: 36, borderRadius: 10 }} />
                    <div className="skeleton" style={{ width: 130, height: 36, borderRadius: 20 }} />
                </div>
            </div>
            <section className="stats-grid status-grid">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="stat-card small-stat">
                        <div className="skeleton" style={{ width: 80, height: 11, marginBottom: 8 }} />
                        <div className="skeleton" style={{ width: 40, height: 26 }} />
                    </div>
                ))}
            </section>
            <section className="card campaign-progress-card">
                <div className="section-header" style={{ marginBottom: 14 }}>
                    <div>
                        <div className="skeleton" style={{ width: 140, height: 13, marginBottom: 6 }} />
                        <div className="skeleton" style={{ width: 260, height: 11 }} />
                    </div>
                    <div className="skeleton" style={{ width: 90, height: 22, borderRadius: 20 }} />
                </div>
                <div className="skeleton" style={{ height: 8, borderRadius: 10 }} />
            </section>
            <div className="profile-grid">
                <section className="card">
                    <div className="skeleton" style={{ width: 130, height: 13, marginBottom: 20 }} />
                    <div className="detail-list">
                        {[...Array(5)].map((_, i) => (
                            <div key={i}>
                                <div className="skeleton" style={{ width: 70, height: 11 }} />
                                <div className="skeleton" style={{ width: 120, height: 11 }} />
                            </div>
                        ))}
                    </div>
                </section>
                <div className="profile-main-column">
                    <section className="card assign-card">
                        <div className="skeleton" style={{ width: 140, height: 13, marginBottom: 8 }} />
                        <div className="skeleton" style={{ width: '100%', height: 36, borderRadius: 10, marginBottom: 8 }} />
                        <div className="skeleton" style={{ width: 130, height: 36, borderRadius: 10 }} />
                    </section>
                    <section className="card">
                        <div className="skeleton" style={{ width: 160, height: 13, marginBottom: 8 }} />
                        <div className="skeleton" style={{ width: '70%', height: 13, marginBottom: 16 }} />
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="campaign-assignment-card">
                                <div className="skeleton" style={{ width: 140, height: 13, marginBottom: 6 }} />
                                <div className="skeleton" style={{ width: '60%', height: 11 }} />
                            </div>
                        ))}
                    </section>
                </div>
            </div>
        </div>
    )
    if (error && !campaign) return <p className="error">{error}</p>
    if (!campaign) return <p>Campaign not found.</p>

    const isLocked = campaign.status === 'COMPLETED' || campaign.status === 'ARCHIVED'
    const isArchived = campaign.status === 'ARCHIVED'

    return (
        <div style={isArchived ? { opacity: 0.85 } : undefined}>
            <Toast message={toast.message} type={toast.type} />
            <ConfirmDialog state={confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
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
                    {!isLocked && (
                        <Link to={`/campaigns/${id}/edit`} className="primary-link-button">
                            Edit Campaign
                        </Link>
                    )}

                    {campaign.status === 'DRAFT' && (
                        <button
                            type="button"
                            className="primary-button"
                            onClick={handleLaunchCampaign}
                            disabled={statusUpdating}
                        >
                            Launch Campaign
                        </button>
                    )}

                    {campaign.status === 'ACTIVE' && (
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={handleCompleteCampaign}
                            disabled={statusUpdating}
                        >
                            Complete Campaign
                        </button>
                    )}

                    {campaign.status === 'COMPLETED' && (
                        <>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleReactivateCampaign}
                                disabled={statusUpdating}
                            >
                                Reactivate Campaign
                            </button>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleArchiveCampaign}
                                disabled={statusUpdating}
                            >
                                Archive Campaign
                            </button>
                        </>
                    )}

                    {campaign.status === 'ARCHIVED' && (
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={handleRestoreCampaign}
                            disabled={statusUpdating}
                        >
                            Restore Campaign
                        </button>
                    )}

                    <button
                        type="button"
                        className="danger-button"
                        onClick={handleDeleteCampaign}
                    >
                        Remove Campaign
                    </button>
                </div>
            </div>

            {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

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
                        <h2>{isLocked ? 'Campaign Summary' : 'Campaign Progress'}</h2>
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

                        {campaign.status === 'COMPLETED' ? (
                            <p className="muted">
                                This campaign is completed and is not accepting new influencer assignments.
                            </p>
                        ) : campaign.status === 'ARCHIVED' ? (
                            <p className="muted">
                                This campaign is archived and is not accepting new influencer assignments.
                            </p>
                        ) : (
                            <>
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
                            </>
                        )}
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

                                            {!isLocked && (
                                                <button
                                                    type="button"
                                                    className="danger-button"
                                                    onClick={() => handleRemoveInfluencer(record.id)}
                                                >
                                                    Remove
                                                </button>
                                            )}
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
