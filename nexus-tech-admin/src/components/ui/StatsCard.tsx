'use client'

import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'

interface StatsCardProps {
    title: string
    value: string | number
    subtitle?: string
    change?: {
        value: number
        label: string
    }
    icon?: LucideIcon
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
    isLoading?: boolean
}

const variantClasses = {
    default: {
        value: 'stats-card-value',
        icon: 'card-icon card-icon--primary'
    },
    success: {
        value: 'stats-card-value stats-card-value--success',
        icon: 'card-icon card-icon--success'
    },
    warning: {
        value: 'stats-card-value stats-card-value--warning',
        icon: 'card-icon card-icon--warning'
    },
    danger: {
        value: 'stats-card-value stats-card-value--danger',
        icon: 'card-icon card-icon--danger'
    },
    info: {
        value: 'stats-card-value stats-card-value--info',
        icon: 'card-icon card-icon--info'
    },
}

export function StatsCard({
    title,
    value,
    subtitle,
    change,
    icon: Icon,
    variant = 'default',
    isLoading = false,
}: StatsCardProps) {
    const formatValue = (val: string | number) => {
        if (typeof val === 'number') {
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
            }).format(val)
        }
        return val
    }

    const classes = variantClasses[variant]

    if (isLoading) {
        return (
            <div className="card stats-card">
                <div className="stats-card-content">
                    <div className="stats-card-info">
                        <div className="skeleton" style={{ height: '16px', width: '100px', marginBottom: '16px' }} />
                        <div className="skeleton" style={{ height: '36px', width: '140px', marginBottom: '8px' }} />
                        <div className="skeleton" style={{ height: '14px', width: '80px' }} />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <article className="card stats-card animate-fade-in">
            <div className="stats-card-content">
                <div className="stats-card-info">
                    <p className="stats-card-label">{title}</p>
                    <p className={classes.value}>{formatValue(value)}</p>
                    {subtitle && <p className="stats-card-subtitle">{subtitle}</p>}
                </div>
                {Icon && (
                    <div className={classes.icon}>
                        <Icon />
                    </div>
                )}
            </div>

            {change && (
                <div
                    className="stat-change"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '16px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: change.value >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                    }}
                >
                    {change.value >= 0 ? (
                        <TrendingUp style={{ width: '16px', height: '16px' }} />
                    ) : (
                        <TrendingDown style={{ width: '16px', height: '16px' }} />
                    )}
                    <span>{Math.abs(change.value)}%</span>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>{change.label}</span>
                </div>
            )}
        </article>
    )
}

export default StatsCard
