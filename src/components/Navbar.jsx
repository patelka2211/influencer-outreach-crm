import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
    const navigate = useNavigate()
    const { profile, loading, logout } = useAuth()

    async function handleLogout() {
        try {
            await logout()
            navigate('/login')
        } catch (err) {
            console.error(err)
        }
    }

    if (loading || !profile) return null

    const initials = profile.name
        ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U'

    return (
        <aside className="sidebar">
            <div className="sidebar-top">
                <div className="sidebar-logo">Influencer CRM</div>

                <nav className="sidebar-nav">
                    {profile.role === 'BRAND_MANAGER' && (
                        <>
                            <span className="sidebar-nav-label">Main Menu</span>
                            <NavLink to="/dashboard" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
                                Dashboard
                            </NavLink>
                            <NavLink to="/influencers" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
                                Influencers
                            </NavLink>
                            <NavLink to="/campaigns" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
                                Campaigns
                            </NavLink>
                            <NavLink to="/pipeline" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
                                Pipeline
                            </NavLink>
                        </>
                    )}

                    {profile.role === 'ADMIN' && (
                        <>
                            <span className="sidebar-nav-label">Admin</span>
                            <NavLink to="/admin" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
                                Admin Dashboard
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{profile.name || 'User'}</span>
                        <span className="sidebar-user-role">
                            {profile.role === 'ADMIN' ? 'Admin' : 'Brand Manager'}
                        </span>
                    </div>
                </div>
                <button className="sidebar-logout-link" onClick={handleLogout}>Logout</button>
            </div>
        </aside>
    )
}

export default Navbar
