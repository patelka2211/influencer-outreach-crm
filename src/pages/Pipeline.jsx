import { useEffect, useState } from 'react'
import { getInfluencers } from '../services/influencerService'
import { getCampaigns } from '../services/campaignService'
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

    const [selectedInfluencerId, setSelectedInfluencerId] = useState('')
    const [selectedCampaignId, setSelectedCampaignId] = useState('')

    const [noteTextByRecord, setNoteTextByRecord] = useState({})

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
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

    async function handleCreateOutreach(e) {
        e.preventDefault()

        if (!selectedInfluencerId || !selectedCampaignId) {
            setError('Please select both an influencer and a campaign.')
            return
        }

        const alreadyExists = outreachRecords.some(
            (record) =>
                record.influencer_id === selectedInfluencerId &&
                record.campaign_id === selectedCampaignId
        )

        if (alreadyExists) {
            setError('This influencer is already assigned to this campaign.')
            return
        }

        try {
            setSaving(true)
            setError('')

            await createOutreachRecord({
                influencer_id: selectedInfluencerId,
                campaign_id: selectedCampaignId,
            })

            setSelectedInfluencerId('')
            setSelectedCampaignId('')

            await loadPipelineData()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not create outreach record.')
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

    async function handleAddNote(recordId) {
        const content = noteTextByRecord[recordId]

        if (!content || content.trim() === '') {
            setError('Please enter a note before saving.')
            return
        }

        try {
            setError('')

            await addOutreachNote({
                outreach_id: recordId,
                content: content.trim(),
            })

            setNoteTextByRecord((current) => ({
                ...current,
                [recordId]: '',
            }))

            await loadPipelineData()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not add note.')
        }
    }

    function getRecordsByStatus(status) {
        return outreachRecords.filter((record) => record.status === status)
    }

    async function handleDeleteOutreach(recordId) {
        const confirmed = window.confirm(
            'Are you sure you want to remove this outreach record?'
        )

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

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Outreach Pipeline</h1>
                    <p className="muted">
                        Assign influencers to campaigns and track outreach progress from contacted to posted.
                    </p>
                </div>
            </div>

            <section className="card pipeline-create-card">
                <h2>Start New Outreach</h2>

                <form onSubmit={handleCreateOutreach} className="pipeline-form">
                    <div>
                        <label>Influencer</label>
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
                    </div>

                    <div>
                        <label>Campaign</label>
                        <select
                            value={selectedCampaignId}
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                        >
                            <option value="">Select campaign</option>
                            {campaigns.map((campaign) => (
                                <option key={campaign.id} value={campaign.id}>
                                    {campaign.name} ({campaign.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" disabled={saving}>
                        {saving ? 'Creating...' : 'Start Outreach'}
                    </button>
                </form>

                {error && <p className="error">{error}</p>}
            </section>

            {loading ? (
                <p>Loading pipeline...</p>
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
                                        <p className="muted empty-column">No records yet.</p>
                                    ) : (
                                        records.map((record) => (
                                            <div key={record.id} className="pipeline-card">
                                                <div className="pipeline-card-top">
                                                    <div>
                                                        <h3>{record.influencers?.name || 'Unknown Influencer'}</h3>
                                                        <p className="muted">
                                                            {record.influencers?.platform || 'Platform'} ·{' '}
                                                            {record.influencers?.handle || 'No handle'}
                                                        </p>
                                                    </div>

                                                    <span className="status-pill">{record.status}</span>
                                                </div>

                                                <p className="campaign-name">
                                                    {record.campaigns?.name || 'No campaign'}
                                                </p>

                                                <div className="note-section">
                                                    <label>Add Note</label>
                                                    <textarea
                                                        value={noteTextByRecord[record.id] || ''}
                                                        onChange={(e) =>
                                                            setNoteTextByRecord((current) => ({
                                                                ...current,
                                                                [record.id]: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Add follow-up details..."
                                                        rows="2"
                                                    />

                                                    <button
                                                        type="button"
                                                        className="secondary-button"
                                                        onClick={() => handleAddNote(record.id)}
                                                    >
                                                        Save Note
                                                    </button>
                                                </div>

                                                {record.notes?.length > 0 && (
                                                    <div className="recent-notes">
                                                        <strong>Notes</strong>
                                                        <ul>
                                                            {record.notes.slice(0, 2).map((note) => (
                                                                <li key={note.id}>{note.content}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="pipeline-card-actions">
                                                    {NEXT_STATUS[record.status] ? (
                                                        <button
                                                            type="button"
                                                            className="primary-button full-width"
                                                            onClick={() => handleMoveNext(record)}
                                                        >
                                                            Move to {NEXT_STATUS[record.status]}
                                                        </button>
                                                    ) : (
                                                        <p className="complete-text">Outreach complete</p>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="danger-button full-width"
                                                        onClick={() => handleDeleteOutreach(record.id)}
                                                    >
                                                        Remove Outreach
                                                    </button>
                                                </div>
                                            </div>
                                        ))
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