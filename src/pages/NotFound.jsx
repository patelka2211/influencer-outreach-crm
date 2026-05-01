import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="card">
      <h1>Page Not Found</h1>
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to="/dashboard" className="primary-link-button">
        Go to Dashboard
      </Link>
    </div>
  )
}

export default NotFound