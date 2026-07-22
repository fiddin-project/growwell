import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner'

export default function DataTable({ columns, data, searchable = true, pageSize = 10, actions, emptyMessage, headerLeft, headerRight, emptyIcon: EmptyIcon, serverMode = false, loading = false, rowKey = 'id' }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)

  useEffect(() => {
    // Reset pagination when the backing dataset is replaced.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(0)
  }, [data])

  const filtered = useMemo(() => {
    if (serverMode) return data
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        if (!col.accessor) return false
        const val = row[col.accessor]
        return String(val).toLowerCase().includes(q)
      })
    )
  }, [data, search, columns, serverMode])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? ''
      const bVal = b[sortKey] ?? ''
      const aNum = Number(aVal)
      const bNum = Number(bVal)
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum
      }
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      if (aStr < bStr) return sortDir === 'asc' ? -1 : 1
      if (aStr > bStr) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = serverMode ? 1 : Math.ceil(sorted.length / pageSize)
  const paged = serverMode ? sorted : sorted.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const from = serverMode ? 1 : page * pageSize + 1
  const to = serverMode ? sorted.length : Math.min((page + 1) * pageSize, sorted.length)

  const showToolbar = (searchable && !serverMode) || headerLeft || headerRight

  return (
    <>
      {showToolbar && (
        <div className="bg-surface-container-lowest rounded-xl p-4 mb-gutter shadow-[0_1px_3px_rgba(0,67,73,0.04),0_4px_12px_rgba(0,67,73,0.03)] border border-[rgba(0,67,73,0.08)] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            {headerLeft}
            {searchable && !serverMode && (
              <div className="w-full md:w-96 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="search"
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg pl-12 pr-10 py-2.5 text-body-sm font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
                  placeholder={t('search')}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                  aria-label={t('search')}
                />
                {search && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
                    onClick={() => { setSearch(''); setPage(0) }}
                    aria-label={t('clear_search')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
          {headerRight && (
            <div className="w-full md:w-auto">{headerRight}</div>
          )}
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,67,73,0.04),0_4px_12px_rgba(0,67,73,0.03)] border border-[rgba(0,67,73,0.08)] overflow-hidden relative" aria-busy={loading || undefined}>
        {loading && (
          <div className="absolute inset-0 bg-canvas/60 z-10 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                {columns.map((col) => {
                  const isSortable = col.sortable !== false && col.accessor
                  return (
                    <th
                      key={col.accessor || col.header}
                      className={`px-6 py-4 font-label-md text-label-md text-on-surface-variant ${isSortable ? 'cursor-pointer select-none' : ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                      tabIndex={isSortable ? 0 : undefined}
                      aria-sort={isSortable && sortKey === col.accessor ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                      onClick={() => isSortable && handleSort(col.accessor)}
                      onKeyDown={(e) => {
                        if (isSortable && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          handleSort(col.accessor)
                        }
                      }}
                    >
                      <span className="flex items-center gap-1">
                        {col.header}
                        {isSortable && sortKey === col.accessor && (
                          sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </span>
                    </th>
                  )
                })}
                {actions && (
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant text-center">{t('actions')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      {EmptyIcon && (
                        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                          <EmptyIcon size={32} className="text-on-surface-variant/50" />
                        </div>
                      )}
                      <p className="font-label-md text-label-md text-on-surface mb-1">{emptyMessage || t('no_data')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((row, i) => (
                  <tr key={row[rowKey] ?? row.id ?? i} className="hover:bg-primary/5 transition-colors">
                    {columns.map((col) => (
                      <td key={col.accessor || col.header} className={`px-6 py-4 font-body-sm text-body-sm text-on-surface ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}>
                        {col.render ? col.render(row, serverMode ? i : page * pageSize + i) : row[col.accessor]}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-center font-body-sm text-body-sm">
                        <div className="flex items-center justify-center gap-2">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!serverMode && totalPages > 0 && paged.length > 0 && (
          <div className="bg-surface-container-lowest px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page <= 0}
                className="relative inline-flex items-center px-4 py-3 border border-outline-variant/50 text-body-sm font-body-sm rounded-md text-on-surface bg-surface-container-lowest hover:bg-surface-container-low disabled:opacity-50"
              >
                {t('prev_page')}
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="relative inline-flex items-center px-4 py-3 border border-outline-variant/50 text-body-sm font-body-sm rounded-md text-on-surface bg-surface-container-lowest hover:bg-surface-container-low disabled:opacity-50"
              >
                {t('next_page')}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('pagination_showing', { from, to, total: sorted.length })}
                </p>
              </div>
              <div>
                <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page <= 0}
                    className="relative inline-flex items-center px-2 py-3 rounded-l-md border border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
                  >
                    <span className="sr-only">{t('prev_page')}</span>
                    <ChevronLeft size={20} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={i === page
                        ? "z-10 bg-gradient-to-br from-primary to-primary-focus border-transparent text-on-primary font-bold relative inline-flex items-center px-4 py-3 border text-body-sm"
                        : "bg-surface-container-lowest border-outline-variant/50 text-on-surface hover:bg-surface-container-low relative inline-flex items-center px-4 py-3 border text-body-sm font-body-sm"
                      }
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="relative inline-flex items-center px-2 py-3 rounded-r-md border border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
                  >
                    <span className="sr-only">{t('next_page')}</span>
                    <ChevronRight size={20} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
