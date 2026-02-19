'use client'

import { formatPrice } from '@/lib/currency'
import { TrendingUp, TrendingDown, LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'

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

const variantStyles = {
    default: {
        gradient: 'from-indigo-500/20 to-purple-500/5',
        border: 'border-indigo-500/20',
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-400',
        valueColor: 'text-white'
    },
    success: {
        gradient: 'from-emerald-500/20 to-teal-500/5',
        border: 'border-emerald-500/20',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        valueColor: 'text-white'
    },
    warning: {
        gradient: 'from-amber-500/20 to-orange-500/5',
        border: 'border-amber-500/20',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        valueColor: 'text-white'
    },
    danger: {
        gradient: 'from-red-500/20 to-rose-500/5',
        border: 'border-red-500/20',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
        valueColor: 'text-white'
    },
    info: {
        gradient: 'from-cyan-500/20 to-blue-500/5',
        border: 'border-cyan-500/20',
        iconBg: 'bg-cyan-500/20',
        iconColor: 'text-cyan-400',
        valueColor: 'text-white'
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
    const styles = variantStyles[variant]

    const formattedValue = typeof value === 'number' ? formatPrice(value, 'COP') : value

    if (isLoading) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 p-6 h-[140px]">
                <div className="animate-pulse space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="h-4 w-24 bg-white/10 rounded" />
                        <div className="h-10 w-10 bg-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-8 w-32 bg-white/10 rounded" />
                        <div className="h-3 w-16 bg-white/10 rounded" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`group relative overflow-hidden rounded-2xl bg-[#0a0a0a] border ${styles.border} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-${styles.iconColor}/10`}>
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Glow Effect */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${styles.iconColor.split('-')[1]}-500/20 blur-[50px] rounded-full pointer-events-none`} />

            <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-400 tracking-wide uppercase">{title}</p>
                        <h3 className={`text-2xl font-black mt-1 tracking-tight ${styles.valueColor}`}>
                            {formattedValue}
                        </h3>
                    </div>

                    {change && (
                        <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${change.value >= 0
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                {change.value >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {Math.abs(change.value)}%
                            </div>
                            <span className="text-xs text-gray-500">{change.label}</span>
                        </div>
                    )}

                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                </div>

                {Icon && (
                    <div className={`p-3 rounded-xl ${styles.iconBg} ${styles.iconColor} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={24} strokeWidth={2} />
                    </div>
                )}
            </div>

            {/* Bottom highlight line */}
            <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${styles.gradient} opacity-50`} />
        </div>
    )
}

export default StatsCard

