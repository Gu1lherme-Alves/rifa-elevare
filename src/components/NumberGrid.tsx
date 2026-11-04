import { useMemo } from 'react'
import { Search, Filter, ShoppingBag, Sparkles } from 'lucide-react'
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
      return 'bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-zinc-950 ring-4 ring-white ring-offset-2 ring-offset-[#0F2A1A] scale-110 font-black shadow-xl shadow-amber-400/40 z-10'
    }

    if (num.status === 'available') {
      return 'bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-lime-300 hover:to-emerald-400 text-zinc-950 font-extrabold hover:scale-105 active:scale-95 shadow-md shadow-emerald-950/40 cursor-pointer'
    }

    // Para usuários públicos, números reservados ou vendidos aparecem como indisponíveis
    if (!isAuthenticated) {
      return 'bg-zinc-900/80 text-zinc-600 line-through opacity-35 cursor-not-allowed select-none border border-zinc-800/40'
    }

    // Para o Administrador:
    if (num.status === 'reserved') {
      return 'bg-amber-400 text-zinc-950 hover:bg-amber-300 cursor-pointer font-extrabold shadow-md shadow-amber-950/40 animate-pulse'
    }

    return 'bg-zinc-900 text-zinc-600 line-through opacity-40 cursor-pointer border border-zinc-800/40'
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

  // Para o público: SEM quantidades de números nas abas
  const filterOptions = isAuthenticated
    ? [
        { key: 'all' as FilterType, label: 'Todos', count: counts.all },
        { key: 'available' as FilterType, label: 'Disponíveis', count: counts.available },
        { key: 'reserved' as FilterType, label: 'Aguardando Aprovação', count: counts.reserved },
        { key: 'sold' as FilterType, label: 'Vendidos', count: counts.sold },
      ]
    : [
        { key: 'all' as FilterType, label: 'Todos', count: undefined },
        { key: 'available' as FilterType, label: 'Disponíveis', count: undefined },
        { key: 'sold' as FilterType, label: 'Já Escolhidos', count: undefined },
      ]

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400/60"
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
            className="w-full pl-10 pr-4 py-3 bg-[#0c1f13] border border-emerald-500/20 focus:border-emerald-400/60 rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all text-sm shadow-inner"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter size={16} className="text-emerald-400/50 shrink-0 hidden sm:block" />
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                'px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer',
                filter === opt.key
                  ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-900/60 text-elevare-text/70 border border-emerald-500/10 hover:border-emerald-400/30 hover:text-elevare-text'
              )}
            >
              {opt.label}
              {opt.count !== undefined && (
                <span className="ml-1 opacity-75">({opt.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-elevare-text/60 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-lg bg-emerald-400 shadow-sm shadow-emerald-400/40" />
            <span className="font-medium text-emerald-300">Disponível</span>
          </div>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-lg bg-amber-400 shadow-sm shadow-amber-400/40" />
                <span className="font-medium text-amber-300">Aguardando autorização</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-lg bg-zinc-800" />
                <span className="font-medium text-zinc-400">Vendido</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-lg bg-zinc-800 border border-zinc-700/50" />
              <span className="font-medium text-zinc-400">Já escolhido</span>
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
          <div className="bg-gradient-to-r from-zinc-950/95 via-[#0e2719]/95 to-zinc-950/95 border-2 border-emerald-400 rounded-2xl p-4 shadow-[0_0_50px_rgba(16,185,129,0.35)] backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-white flex items-center gap-1.5 truncate">
                <Sparkles size={16} className="text-amber-400 shrink-0" />
                <span>
                  {selectedNumbers.length} {selectedNumbers.length === 1 ? 'número' : 'números'}{' '}
                  <span className="text-emerald-400">(R$ {selectedNumbers.length * 10},00)</span>
                </span>
              </p>
              <p className="text-xs text-amber-300 truncate font-mono mt-0.5">
                {selectedNumbers
                  .sort((a, b) => a - b)
                  .map((n) => String(n).padStart(3, '0'))
                  .join(', ')}
              </p>
            </div>
            <button
              onClick={onSell}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-400 via-lime-400 to-amber-300 hover:brightness-110 text-zinc-950 font-black rounded-xl text-sm active:scale-95 transition-all duration-150 whitespace-nowrap cursor-pointer shadow-lg shadow-emerald-500/30"
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
