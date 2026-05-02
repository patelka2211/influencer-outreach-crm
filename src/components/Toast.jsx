function Toast({ message }) {
    if (!message) return null
    return (
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: '#2d2741',
            color: '#fff',
            borderRadius: 10,
            padding: '12px 18px',
            fontSize: 12,
            zIndex: 9999,
            pointerEvents: 'none',
        }}>
            {message}
        </div>
    )
}

export default Toast
