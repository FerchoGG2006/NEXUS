'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Inbox, Loader2 } from 'lucide-react'
import { useState, useMemo } from 'react'

interface Column<T> {
    key: keyof T | string
    header: string
    render?: (item: T) => React.ReactNode
    sortable?: boolean
    className?: string
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    searchable?: boolean
    searchKeys?: (keyof T)[]
    pageSize?: number
    isLoading?: boolean
    emptyMessage?: string
    onRowClick?: (item: T) => void
}

export function DataTable<T extends { id?: string }>({
    data,
    columns,
    searchable = true,
    searchKeys = [],
    pageSize = 10,
    isLoading = false,
    emptyMessage = 'No hay datos disponibles',
    onRowClick,
}: DataTableProps<T>) {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [sortConfig, setSortConfig] = useState<{
        key: keyof T | string
        direction: 'asc' | 'desc'
    } | null>(null)

    // Filter Logic
    const filteredData = useMemo(() => {
        if (!search || searchKeys.length === 0) return data

        return data.filter((item) =>
            searchKeys.some((key) => {
                const value = item[key]
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(search.toLowerCase())
                }
                if (typeof value === 'number') {
                    return value.toString().includes(search)
                }
                return false
            })
        )
    }, [data, search, searchKeys])

    // Sort Logic
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key as keyof T]
            const bValue = b[sortConfig.key as keyof T]

            if (aValue === null || aValue === undefined) return 1
            if (bValue === null || bValue === undefined) return -1

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
    }, [filteredData, sortConfig])

    // Pagination Logic
    const totalPages = Math.ceil(sortedData.length / pageSize)
    const paginatedData = sortedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    const handleSort = (key: keyof T | string) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                if (current.direction === 'asc') return { key, direction: 'desc' }
                return null
            }
            return { key, direction: 'asc' }
        })
    }

    const getNestedValue = (obj: T, path: string): unknown => {
        return path.split('.').reduce((acc: unknown, part) => {
            if (acc && typeof acc === 'object') {
                return (acc as Record<string, unknown>)[part]
            }
            return undefined
        }, obj)
    }

    return (
        <div className="space-y-4">
            {/* Header / Search */}
            {searchable && (
                <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[var(--neon-cyan)] transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar en la base de datos..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="bg-gray-900/50 border border-white/5 text-gray-200 text-sm rounded-lg focus:ring-[var(--neon-cyan)] focus:border-[var(--neon-cyan)] block w-full pl-10 p-2.5 transition-all outline-none placeholder-gray-600"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="table-glass-wrapper">
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-500 space-y-3">
                        <Loader2 className="animate-spin text-[var(--neon-purple)]" size={40} />
                        <span className="text-sm font-medium animate-pulse">Sincronizando datos...</span>
                    </div>
                ) : (
                    <table className="table-glass">
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column.key.toString()}
                                        onClick={() => column.sortable && handleSort(column.key)}
                                        className={`${column.sortable ? 'cursor-pointer hover:text-white group' : ''} ${column.className || ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {column.header}
                                            {column.sortable && sortConfig?.key === column.key && (
                                                <span className={`text-[var(--neon-cyan)] text-[10px] transform transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`}>
                                                    ▲
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length}>
                                        <div className="p-12 flex flex-col items-center justify-center text-gray-500 space-y-2 opacity-60">
                                            <Inbox size={48} strokeWidth={1} />
                                            <p className="text-sm font-medium">{emptyMessage}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => (
                                    <tr
                                        key={item.id || index}
                                        onClick={() => onRowClick?.(item)}
                                        className={onRowClick ? 'cursor-pointer hover:bg-white/5' : ''}
                                    >
                                        {columns.map((column) => (
                                            <td key={column.key.toString()} className={column.className}>
                                                {column.render
                                                    ? column.render(item)
                                                    : String(getNestedValue(item, column.key as string) ?? '-')}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-gray-500 font-mono">
                        {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sortedData.length)} / {sortedData.length}
                    </p>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex items-center gap-1 px-2">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum = i + 1
                                if (totalPages > 5) {
                                    if (currentPage > 3 && currentPage < totalPages - 2) pageNum = currentPage - 2 + i
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum
                                                ? 'bg-[var(--neon-cyan)] text-black shadow-[0_0_10px_var(--neon-cyan-glow)]'
                                                : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DataTable
