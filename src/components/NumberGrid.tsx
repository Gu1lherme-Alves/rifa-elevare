import { useMemo } from 'react'
import { Filter, ShoppingBag } from 'lucide-react'
import { RaffleNumber, FilterType } from '../types'
import { cn } from '../lib/utils'

interface NumberGridProps {
  numbers: RaffleNumber[]
  selectedNumbers: number[]
  onSelect: (num: number) => void
  onSell: () => void
  filter: FilterType
  setFilter: (filter: FilterType) => void
  searchQuery?: string
  setSearchQuery?: (query: string) => void
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

    return result.sort((a, b) => a.number - b.number)
  }, [numbers, filter, isAuthenticated])

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
      return 'bg-[#7FB069] text-[#0F2A1A] ring-2 ring-white ring-offset-2 ring-offset-[#0F2A1A] scale-105 font-bold'
    }

    if (num.status === 'available') {
      return 'bg-[#7FB069] text-[#0F2A1A] hover:bg-[#8ec277] active:scale-95 font-bold cursor-pointer'
    }

    // Para usuários públicos, reservados e vendidos aparecem como indisponíveis
    if (!isAuthenticated) {
      return 'bg-[#182a20] text-[#4d6356] line-through opacity-50 cursor-not-allowed select-none'
    }

    // Para o Administrador:
    if (num.status === 'reserved') {
      return 'bg-[#E6C547] text-[#0F2A1A] hover:bg-[#edd263] cursor-pointer font-bold'
    }

    return 'bg-[#182a20] text-[#4d6356] line-through opacity-50 cursor-pointer'
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
        { key: 'all' as FilterType, label: 'Todos', count: undefined },
        { key: 'available' as FilterType, label: 'Disponíveis', count: undefined },
        { key: 'sold' as FilterType, label: 'Já Escolhidos', count: undefined },
      ]

  return (
    <div className="space-y-4">
      {/* Filters & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter size={15} className="text-[#F5F2E8]/40 shrink-0 hidden sm:block" />
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                filter === opt.key
                  ? 'bg-[#7FB069] text-[#0F2A1A] font-bold'
                  : 'bg-[#1F4D2E]/60 text-[#F5F2E8]/70 hover:bg-[#1F4D2E] hover:text-[#F5F2E8]'
              )}
            >
              {opt.label}
              {opt.count !== undefined && (
                <span className="ml-1 opacity-70">({opt.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#F5F2E8]/60">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#7FB069]" />
            <span>Disponível</span>
          </div>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-[#E6C547]" />
                <span>Aguardando autorização</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-[#182a20]" />
                <span>Vendido</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#182a20]" />
              <span>Já escolhido</span>
            </div>
          )}
        </div>
      </div>

      {/* Number Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {filteredNumbers.map((num) => {
          const isTaken = num.status !== 'available'
          return (
            <button
              key={num.number}
              onClick={() => handleNumberClick(num)}
              disabled={isTaken && !isAuthenticated}
              aria-label={`Número ${num.number}`}
              className={cn(
                'min-w-11 min-h-11 sm:min-w-12 sm:min-h-12 flex items-center justify-center rounded-lg text-sm transition-all select-none',
                getNumberStyle(num)
              )}
            >
              {String(num.number).padStart(3, '0')}
            </button>
          )
        })}
      </div>

      {filteredNumbers.length === 0 && (
        <div className="text-center py-10 text-[#F5F2E8]/40">
          <p className="text-sm">Nenhum número encontrado nessa categoria</p>
        </div>
      )}

      {/* Floating Action Bottom Bar when numbers are selected */}
      {selectedNumbers.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50">
          <div className="bg-[#1A3D28] border border-[#7FB069]/40 rounded-xl p-3.5 shadow-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F5F2E8] truncate">
                {selectedNumbers.length} {selectedNumbers.length === 1 ? 'número' : 'números'}{' '}
                — R$ {selectedNumbers.length * 10},00
              </p>
              <p className="text-xs text-[#7FB069] truncate font-mono">
                {selectedNumbers
                  .sort((a, b) => a - b)
                  .map((n) => String(n).padStart(3, '0'))
                  .join(', ')}
              </p>
            </div>
            <button
              onClick={onSell}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7FB069] hover:bg-[#8ec277] text-[#0F2A1A] font-bold rounded-lg text-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <ShoppingBag size={16} />
              <span>{isAuthenticated ? 'Vender / Reservar' : 'Garantir Números'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
