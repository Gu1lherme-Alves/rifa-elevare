import { useMemo } from 'react'
import { Search, Filter, ShoppingBag } from 'lucide-react'
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
      if (!isAuthenticated && filter === 'sold') {
        // Para visitantes públicos, o filtro "sold" engloba tanto vendidos quanto reservados
        result = result.filter((n) => n.status === 'sold' || n.status === 'reserved')
      } else {
        result = result.filter((n) => n.status === filter)
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim()
      result = result.filter((n) => String(n.number).includes(query))
    }

    return result.sort((a, b) => a.number - b.number)
  }, [numbers, filter, searchQuery, isAuthenticated])

  const handleNumberClick = (num: RaffleNumber) => {
    if (num.status === 'available') {
      onSelect(num.number)
    } else if ((num.status === 'sold' || num.status === 'reserved') && isAuthenticated) {
      onNumberClick(num)
    }
  }

  const getNumberStyle = (num: RaffleNumber) => {
    const isSelected = selectedNumbers.includes(num.number)

    if (isSelected) {
      return 'bg-elevare-accent text-elevare-bg ring-4 ring-white ring-offset-2 ring-offset-elevare-bg scale-105 shadow-lg shadow-elevare-accent/40 font-extrabold'
    }

    if (num.status === 'available') {
      return 'bg-elevare-accent text-elevare-bg hover:bg-elevare-accent/80 hover:scale-105 cursor-pointer active:scale-95 shadow-sm'
    }

    // Para usuários não autenticados (público), reservados parecem vendidos para não haver confusão
    if (!isAuthenticated) {
      return 'bg-zinc-800/80 text-zinc-500 line-through opacity-45 cursor-not-allowed select-none'
    }

    // Para administradores:
    if (num.status === 'reserved') {
      return 'bg-elevare-yellow text-elevare-bg hover:bg-elevare-yellow/80 cursor-pointer font-bold animate-pulse'
    }

    // Vendido confirmado
    return 'bg-zinc-800 text-zinc-500 line-through opacity-50 cursor-pointer'
  }

  const counts = useMemo(() => {
    const available = numbers.filter((n) => n.status === 'available').length
    const reserved = numbers.filter((n) => n.status === 'reserved').length
    const sold = numbers.filter((n) => n.status === 'sold').length
    return {
      all: numbers.length,
      available,
      reserved,
      sold,
      takenPublic: sold + reserved,
    }
  }, [numbers])

  const filterOptions = isAuthenticated
    ? [
        { key: 'all' as FilterType, label: 'Todos', count: counts.all },
        { key: 'available' as FilterType, label: 'Disponíveis', count: counts.available },
        { key: 'reserved' as FilterType, label: 'Aguardando Aprovação', count: counts.reserved },
        { key: 'sold' as FilterType, label: 'Vendidos', count: counts.sold },
      ]
    : [
        { key: 'all' as FilterType, label: 'Todos', count: counts.all },
        { key: 'available' as FilterType, label: 'Disponíveis', count: counts.available },
        { key: 'sold' as FilterType, label: 'Já Escolhidos', count: counts.takenPublic },
      ]

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-elevare-text/40"
          />
          <input
            type="text"
            placeholder={
              isAuthenticated
                ? 'Buscar por número...'
                : 'Procurar seu número da sorte (ex: 7, 23, 77)...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 focus:border-elevare-accent/50 transition-all text-sm"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter size={16} className="text-elevare-text/40 shrink-0 hidden sm:block" />
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer',
                filter === opt.key
                  ? 'bg-elevare-accent text-elevare-bg shadow-sm'
                  : 'bg-elevare-secondary/50 text-elevare-text/60 hover:bg-elevare-secondary hover:text-elevare-text'
              )}
            >
              {opt.label}
              <span className="ml-1 opacity-70">({opt.count})</span>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-elevare-text/60 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-elevare-accent shadow-sm" />
            <span>Disponível (toque para escolher)</span>
          </div>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-elevare-yellow" />
                <span>Aguardando autorização</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-zinc-800" />
                <span>Vendido e Pago</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-zinc-800 opacity-60" />
              <span>Já escolhido</span>
            </div>
          )}
        </div>
      </div>

      {/* Number Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-2.5">
        {filteredNumbers.map((num) => {
          const isTaken = num.status !== 'available'
          return (
            <button
              key={num.number}
              onClick={() => handleNumberClick(num)}
              disabled={isTaken && !isAuthenticated}
              aria-label={`Número ${num.number} - ${num.status}`}
              className={cn(
                'min-w-11 min-h-11 sm:min-w-12 sm:min-h-12 flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-150 select-none cursor-pointer',
                getNumberStyle(num)
              )}
            >
              {String(num.number).padStart(3, '0')}
            </button>
          )
        })}
      </div>

      {filteredNumbers.length === 0 && (
        <div className="text-center py-12 text-elevare-text/40">
          <p className="text-sm">Nenhum número encontrado para essa busca</p>
        </div>
      )}

      {/* Floating Action Bottom Bar when numbers are selected */}
      {selectedNumbers.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-elevare-card/95 border-2 border-elevare-accent rounded-2xl p-4 shadow-2xl shadow-black/80 backdrop-blur-md flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-elevare-text truncate">
                {selectedNumbers.length} {selectedNumbers.length === 1 ? 'número' : 'números'}{' '}
                (R$ {selectedNumbers.length * 10},00)
              </p>
              <p className="text-xs text-elevare-accent/90 truncate font-mono">
                {selectedNumbers
                  .sort((a, b) => a - b)
                  .map((n) => String(n).padStart(3, '0'))
                  .join(', ')}
              </p>
            </div>
            <button
              onClick={onSell}
              className="flex items-center gap-2 px-5 py-3 bg-elevare-accent text-elevare-bg font-extrabold rounded-xl text-sm hover:bg-elevare-accent/90 active:scale-95 transition-all duration-150 whitespace-nowrap cursor-pointer shadow-lg shadow-elevare-accent/30"
            >
              <ShoppingBag size={18} />
              <span>{isAuthenticated ? 'Vender / Reservar' : 'Garantir Números 🍀'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
