'use client'

interface BadgeProps {
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
    children: React.ReactNode
}

const badgeClasses = {
    primary: 'badge badge--primary',
    success: 'badge badge--success',
    warning: 'badge badge--warning',
    danger: 'badge badge--danger',
    info: 'badge badge--info',
}

export function Badge({ variant = 'primary', children }: BadgeProps) {
    return <span className={badgeClasses[variant]}>{children}</span>
}

export default Badge
