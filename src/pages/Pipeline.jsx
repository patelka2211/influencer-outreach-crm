import { useEffect, useState, useCallback } from 'react'
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
import { STATUS_ORDER, NEXT_STATUS, REPLIED_STALE_DAYS } from '../constants/outreach'
import Toast from '../components/Toast'

const AVATAR_VARIANTS = ['a', 'b', 'c', 'd']

const HINT_TEXT = {
    CONTACTED: 'Waiting for response',
    REPLIED: 'Add a note about the response',
    SHIPPED: 'Awaiting post',
    POSTED: null,
}

function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function capitalize(str) {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function formatStatusDate(dateStr, label) {
    if (!dateStr) return null
    return `${label} ${new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
    })}`
}

function getStatusTimestamp(record) {
    switch (record.status) {
        case 'CONTACTED': return formatStatusDate(record.contacted_at, 'Contacted')
        case 'REPLIED':   return formatStatusDate(record.replied_at, 'Replied')
        case 'SHIPPED':   return formatStatusDate(record.shipped_at, 'Shipped')
        case 'POSTED':    return formatStatusDate(record.posted_at, 'Posted')
        default:          return null
    }
}

function getRepliedStaleDays(record) {
    if (record.status !== 'REPLIED' || !record.replied_at) return 0
    const ms = Date.now() - new Date(record.replied_at).getTime()
    return Math.floor(ms / (1000 * 60 * 60 * 24))
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

    // Show all notes expansion per card
    const [expandedAllNotesId, setExpandedAllNotesId] = useState(null)

    // Columns expanded beyond 3-card limit
    const [expandedColumns, setExpandedColumns] = useState(new Set())

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Toast
    const [toastMessage, setToastMessage] = useState('')

    const showToast = useCallback((message) => {
        setToastMessage(message)
        setTimeout(() => setToastMessage(''), 3000)
    }, [])

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
        const campStatus = record.campaigns?.status

        if (campStatus === 'DRAFT') {
            showToast('Campaign must be Active before managing outreach.')
            return
        }
        if (campStatus === 'COMPLETED' || campStatus === 'ARCHIVED') {
            showToast(`Campaign ${campStatus.toLowerCase()} — outreach cannot be moved.`)
            return
        }

        const nextStatus = NEXT_STATUS[record.status]
        if (!nextStatus) return

        try {
            setError('')
            await updateOutreachStatus(record.id, nextStatus)
            await loadPipelineData()
        } catch (err) {
            console.error(err)
            if (err.message?.includes('Invalid transition')) {
                showToast(err.message)
            } else {
                setError(err.message || 'Could not update outreach status.')
            }
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

    function toggleAllNotes(recordId) {
        setExpandedAllNotesId(prev => prev === recordId ? null : recordId)
    }

    function toggleColumnExpand(status) {
        setExpandedColumns(prev => {
            const next = new Set(prev)
            if (next.has(status)) next.delete(status)
            else next.add(status)
            return next
        })
    }

    function formatNoteTime(dateStr) {
        if (!dateStr) return 'No date'
        return new Date(dateStr).toLocaleString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit',
        })
    }

    async function handleDeleteOutreach(record) {
        const campStatus = record.campaigns?.status
        if (campStatus === 'COMPLETED' || campStatus === 'ARCHIVED') {
            showToast(`Cannot remove outreach from a ${campStatus.toLowerCase()} campaign.`)
            return
        }
        const confirmed = window.confirm('Are you sure you want to remove this outreach record?')
        if (!confirmed) return
        try {
            setError('')
            await deleteOutreachRecord(record.id)
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

    // Only DRAFT and ACTIVE campaigns are valid for new outreach
    const assignableCampaigns = campaigns.filter(
        c => c.status === 'DRAFT' || c.status === 'ACTIVE'
    )

    return (
        <div>
            <Toast message={toastMessage} />

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
                                {assignableCampaigns.map((c) => (
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
                    <h1>Outreach pipeline</h1>
                    <p className="muted">Track influencer outreach from contacted to posted.</p>
                </div>
                <div className="dashboard-actions">
                    <select
                        className="pipeline-filter-select"
                        value={selectedPipelineCampaignId}
                        onChange={(e) => setSelectedPipelineCampaignId(e.target.value)}
                    >
                        <option value="ALL">All Campaigns</option>
                        {campaigns.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <button className="primary-button" onClick={openOutreachModal}>+ Start Outreach</button>
                </div>
            </div>

            {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

            {/* ── Pipeline Stats ── */}
            <p className="dash-section-label">Pipeline overview</p>
            {loading ? (
                <div className="pipeline-stats-grid" style={{ marginBottom: 22 }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="pipeline-stat-card">
                            <div className="skeleton" style={{ width: '60%', height: 10, marginBottom: 8 }} />
                            <div className="skeleton" style={{ width: '40%', height: 22 }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="pipeline-stats-grid" style={{ marginBottom: 22 }}>
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
            )}

            {/* ── Kanban Board ── */}
            <p className="dash-section-label">Kanban board</p>
            {loading ? (
                <div className="pipeline-board">
                    {[...Array(4)].map((_, i) => (
                        <section key={i} className="pipeline-column">
                            <div className="pipeline-column-header">
                                <div className="skeleton" style={{ width: 80, height: 13 }} />
                                <div className="skeleton" style={{ width: 28, height: 20, borderRadius: 20 }} />
                            </div>
                            <div className="pipeline-cards">
                                {[...Array(3)].map((_, j) => (
                                    <div key={j} className="pipeline-card">
                                        <div className="pipe-card-top" style={{ marginBottom: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                                                <div>
                                                    <div className="skeleton" style={{ width: 100, height: 12, marginBottom: 5 }} />
                                                    <div className="skeleton" style={{ width: 70, height: 10 }} />
                                                </div>
                                            </div>
                                            <div className="skeleton" style={{ width: 54, height: 18, borderRadius: 20 }} />
                                        </div>
                                        <div className="skeleton" style={{ width: '70%', height: 11, marginBottom: 10 }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #ede9fc' }}>
                                            <div className="skeleton" style={{ width: 48, height: 22, borderRadius: 6 }} />
                                            <div className="skeleton" style={{ width: 90, height: 22, borderRadius: 6 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="pipeline-board">
                    {STATUS_ORDER.map((status) => {
                        const records = getRecordsByStatus(status)

                        const isColExpanded = expandedColumns.has(status)
                        const visibleRecords = isColExpanded ? records : records.slice(0, 3)
                        const hiddenCount = records.length - 3

                        return (
                            <section key={status} className="pipeline-column">
                                <div className="pipeline-column-header">
                                    <h2>{capitalize(status)}</h2>
                                    <span className={`pipe-cnt pipe-cnt--${status.toLowerCase()}`}>{records.length}</span>
                                </div>

                                <div className="pipeline-cards">
                                    {records.length === 0 ? (
                                        <p className="empty-column">No records yet.</p>
                                    ) : (
                                        visibleRecords.map((record, i) => {
                                            const platform = record.influencers?.platform
                                            const sortedNotes = [...(record.notes || [])].sort(
                                                (a, b) => new Date(b.created_at) - new Date(a.created_at)
                                            )
                                            const noteCount = sortedNotes.length
                                            const isNoteOpen = expandedNoteId === record.id
                                            const mostRecentNote = sortedNotes[0]

                                            const campStatus = record.campaigns?.status
                                            const campaignLocked = campStatus === 'COMPLETED' || campStatus === 'ARCHIVED'

                                            const timestamp = getStatusTimestamp(record)
                                            const hintText = HINT_TEXT[status]

                                            const staleDays = getRepliedStaleDays(record)
                                            const showStalePill = status === 'REPLIED' && staleDays > REPLIED_STALE_DAYS

                                            const isPosted = status === 'POSTED'

                                            return (
                                                <div
                                                    key={record.id}
                                                    className="pipeline-card"
                                                    style={isPosted ? { borderLeft: '3px solid #3aab85' } : undefined}
                                                >
                                                    {/* Avatar + name/handle + platform badge */}
                                                    <div className="pipe-card-top">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div className={`dash-avatar dash-avatar--${AVATAR_VARIANTS[i % 4]}`}>
                                                                {getInitials(record.influencers?.name)}
                                                            </div>
                                                            <div className="pipeline-card-info">
                                                                {record.influencers?.id ? (
                                                                    <Link
                                                                        to={`/influencers/${record.influencers.id}`}
                                                                        className="pipeline-card-title"
                                                                    >
                                                                        {record.influencers.name}
                                                                    </Link>
                                                                ) : (
                                                                    <span className="pipeline-card-title">Unknown Influencer</span>
                                                                )}
                                                                {record.influencers?.handle && (
                                                                    <span className="pipeline-card-handle">
                                                                        {record.influencers.handle.startsWith('@')
                                                                            ? record.influencers.handle
                                                                            : `@${record.influencers.handle}`}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {platform && (
                                                            <span className={`platform-badge ${platform.toLowerCase()}`}>
                                                                {platform}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Campaign name */}
                                                    {record.campaigns?.id ? (
                                                        <Link
                                                            to={`/campaigns/${record.campaigns.id}`}
                                                            className="pipeline-card-campaign"
                                                        >
                                                            {record.campaigns.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="pipeline-card-campaign">No campaign</span>
                                                    )}

                                                    {/* Timestamp + hint */}
                                                    {(timestamp || hintText || showStalePill) && (
                                                        <div className="pipe-card-meta">
                                                            {timestamp && (
                                                                <span className="pipe-card-timestamp">{timestamp}</span>
                                                            )}
                                                            {showStalePill && (
                                                                <span className="pipe-stale-pill">
                                                                    {staleDays} day{staleDays === 1 ? '' : 's'} since reply
                                                                </span>
                                                            )}
                                                            {hintText && !showStalePill && (
                                                                <span className="pipe-card-hint">{hintText}</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Note previews */}
                                                    {mostRecentNote && !isNoteOpen && (
                                                        <div className="pipe-notes-section">
                                                            {expandedAllNotesId === record.id ? (
                                                                <div className="pipe-all-notes">
                                                                    {sortedNotes.map((note) => (
                                                                        <div key={note.id} className="pipe-note-preview">
                                                                            <p className="pipe-note-text">{note.content}</p>
                                                                            <span className="pipe-note-time">{formatNoteTime(note.created_at)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="pipe-note-preview">
                                                                    <p className="pipe-note-text">{mostRecentNote.content}</p>
                                                                    <span className="pipe-note-time">{formatNoteTime(mostRecentNote.created_at)}</span>
                                                                </div>
                                                            )}
                                                            {noteCount > 1 && (
                                                                <button
                                                                    type="button"
                                                                    className="pipe-show-notes-btn"
                                                                    onClick={() => toggleAllNotes(record.id)}
                                                                >
                                                                    {expandedAllNotesId === record.id
                                                                        ? 'Hide notes'
                                                                        : `Show all notes (${noteCount})`}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Action footer */}
                                                    <div className="pipeline-card-footer">
                                                        <button
                                                            type="button"
                                                            className="pipe-note-btn"
                                                            onClick={() => handleToggleNote(record.id)}
                                                        >
                                                            {isNoteOpen ? 'Cancel' : '+ Note'}
                                                        </button>
                                                        <span className="pipe-note-count">
                                                            {noteCount} note{noteCount === 1 ? '' : 's'}
                                                        </span>
                                                        <div className="pipeline-card-footer-right">
                                                            {isPosted ? (
                                                                <button
                                                                    type="button"
                                                                    className="pipe-move-btn pipe-move-btn--posted"
                                                                    disabled
                                                                >
                                                                    Complete ✓
                                                                </button>
                                                            ) : campaignLocked ? (
                                                                <span className="pipe-status-locked-text">
                                                                    Campaign {campStatus.toLowerCase()}
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="pipe-move-btn"
                                                                    onClick={() => handleMoveNext(record)}
                                                                >
                                                                    Move to {capitalize(NEXT_STATUS[status])}
                                                                </button>
                                                            )}
                                                            {!campaignLocked && (
                                                                <button
                                                                    type="button"
                                                                    className="pipeline-card-remove"
                                                                    onClick={() => handleDeleteOutreach(record)}
                                                                    title="Remove outreach"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
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
                                    {!isColExpanded && hiddenCount > 0 && (
                                        <button
                                            type="button"
                                            className="pipe-show-more-btn"
                                            onClick={() => toggleColumnExpand(status)}
                                        >
                                            + {hiddenCount} more
                                        </button>
                                    )}
                                    {isColExpanded && records.length > 3 && (
                                        <button
                                            type="button"
                                            className="pipe-show-more-btn"
                                            onClick={() => toggleColumnExpand(status)}
                                        >
                                            Show less
                                        </button>
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
