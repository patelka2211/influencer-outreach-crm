import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    getCampaignById,
    updateCampaign,
} from '../services/campaignService'

function EditCampaign() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'DRAFT',
    })

    useEffect(() => {
        async function loadCampaign() {
            try {
                setLoading(true)
                setError('')

                const campaign = await getCampaignById(id)

                if (campaign.status === 'COMPLETED' || campaign.status === 'ARCHIVED') {
                    navigate(`/campaigns/${id}`, { replace: true })
                    return
                }

                setForm({
                    name: campaign.name || '',
                    description: campaign.description || '',
                    start_date: campaign.start_date || '',
                    end_date: campaign.end_date || '',
                    status: campaign.status || 'DRAFT',
                })
            } catch (err) {
                console.error(err)
                setError(err.message || 'Could not load campaign.')
            } finally {
                setLoading(false)
            }
        }

        loadCampaign()
    }, [id])

    function handleChange(e) {
        const { name, value } = e.target

        setForm((current) => ({
            ...current,
            [name]: value,
        }))
    }

    async function handleSubmit(e) {
        e.preventDefault()

        try {
            setSaving(true)
            setError('')

            await updateCampaign(id, form)

            navigate(`/campaigns/${id}`)
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not update campaign.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <p>Loading campaign...</p>

    return (
        <div>
            <div className="page-header">
                <Link to={`/campaigns/${id}`} className="back-link">
                    ← Back to Campaign
                </Link>

                <h1>Edit Campaign</h1>
                <p className="muted">
                    Update campaign details, dates, and current status.
                </p>
            </div>

            <section className="card edit-page-card">
                <form onSubmit={handleSubmit} className="form">
                    <label>Campaign Name</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Spring Skincare Launch"
                        required
                    />

                    <label>Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Campaign for promoting the spring skincare product line."
                        rows="4"
                    />

                    <label>Start Date</label>
                    <input
                        name="start_date"
                        type="date"
                        value={form.start_date}
                        onChange={handleChange}
                    />

                    <label>End Date</label>
                    <input
                        name="end_date"
                        type="date"
                        value={form.end_date}
                        onChange={handleChange}
                    />

                    <label>Status</label>
                    <select name="status" value={form.status} onChange={handleChange}>
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>

                    {error && <p className="error">{error}</p>}

                    <div className="form-actions">
                        <button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>

                        <Link to={`/campaigns/${id}`} className="secondary-link-button">
                            Cancel
                        </Link>
                    </div>
                </form>
            </section>
        </div>
    )
}

export default EditCampaign