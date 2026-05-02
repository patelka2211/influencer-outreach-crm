import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    createInfluencer,
    deleteInfluencer,
    getInfluencers,
} from '../services/influencerService'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import { useConfirm } from '../hooks/useConfirm'
import { useToast } from '../hooks/useToast'

function Influencers() {
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
    const { toast, showToast } = useToast()
    const [influencers, setInfluencers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [modalOpen, setModalOpen] = useState(false)

    const [searchTerm, setSearchTerm] = useState('')
    const [platformFilter, setPlatformFilter] = useState('ALL')
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 10

    const [form, setForm] = useState({
        name: '',
        platform: 'INSTAGRAM',
        handle: '',
        email: '',
        follower_count: '',
        niche: '',
        contact_details: '',
    })

    async function loadInfluencers() {
        try {
            setLoading(true)
            setError('')
            const data = await getInfluencers()
            setInfluencers(data)
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not load influencers.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadInfluencers()
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
            await createInfluencer({
                ...form,
                follower_count: Number(form.follower_count),
            })
            setForm({
                name: '',
                platform: 'INSTAGRAM',
                handle: '',
                email: '',
                follower_count: '',
                niche: '',
                contact_details: '',
            })
            closeModal()
            await loadInfluencers()
            showToast('Influencer added')
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not save influencer.')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id) {
        const ok = await confirm({
            title: 'Delete influencer',
            message: 'Are you sure you want to delete this influencer? This will also remove any outreach records associated with them.',
            danger: true,
            confirmLabel: 'Delete',
        })
        if (!ok) return
        try {
            setError('')
            await deleteInfluencer(id)
            await loadInfluencers()
            showToast('Influencer deleted')
        } catch (err) {
            console.error(err)
            setError(err.message || 'Could not delete influencer.')
        }
    }

    const filteredInfluencers = influencers.filter((influencer) => {
        const search = searchTerm.toLowerCase()
        const matchesSearch =
            influencer.name?.toLowerCase().includes(search) ||
            influencer.handle?.toLowerCase().includes(search) ||
            influencer.niche?.toLowerCase().includes(search) ||
            influencer.email?.toLowerCase().includes(search)
        const matchesPlatform =
            platformFilter === 'ALL' || influencer.platform === platformFilter
        return matchesSearch && matchesPlatform
    })

    const totalPages = Math.ceil(filteredInfluencers.length / PAGE_SIZE)
    const paginatedInfluencers = filteredInfluencers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    )

    function handlePageChange(page) {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function handleSearchChange(e) {
        setSearchTerm(e.target.value)
        setCurrentPage(1)
    }

    function handlePlatformChange(e) {
        setPlatformFilter(e.target.value)
        setCurrentPage(1)
    }

    function exportInfluencersCSV() {
        if (filteredInfluencers.length === 0) {
            setError('There are no influencers to export.')
            return
        }

        const headers = [
            'Name',
            'Platform',
            'Handle',
            'Email',
            'Follower Count',
            'Niche',
            'Contact Details',
        ]

        const rows = filteredInfluencers.map((influencer) => [
            influencer.name || '',
            influencer.platform || '',
            influencer.handle || '',
            influencer.email || '',
            influencer.follower_count || '',
            influencer.niche || '',
            influencer.contact_details || '',
        ])

        const csvContent = [
            headers,
            ...rows,
        ]
            .map((row) =>
                row
                    .map((value) => {
                        const stringValue = String(value).replace(/"/g, '""')
                        return `"${stringValue}"`
                    })
                    .join(',')
            )
            .join('\n')

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.setAttribute('download', 'influencers-export.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)
    }

    return (
        <div>
            <Toast message={toast.message} type={toast.type} />
            <ConfirmDialog state={confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
            {modalOpen && (
                <div
                    className="modal-overlay"
                    onClick={(e) => e.target === e.currentTarget && closeModal()}
                >
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Add Influencer</h2>
                            <button className="modal-close" onClick={closeModal} aria-label="Close">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="form">
                            <label>Name</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Sophie Lane"
                                required
                            />

                            <label>Platform</label>
                            <select
                                name="platform"
                                value={form.platform}
                                onChange={handleChange}
                                required
                            >
                                <option value="INSTAGRAM">Instagram</option>
                                <option value="YOUTUBE">YouTube</option>
                                <option value="TIKTOK">TikTok</option>
                                <option value="TWITTER">Twitter/X</option>
                                <option value="LINKEDIN">LinkedIn</option>
                                <option value="OTHER">Other</option>
                            </select>

                            <label>Handle</label>
                            <input
                                name="handle"
                                value={form.handle}
                                onChange={handleChange}
                                placeholder="@sophielane"
                                required
                            />

                            <label>Email</label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="sophie@example.com"
                            />

                            <label>Follower Count</label>
                            <input
                                name="follower_count"
                                type="number"
                                value={form.follower_count}
                                onChange={handleChange}
                                placeholder="85000"
                                required
                            />

                            <label>Niche</label>
                            <input
                                name="niche"
                                value={form.niche}
                                onChange={handleChange}
                                placeholder="Beauty, skincare, lifestyle"
                            />

                            <label>Contact Details</label>
                            <textarea
                                name="contact_details"
                                value={form.contact_details}
                                onChange={handleChange}
                                placeholder="Prefers email outreach."
                                rows="3"
                            />

                            {error && <p className="error">{error}</p>}

                            <button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Add Influencer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="page-header dashboard-header">
                <div>
                    <h1>Influencer Management</h1>
                    <p className="muted">
                        Add, view, search, and manage influencer profiles for outreach campaigns.
                    </p>
                </div>
                <button className="primary-button" onClick={openModal}>
                    Add Influencer
                </button>
            </div>

            {error && !modalOpen && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

            <section className="card">
                <div className="section-header">
                    <div>
                        <h2>All Influencers</h2>
                        <p className="muted">
                            {filteredInfluencers.length} shown out of {influencers.length} total influencer{influencers.length === 1 ? '' : 's'} in the CRM.
                            {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="secondary-action-button"
                        onClick={exportInfluencersCSV}
                        disabled={filteredInfluencers.length === 0}
                    >
                        Export CSV
                    </button>
                </div>

                <div className="filter-row">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search by name, handle, niche, or email..."
                    />
                    <select
                        value={platformFilter}
                        onChange={handlePlatformChange}
                    >
                        <option value="ALL">All Platforms</option>
                        <option value="INSTAGRAM">Instagram</option>
                        <option value="YOUTUBE">YouTube</option>
                        <option value="TIKTOK">TikTok</option>
                        <option value="TWITTER">Twitter/X</option>
                        <option value="LINKEDIN">LinkedIn</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                {loading ? (
                    <div className="list-rows">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="list-card">
                                <div className="list-card-info">
                                    <div className="skeleton" style={{ width: 140, height: 13, marginBottom: 6 }} />
                                    <div className="list-card-meta">
                                        <div className="skeleton" style={{ width: 66, height: 18, borderRadius: 20 }} />
                                        <div className="skeleton" style={{ width: 90, height: 18 }} />
                                        <div className="skeleton" style={{ width: 110, height: 18 }} />
                                    </div>
                                </div>
                                <div className="list-card-actions">
                                    <div className="skeleton" style={{ width: 44, height: 28, borderRadius: 10 }} />
                                    <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 20 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : influencers.length === 0 ? (
                    <p className="muted">
                        No influencers yet. Click <strong>Add Influencer</strong> to get started.
                    </p>
                ) : filteredInfluencers.length === 0 ? (
                    <p className="muted">No influencers match your current search or filter.</p>
                ) : (
                    <div className="list-rows">
                        {paginatedInfluencers.map((influencer) => (
                            <div key={influencer.id} className="list-card">
                                <div className="list-card-info">
                                    <Link
                                        to={`/influencers/${influencer.id}`}
                                        className="list-card-title"
                                    >
                                        {influencer.name}
                                    </Link>
                                    <div className="list-card-meta">
                                        <span
                                            className={`platform-badge ${influencer.platform?.toLowerCase()}`}
                                        >
                                            {influencer.platform}
                                        </span>
                                        {influencer.handle && <span>{influencer.handle}</span>}
                                        {influencer.follower_count > 0 && (
                                            <span>{influencer.follower_count.toLocaleString()} followers</span>
                                        )}
                                        {influencer.niche && <span>{influencer.niche}</span>}
                                    </div>
                                </div>
                                <div className="list-card-actions">
                                    <Link
                                        to={`/influencers/${influencer.id}/edit`}
                                        className="secondary-link-button compact-link-button"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        className="danger-button"
                                        onClick={() => handleDelete(influencer.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            ← Prev
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                className={`pagination-btn${currentPage === i + 1 ? ' pagination-btn--active' : ''}`}
                                onClick={() => handlePageChange(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Influencers
