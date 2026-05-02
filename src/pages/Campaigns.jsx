import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    createCampaign,
    deleteCampaign,
    getCampaigns,
    updateCampaignStatus,
} from '../services/campaignService'

function Campaigns() {
    const [campaigns, setCampaigns] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [modalOpen, setModalOpen] = useState(false)

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const [form, setForm] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'DRAFT',
    })

    async function loadCampaigns() {
        try {
            setLoading(true)
            setError('')
            const data = await getCampaigns()
            setCampaigns(data)
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not load campaigns.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCampaigns()
    }, [])

    useEffect(() => {
        if (!modalOpen) return
        function onKey(e) {
            if (e.key === 'Escape') closeModal()
        }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [modalOpen])

    function openModal() {
        setError('')
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setError('')
    }

    function handleChange(e) {
        const { name, value } = e.target
        setForm((current) => ({ ...current, [name]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            setSaving(true)
            setError('')
            await createCampaign(form)
            setForm({
                name: '',
                description: '',
                start_date: '',
                end_date: '',
                status: 'DRAFT',
            })
            closeModal()
            await loadCampaigns()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not create campaign.')
        } finally {
            setSaving(false)
        }
    }

    async function handleStatusChange(id, status) {
        try {
            setError('')
            await updateCampaignStatus(id, status)
            await loadCampaigns()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not update campaign status.')
        }
    }

    async function handleDelete(id) {
        const confirmed = window.confirm('Are you sure you want to delete this campaign?')
        if (!confirmed) return
        try {
            setError('')
            await deleteCampaign(id)
            await loadCampaigns()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not delete campaign.')
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return null
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const filteredCampaigns = campaigns.filter((campaign) => {
        const search = searchTerm.toLowerCase()
        const matchesSearch =
            campaign.name?.toLowerCase().includes(search) ||
            campaign.description?.toLowerCase().includes(search)
        const matchesStatus =
            statusFilter === 'ALL' || campaign.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <div>
            {modalOpen && (
                <div
                    className="modal-overlay"
                    onClick={(e) => e.target === e.currentTarget && closeModal()}
                >
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Create Campaign</h2>
                            <button className="modal-close" onClick={closeModal} aria-label="Close">
                                &times;
                            </button>
                        </div>

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
                                rows="3"
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

                            <button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Create Campaign'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="page-header dashboard-header">
                <div>
                    <h1>Campaign Management</h1>
                    <p className="muted">
                        Create and manage outreach campaigns for influencer collaborations.
                    </p>
                </div>
                <button className="primary-button" onClick={openModal}>
                    Create Campaign
                </button>
            </div>

            {error && !modalOpen && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

            <section className="card">
                <div className="section-header">
                    <div>
                        <h2>All Campaigns</h2>
                        <p className="muted">
                            {campaigns.length} campaign{campaigns.length === 1 ? '' : 's'} in the CRM.
                        </p>
                    </div>
                </div>

                <div className="filter-row">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by campaign name or description..."
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>

                {loading ? (
                    <p className="muted">Loading campaigns...</p>
                ) : campaigns.length === 0 ? (
                    <p className="muted">
                        No campaigns yet. Click <strong>Create Campaign</strong> to get started.
                    </p>
                ) : filteredCampaigns.length === 0 ? (
                    <p className="muted">No campaigns match your current search or filter.</p>
                ) : (
                    <div className="campaigns-grid">
                        {filteredCampaigns.map((campaign) => {
                            const startDate = formatDate(campaign.start_date)
                            const endDate = formatDate(campaign.end_date)

                            return (
                                <div key={campaign.id} className="campaign-grid-card">
                                    <div className="campaign-grid-card-title-row">
                                        <Link
                                            to={`/campaigns/${campaign.id}`}
                                            className="list-card-title"
                                        >
                                            {campaign.name}
                                        </Link>
                                        <span className={`status-pill status-pill--${campaign.status.toLowerCase()}`}>
                                            {campaign.status}
                                        </span>
                                    </div>
                                    <div className="campaign-grid-card-meta">
                                        {(startDate || endDate) && (
                                            <span>{startDate ?? '—'} → {endDate ?? '—'}</span>
                                        )}
                                        {campaign.description && (
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {campaign.description}
                                            </span>
                                        )}
                                    </div>
                                    <div className="campaign-grid-card-actions">
                                        <select
                                            className="list-card-status-select"
                                            value={campaign.status}
                                            onChange={(e) =>
                                                handleStatusChange(campaign.id, e.target.value)
                                            }
                                            aria-label="Update status"
                                        >
                                            <option value="DRAFT">Draft</option>
                                            <option value="ACTIVE">Active</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="ARCHIVED">Archived</option>
                                        </select>
                                        <Link
                                            to={`/campaigns/${campaign.id}/edit`}
                                            className="secondary-link-button compact-link-button"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            type="button"
                                            className="danger-button"
                                            onClick={() => handleDelete(campaign.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}

export default Campaigns
