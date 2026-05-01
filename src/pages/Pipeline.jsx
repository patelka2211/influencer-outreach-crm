import { useEffect, useState } from 'react'
import { getInfluencers } from '../services/influencerService'
import { getCampaigns } from '../services/campaignService'
import { Link } from 'react-router-dom'
import {
    addOutreachNote,
    createOutreachRecord,
    getOutreachRecords,
    updateOutreachStatus,
    deleteOutreachRecord,
} from '../services/outreachService'

const STATUS_ORDER = ['CONTACTED', 'REPLIED', 'SHIPPED', 'POSTED']

const NEXT_STATUS = {
    CONTACTED: 'REPLIED',
    REPLIED: 'SHIPPED',
    SHIPPED: 'POSTED',
    POSTED: null,
}

function Pipeline() {
    const [outreachRecords, setOutreachRecords] = useState([])
    const [influencers, setInfluencers] = useState([])
    const [campaigns, setCampaigns] = useState([])
    const [selectedPipelineCampaignId, setSelectedPipelineCampaignId] = useState('ALL')

    // Outreach creation modal
    const [outreachModalOpen, setOutreachModalOpen] = useState(false)
    const [selectedInfluencerId, setSelectedInfluencerId] = useState('')
    const [selectedCampaignId, setSelectedCampaignId] = useState('')
    const [outreachError, setOutreachError] = useState('')
    const [saving, setSaving] = useState(false)

    // Inline note expansion — only one card open at a time
    const [expandedNoteId, setExpandedNoteId] = useState(null)
    const [noteText, setNoteText] = useState('')

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    async function loadPipelineData() {
        try {
            setLoading(true)
            setError('')
            const [outreachData, influencerData, campaignData] = await Promise.all([
                getOutreachRecords(),
                getInfluencers(),
                getCampaigns(),
            ])
            setOutreachRecords(outreachData || [])
            setInfluencers(influencerData || [])
            setCampaigns(campaignData || [])
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not load outreach pipeline.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadPipelineData()
    }, [])

    // Escape key + body scroll lock for outreach modal
    useEffect(() => {
        if (!outreachModalOpen) return
        function onKey(e) {
            if (e.key === 'Escape') closeOutreachModal()
        }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [outreachModalOpen])

    function openOutreachModal() {
        setOutreachError('')
        setSelectedInfluencerId('')
        setSelectedCampaignId('')
        setOutreachModalOpen(true)
    }

    function closeOutreachModal() {
        setOutreachModalOpen(false)
        setOutreachError('')
    }

    async function handleCreateOutreach(e) {
        e.preventDefault()

        if (!selectedInfluencerId || !selectedCampaignId) {
            setOutreachError('Please select both an influencer and a campaign.')
            return
        }

        const alreadyExists = outreachRecords.some(
            (r) => r.influencer_id === selectedInfluencerId && r.campaign_id === selectedCampaignId
        )

        if (alreadyExists) {
            setOutreachError('This influencer is already assigned to this campaign.')
            return
        }

        try {
            setSaving(true)
            setOutreachError('')
            await createOutreachRecord({
                influencer_id: selectedInfluencerId,
                campaign_id: selectedCampaignId,
            })
            closeOutreachModal()
            await loadPipelineData()
        } catch (err) {
            console.error(err)
            setOutreachError(err.message || 'Could not create outreach record.')
        } finally {
            setSaving(false)
        }
    }

    async function handleMoveNext(record) {
        const nextStatus = NEXT_STATUS[record.status]
        if (!nextStatus) return
        try {
            setError('')
            await updateOutreachStatus(record.id, nextStatus)
            await loadPipelineData()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not update outreach status.')
        }
    }

    function handleToggleNote(recordId) {
        if (expandedNoteId === recordId) {
            setExpandedNoteId(null)
            setNoteText('')
        } else {
            setExpandedNoteId(recordId)
            setNoteText('')
        }
    }

    async function handleAddNote(recordId) {
        if (!noteText.trim()) {
            setError('Please enter a note before saving.')
            return
        }
        try {
            setError('')
            await addOutreachNote({ outreach_id: recordId, content: noteText.trim() })
            setNoteText('')
            setExpandedNoteId(null)
            await loadPipelineData()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not add note.')
        }
    }

    async function handleDeleteOutreach(recordId) {
        const confirmed = window.confirm('Are you sure you want to remove this outreach record?')
        if (!confirmed) return
        try {
            setError('')
            await deleteOutreachRecord(recordId)
            await loadPipelineData()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not delete outreach record.')
        }
    }

    const filteredOutreachRecords =
        selectedPipelineCampaignId === 'ALL'
            ? outreachRecords
            : outreachRecords.filter((r) => r.campaign_id === selectedPipelineCampaignId)

    const pipelineStats = {
        total: filteredOutreachRecords.length,
        CONTACTED: filteredOutreachRecords.filter((r) => r.status === 'CONTACTED').length,
        REPLIED:   filteredOutreachRecords.filter((r) => r.status === 'REPLIED').length,
        SHIPPED:   filteredOutreachRecords.filter((r) => r.status === 'SHIPPED').length,
        POSTED:    filteredOutreachRecords.filter((r) => r.status === 'POSTED').length,
    }

    function getRecordsByStatus(status) {
        return filteredOutreachRecords.filter((r) => r.status === status)
    }

    return (
        <div>
            {/* ── Start Outreach Modal ── */}
            {outreachModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={(e) => e.target === e.currentTarget && closeOutreachModal()}
                >
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Start New Outreach</h2>
                            <button className="modal-close" onClick={closeOutreachModal} aria-label="Close">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleCreateOutreach} className="form outreach-modal-form">
                            <label>Influencer</label>
                            <select
                                value={selectedInfluencerId}
                                onChange={(e) => setSelectedInfluencerId(e.target.value)}
                                required
                            >
                                <option value="">Select influencer</option>
                                {influencers.map((inf) => (
                                    <option key={inf.id} value={inf.id}>
                                        {inf.name} ({inf.platform})
                                    </option>
                                ))}
                            </select>

                            <label>Campaign</label>
                            <select
                                value={selectedCampaignId}
                                onChange={(e) => setSelectedCampaignId(e.target.value)}
                                required
                            >
                                <option value="">Select campaign</option>
                                {campaigns.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.status})
                                    </option>
                                ))}
                            </select>

                            {outreachError && <p className="error">{outreachError}</p>}

                            <button type="submit" disabled={saving}>
                                {saving ? 'Creating...' : 'Start Outreach'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Page Header ── */}
            <div className="page-header dashboard-header">
                <div>
                    <h1>Outreach Pipeline</h1>
                    <p className="muted">
                        Track influencer outreach from first contact to post.
                    </p>
                </div>
                <button className="primary-button" onClick={openOutreachModal}>
                    Start Outreach
                </button>
            </div>

            {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

            {/* ── Filter + Stats ── */}
            <section className="card pipeline-filter-card">
                <div className="section-header">
                    <div>
                        <h2>Pipeline View</h2>
                        <p className="muted">Filter by campaign to narrow the board.</p>
                    </div>
                    <select
                        value={selectedPipelineCampaignId}
                        onChange={(e) => setSelectedPipelineCampaignId(e.target.value)}
                        className="pipeline-filter-select"
                    >
                        <option value="ALL">All Campaigns</option>
                        {campaigns.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="pipeline-stats-grid">
                    <div className="pipeline-stat-card">
                        <span>Total</span>
                        <strong>{pipelineStats.total}</strong>
                    </div>
                    <div className="pipeline-stat-card">
                        <span>Contacted</span>
                        <strong>{pipelineStats.CONTACTED}</strong>
                    </div>
                    <div className="pipeline-stat-card">
                        <span>Replied</span>
                        <strong>{pipelineStats.REPLIED}</strong>
                    </div>
                    <div className="pipeline-stat-card">
                        <span>Shipped</span>
                        <strong>{pipelineStats.SHIPPED}</strong>
                    </div>
                    <div className="pipeline-stat-card">
                        <span>Posted</span>
                        <strong>{pipelineStats.POSTED}</strong>
                    </div>
                </div>
            </section>

            {/* ── Kanban Board ── */}
            {loading ? (
                <p className="muted">Loading pipeline...</p>
            ) : (
                <div className="pipeline-board">
                    {STATUS_ORDER.map((status) => {
                        const records = getRecordsByStatus(status)

                        return (
                            <section key={status} className="pipeline-column">
                                <div className="pipeline-column-header">
                                    <h2>{status}</h2>
                                    <span>{records.length}</span>
                                </div>

                                <div className="pipeline-cards">
                                    {records.length === 0 ? (
                                        <p className="empty-column">No records yet.</p>
                                    ) : (
                                        records.map((record) => {
                                            const platform = record.influencers?.platform
                                            const noteCount = record.notes?.length || 0
                                            const isNoteOpen = expandedNoteId === record.id

                                            return (
                                                <div key={record.id} className="pipeline-card">
                                                    {/* Card body */}
                                                    <div className="pipeline-card-main">
                                                        <div className="pipeline-card-info">
                                                            {record.influencers?.id ? (
                                                                <Link
                                                                    to={`/influencers/${record.influencers.id}`}
                                                                    className="pipeline-card-title"
                                                                >
                                                                    {record.influencers.name}
                                                                </Link>
                                                            ) : (
                                                                <span className="pipeline-card-title">
                                                                    Unknown Influencer
                                                                </span>
                                                            )}

                                                            <div className="pipeline-card-meta">
                                                                {platform && (
                                                                    <span className={`platform-badge ${platform.toLowerCase()}`}>
                                                                        {platform}
                                                                    </span>
                                                                )}
                                                                {record.influencers?.handle && (
                                                                    <span className="pipeline-card-handle">
                                                                        {record.influencers.handle}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {record.campaigns?.id ? (
                                                                <Link
                                                                    to={`/campaigns/${record.campaigns.id}`}
                                                                    className="pipeline-card-campaign"
                                                                >
                                                                    {record.campaigns.name}
                                                                </Link>
                                                            ) : (
                                                                <span className="pipeline-card-campaign">
                                                                    No campaign
                                                                </span>
                                                            )}
                                                        </div>

                                                        <span
                                                            className={`status-dot status-dot--${status.toLowerCase()}`}
                                                            title={status}
                                                        />
                                                    </div>

                                                    {/* Action footer */}
                                                    <div className="pipeline-card-footer">
                                                        <button
                                                            type="button"
                                                            className="pipeline-card-action"
                                                            onClick={() => handleToggleNote(record.id)}
                                                        >
                                                            {isNoteOpen
                                                                ? 'Cancel'
                                                                : noteCount > 0
                                                                    ? `Notes (${noteCount})`
                                                                    : '+ Note'}
                                                        </button>

                                                        <div className="pipeline-card-footer-right">
                                                            {NEXT_STATUS[status] ? (
                                                                <button
                                                                    type="button"
                                                                    className="pipeline-card-move"
                                                                    onClick={() => handleMoveNext(record)}
                                                                >
                                                                    → {NEXT_STATUS[status]}
                                                                </button>
                                                            ) : (
                                                                <span className="pipeline-card-done">✓ Done</span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="pipeline-card-remove"
                                                                onClick={() => handleDeleteOutreach(record.id)}
                                                                title="Remove outreach"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Inline note input */}
                                                    {isNoteOpen && (
                                                        <div className="pipeline-note-expand">
                                                            <textarea
                                                                value={noteText}
                                                                onChange={(e) => setNoteText(e.target.value)}
                                                                placeholder="Add follow-up details..."
                                                                rows="2"
                                                                autoFocus
                                                            />
                                                            <button
                                                                type="button"
                                                                className="secondary-button"
                                                                onClick={() => handleAddNote(record.id)}
                                                            >
                                                                Save Note
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </section>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default Pipeline
