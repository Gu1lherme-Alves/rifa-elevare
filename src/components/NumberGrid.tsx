import { useState, useMemo } from 'react'
import { Search, Filter } from 'lucide-react'
import { RaffleNumber, FilterType } from '../types'
import { cn } from '../lib/utils'

interface NumberGridProps {
  numbers: RaffleNumber[]
  selectedNumbers: number[]
  onSelect: (num: number) => void
  onSell: () => void
  filter: FilterType
  setFilter: (filter: FilterType) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  isAuthenticated: boolean
  onNumberClick: (num: RaffleNumber) => void
}

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'available', label: 'Disponíveis' },
  { key: 'reserved', label: 'Reservados' },
  { key: 'sold', label: 'Vendidos' },
]

export function NumberGrid({
  numbers,
  selectedNumbers,
  onSelect,
  onSell,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  isAuthenticated,
  onNumberClick,
}: NumberGridProps) {
  const filteredNumbers = useMemo(() => {
    let result = [...numbers]

    if (filter !== 'all') {
      result = result.filter((n) => n.status === filter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim()
      result = result.filter((n) => String(n.number).includes(query))
    }

    return result.sort((a, b) => a.number - b.number)
  }, [numbers, filter, searchQuery])

  const handleNumberClick = (num: RaffleNumber) => {
    if (num.status === 'available' && isAuthenticated) {
      onSelect(num.number)
    } else if ((num.status === 'sold' || num.status === 'reserved') && isAuthenticated) {
      onNumberClick(num)
    }
  }

  const getNumberStyle = (num: RaffleNumber) => {
    const isSelected = selectedNumbers.includes(num.number)

    if (isSelected) {
      return 'bg-elevare-accent text-elevare-bg ring-2 ring-white ring-offset-2 ring-offset-elevare-bg scale-95'
    }

    switch (num.status) {
      case 'available':
        return 'bg-elevare-accent text-elevare-bg hover:bg-elevare-accent/80 hover:scale-105 cursor-pointer active:scale-95'
      case 'reserved':
        return 'bg-elevare-yellow text-elevare-bg hover:bg-elevare-yellow/80 cursor-pointer'
      case 'sold':
        return 'bg-gray-600 text-gray-400 line-through opacity-60 cursor-default'
      default:
        return ''
    }
  }

  const counts = useMemo(() => {
    const available = numbers.filter((n) => n.status === 'available').length
    const reserved = numbers.filter((n) => n.status === 'reserved').length
    const sold = numbers.filter((n) => n.status === 'sold').length
    return { all: numbers.length, available, reserved, sold }
  }, [numbers])

  const getFilterCount = (key: FilterType): number => {
    return counts[key]
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-elevare-text/40"
          />
          <input
            type="text"
            placeholder="Buscar número..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 focus:border-elevare-accent/50 transition-all text-sm"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={16} className="text-elevare-text/40 shrink-0" />
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer',
                filter === opt.key
                  ? 'bg-elevare-accent text-elevare-bg'
                  : 'bg-elevare-secondary/50 text-elevare-text/60 hover:bg-elevare-secondary hover:text-elevare-text'
              )}
            >
              {opt.label}
              <span className="ml-1 opacity-70">({getFilterCount(opt.key)})</span>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-elevare-text/50">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-elevare-accent" />
            Disponível
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-elevare-yellow" />
            Reservado
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-600 opacity-60" />
            Vendido
          </div>
        </div>
      </div>

      {/* Number Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {filteredNumbers.map((num) => (
          <button
            key={num.number}
            onClick={() => handleNumberClick(num)}
            disabled={num.status === 'sold' && !isAuthenticated}
            className={cn(
              'min-w-12 min-h-12 flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-150 select-none',
              getNumberStyle(num)
            )}
          >
            {String(num.number).padStart(3, '0')}
          </button>
        ))}
      </div>

      {filteredNumbers.length === 0 && (
        <div className="text-center py-12 text-elevare-text/40">
          <p className="text-sm">Nenhum número encontrado</p>
        </div>
      )}

      {/* Selection Bottom Bar */}
      {selectedNumbers.length > 0 && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-50">
          <div className="bg-elevare-card border border-elevare-accent/30 rounded-2xl p-4 shadow-2xl shadow-black/40 backdrop-blur-md flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-elevare-text">
                {selectedNumbers.length} número{selectedNumbers.length !== 1 ? 's' : ''}{' '}
                selecionado{selectedNumbers.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-elevare-text/50">
                {selectedNumbers.sort((a, b) => a - b).map((n) => String(n).padStart(3, '0')).join(', ')}
              </p>
            </div>
            <button
              onClick={onSell}
              className="px-5 py-2.5 bg-elevare-accent text-elevare-bg font-bold rounded-xl text-sm hover:bg-elevare-accent/90 active:scale-95 transition-all duration-150 whitespace-nowrap cursor-pointer"
            >
              Reservar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
