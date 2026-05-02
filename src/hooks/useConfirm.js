import { useState, useCallback } from 'react'

export function useConfirm() {
    const [state, setState] = useState({
        open: false,
        title: '',
        message: '',
        danger: false,
        confirmLabel: 'Confirm',
        resolve: null,
    })

    const confirm = useCallback(({ title, message, danger = false, confirmLabel = 'Confirm' }) => {
        return new Promise((resolve) => {
            setState({ open: true, title, message, danger, confirmLabel, resolve })
        })
    }, [])

    function handleConfirm() {
        state.resolve(true)
        setState(s => ({ ...s, open: false }))
    }

    function handleCancel() {
        state.resolve(false)
        setState(s => ({ ...s, open: false }))
    }

    return { confirm, confirmState: state, handleConfirm, handleCancel }
}
