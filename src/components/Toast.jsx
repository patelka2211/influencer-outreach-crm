function Toast({ message, type = 'success' }) {
    if (!message) return null
    const background = type === 'success' ? '#3aab85' : '#2d2741'
    return (
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background,
            color: '#fff',
            borderRadius: 10,
            padding: '12px 18px',
            fontSize: 12,
            fontWeight: 600,
            zIndex: 9999,
            pointerEvents: 'none',
        }}>
            {message}
        </div>
    )
}

export default Toast
