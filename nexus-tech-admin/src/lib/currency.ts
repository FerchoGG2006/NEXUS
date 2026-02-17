export const formatPrice = (amount: number, currency: 'COP' | 'USD' = 'COP') => {
    if (currency === 'COP') {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    } else {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}

export const COP_EXCHANGE_RATE = 4100; // Tasa de cambio aproximada para conversiones (si es necesario)
