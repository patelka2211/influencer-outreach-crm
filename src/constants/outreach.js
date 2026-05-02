export const STATUS_ORDER = ['CONTACTED', 'REPLIED', 'SHIPPED', 'POSTED']

export const NEXT_STATUS = {
    CONTACTED: 'REPLIED',
    REPLIED: 'SHIPPED',
    SHIPPED: 'POSTED',
    POSTED: null,
}

// Allowed forward transitions — used for defensive validation
export const VALID_TRANSITIONS = {
    CONTACTED: 'REPLIED',
    REPLIED: 'SHIPPED',
    SHIPPED: 'POSTED',
}

export const REPLIED_STALE_DAYS = 3
