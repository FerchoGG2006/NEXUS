'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
    width?: string
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md', width }: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={`
                    relative w-full glass-panel rounded-2xl shadow-2xl transform transition-all animate-in zoom-in-95 duration-200
                    ${width ? '' : sizeClasses[size]} 
                `}
                style={width ? { maxWidth: width } : {}}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)]">
                    <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                        <span className="w-1 h-6 bg-[var(--neon-cyan)] rounded-full shadow-[0_0_10px_var(--neon-cyan)]"></span>
                        {title}
                    </h2>
                    <button
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-6 border-t border-[var(--glass-border)] bg-black/20 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Modal
