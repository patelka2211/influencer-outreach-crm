function ConfirmDialog({ state, onConfirm, onCancel }) {
    if (!state.open) return null

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
            <div className="modal confirm-dialog">
                <div className="confirm-dialog-body">
                    {state.title && <h2 className="confirm-dialog-title">{state.title}</h2>}
                    <p className="confirm-dialog-message">{state.message}</p>
                </div>
                <div className="confirm-dialog-actions">
                    <button type="button" className="secondary-button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={state.danger ? 'danger-button' : 'primary-button'}
                        onClick={onConfirm}
                    >
                        {state.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDialog
