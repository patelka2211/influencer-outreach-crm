import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { getCampaigns } from '../services/campaignService'
import {
    createOutreachRecord,
    deleteOutreachRecord,
} from '../services/outreachService'

function InfluencerProfile() {
    const { id } = useParams()
    const [influencer, setInfluencer] = useState(null)
    const [outreachRecords, setOutreachRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [campaigns, setCampaigns] = useState([])
    const [selectedCampaignId, setSelectedCampaignId] = useState('')
    const [assigning, setAssigning] = useState(false)

    async function loadOutreachRecords() {
        const { data: outreachData, error: outreachError } = await supabase
            .from('outreach')
            .select(`
                *,
                campaigns (*),
                notes (*)
            `)
            .eq('influencer_id', id)
            .order('created_at', { ascending: false })

        if (outreachError) throw outreachError

        setOutreachRecords(outreachData || [])
    }

    useEffect(() => {
        async function loadInfluencerProfile() {
            try {
                setLoading(true)
                setError('')

                const { data: influencerData, error: influencerError } = await supabase
                    .from('influencers')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (influencerError) throw influencerError

                const campaignData = await getCampaigns()

                setInfluencer(influencerData)
                setCampaigns(campaignData || [])

                await loadOutreachRecords()
            } catch (err) {
                console.error(err)
                setError(err.message || 'Could not load influencer profile.')
            } finally {
                setLoading(false)
            }
        }

        loadInfluencerProfile()
    }, [id])

    async function handleAssignToCampaign(e) {
        e.preventDefault()

        if (!selectedCampaignId) {
            setError('Please select a campaign first.')
            return
        }

        const alreadyAssigned = outreachRecords.some(
            (record) => record.campaign_id === selectedCampaignId
        )

        if (alreadyAssigned) {
            setError('This influencer is already assigned to that campaign.')
            return
        }

        try {
            setAssigning(true)
            setError('')

            await createOutreachRecord({
                influencer_id: id,
                campaign_id: selectedCampaignId,
            })

            setSelectedCampaignId('')
            await loadOutreachRecords()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not assign influencer to campaign.')
        } finally {
            setAssigning(false)
        }
    }

    async function handleRemoveFromCampaign(outreachId) {
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

    if (loading) return <p>Loading influencer profile...</p>
    if (error) return <p className="error">{error}</p>
    if (!influencer) return <p>Influencer not found.</p>

    return (
        <div>
            <div className="page-header dashboard-header">
                <div>
                    <Link to="/influencers" className="back-link">
                        ← Back to Influencers
                    </Link>

                    <h1>{influencer.name}</h1>
                    <p className="muted">
                        {influencer.platform} influencer profile, campaign assignments, and outreach history.
                    </p>
                </div>

                <Link
                    to={`/influencers/${id}/edit`}
                    className="primary-link-button"
                >
                    Edit Profile
                </Link>
            </div>

            <div className="profile-grid">
                <section className="card">
                    <h2>Profile Details</h2>

                    <div className="detail-list">
                        <div>
                            <span>Name</span>
                            <strong>{influencer.name}</strong>
                        </div>

                        <div>
                            <span>Platform</span>
                            <strong>
                                <span className={`platform-badge ${influencer.platform?.toLowerCase()}`}>
                                    {influencer.platform}
                                </span>
                            </strong>
                        </div>

                        <div>
                            <span>Handle</span>
                            <strong>{influencer.handle}</strong>
                        </div>

                        <div>
                            <span>Email</span>
                            <strong>{influencer.email || '—'}</strong>
                        </div>

                        <div>
                            <span>Followers</span>
                            <strong>{influencer.follower_count?.toLocaleString() || '—'}</strong>
                        </div>

                        <div>
                            <span>Niche</span>
                            <strong>{influencer.niche || '—'}</strong>
                        </div>

                        <div>
                            <span>Contact Details</span>
                            <strong>{influencer.contact_details || '—'}</strong>
                        </div>
                    </div>
                </section>

                <div className="profile-main-column">
                    <section className="card assign-card">
                        <h2>Assign to Campaign</h2>
                        <p className="muted">
                            Start a new outreach record for this influencer in a selected campaign.
                        </p>

                        <form onSubmit={handleAssignToCampaign} className="assign-form">
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

                            <button type="submit" disabled={assigning}>
                                {assigning ? 'Assigning...' : 'Assign to Campaign'}
                            </button>
                        </form>
                    </section>

                    <section className="card">
                        <h2>Campaigns</h2>
                        <p className="muted">
                            Campaigns this influencer is assigned to, including outreach status and interaction notes.
                        </p>

                        {outreachRecords.length === 0 ? (
                            <p className="muted">
                                This influencer has not been assigned to any campaigns yet.
                            </p>
                        ) : (
                            <div className="campaign-assignment-list">
                                {outreachRecords.map((record) => (
                                    <div key={record.id} className="campaign-assignment-card">
                                        <div className="campaign-assignment-header">
                                            <div>
                                                {record.campaigns?.id ? (
                                                    <Link
                                                        to={`/campaigns/${record.campaigns.id}`}
                                                        className="campaign-assignment-title"
                                                    >
                                                        {record.campaigns.name}
                                                    </Link>
                                                ) : (
                                                    <strong>Campaign</strong>
                                                )}

                                                <p className="muted">
                                                    Current outreach status:{' '}
                                                    <span className={`status-pill status-pill--${record.status.toLowerCase()}`}>{record.status}</span>
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className="danger-button"
                                                onClick={() => handleRemoveFromCampaign(record.id)}
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        {record.notes?.length > 0 ? (
                                            <div className="campaign-notes-block">
                                                <strong>Interaction Notes</strong>

                                                <ul>
                                                    {record.notes.map((note) => (
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
                                                No notes have been added for this campaign yet.
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

export default InfluencerProfile