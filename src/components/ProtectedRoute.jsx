import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, allowedRoles }) {
    const { profile, loading } = useAuth()

    if (loading) {
        return null
    }

    if (!profile) {
        return <Navigate to="/login" replace />
    }

    if (allowedRoles && !allowedRoles.includes(profile.role)) {
        if (profile.role === 'ADMIN') {
            return <Navigate to="/admin" replace />
        }

        return <Navigate to="/dashboard" replace />
    }

    return children
}

export default ProtectedRoute