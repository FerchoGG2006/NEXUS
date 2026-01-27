'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react'
import { useState, useMemo } from 'react'

interface Column<T> {
    key: keyof T | string
    header: string
    render?: (item: T) => React.ReactNode
    sortable?: boolean
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
    emptyMessage = 'No hay datos para mostrar',
    onRowClick,
}: DataTableProps<T>) {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [sortConfig, setSortConfig] = useState<{
        key: keyof T | string
        direction: 'asc' | 'desc'
    } | null>(null)

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

    const totalPages = Math.ceil(sortedData.length / pageSize)
    const paginatedData = sortedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    const handleSort = (key: keyof T | string) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                if (current.direction === 'asc') {
                    return { key, direction: 'desc' }
                }
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

    if (isLoading) {
        return (
            <div>
                <div className="skeleton" style={{ height: '48px', width: '280px', marginBottom: '24px' }} />
                <div className="table-wrapper">
                    <div style={{ padding: 'var(--space-6)' }}>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: '48px', marginBottom: '12px' }} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Search */}
            {searchable && (
                <div className="input-group" style={{ maxWidth: '320px', marginBottom: 'var(--space-6)' }}>
                    <div className="input-icon">
                        <Search />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="input input--with-icon"
                    />
                </div>
            )}

            {/* Table */}
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key.toString()}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                    style={{ cursor: column.sortable ? 'pointer' : 'default' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {column.header}
                                        {column.sortable && sortConfig?.key === column.key && (
                                            <span style={{ color: 'var(--color-primary-light)' }}>
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
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
                                <td
                                    colSpan={columns.length}
                                    style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, index) => (
                                <tr
                                    key={item.id || index}
                                    onClick={() => onRowClick?.(item)}
                                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key.toString()}>
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <p className="pagination-info">
                        Mostrando {(currentPage - 1) * pageSize + 1} a{' '}
                        {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length} resultados
                    </p>

                    <div className="pagination-controls">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                            aria-label="Primera página"
                        >
                            <ChevronsLeft style={{ width: '18px', height: '18px' }} />
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                            aria-label="Página anterior"
                        >
                            <ChevronLeft style={{ width: '18px', height: '18px' }} />
                        </button>

                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum: number
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (currentPage <= 3) {
                                pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = currentPage - 2 + i
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                            aria-label="Página siguiente"
                        >
                            <ChevronRight style={{ width: '18px', height: '18px' }} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                            aria-label="Última página"
                        >
                            <ChevronsRight style={{ width: '18px', height: '18px' }} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DataTable
