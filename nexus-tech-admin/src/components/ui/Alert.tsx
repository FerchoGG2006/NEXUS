'use client'

import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

interface AlertProps {
    type?: 'info' | 'success' | 'warning' | 'danger'
    title?: string
    message: string
    onClose?: () => void
}

const alertConfig = {
    info: { icon: Info, className: 'alert alert--info' },
    success: { icon: CheckCircle, className: 'alert alert--success' },
    warning: { icon: AlertTriangle, className: 'alert alert--warning' },
    danger: { icon: AlertCircle, className: 'alert alert--danger' },
}

export function Alert({ type = 'info', title, message, onClose }: AlertProps) {
    const config = alertConfig[type]
    const Icon = config.icon

    return (
        <div className={config.className}>
            <Icon className="alert-icon" />
            <div className="alert-content">
                {title && <div className="alert-title">{title}</div>}
                <div className="alert-message">{message}</div>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="btn btn--ghost btn--icon"
                    style={{ marginLeft: 'auto', flexShrink: 0 }}
                    aria-label="Cerrar"
                >
                    <X style={{ width: '18px', height: '18px' }} />
                </button>
            )}
        </div>
    )
}

export default Alert
