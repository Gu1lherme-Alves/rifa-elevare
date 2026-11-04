import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Tag,
  DollarSign,
} from 'lucide-react'
import { RaffleNumber, Settings } from '../types'
import { formatCurrency, cn } from '../lib/utils'

interface StatsCardsProps {
  numbers: RaffleNumber[]
  buyersCount: number
  settings: Settings | null
}

interface StatCardData {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

export function StatsCards({ numbers, buyersCount, settings }: StatsCardsProps) {
  const totalNumbers = settings?.total_numbers ?? 200
  const pricePerNumber = settings?.price_per_number ?? 10

  const soldCount = numbers.filter((n) => n.status === 'sold').length
  const reservedCount = numbers.filter((n) => n.status === 'reserved').length
  const availableCount = numbers.filter((n) => n.status === 'available').length
  const soldAndReserved = soldCount + reservedCount

  const progressPercent = totalNumbers > 0 ? Math.round((soldAndReserved / totalNumbers) * 100) : 0

  const totalDiscount = numbers.reduce((sum, n) => sum + (n.discount ?? 0), 0)
  const totalCollected = numbers.reduce((sum, n) => {
    if (n.status === 'sold' || n.status === 'reserved') {
      return sum + (n.amount_charged ?? pricePerNumber)
    }
    return sum
  }, 0)

  const cards: StatCardData[] = [
    {
      label: 'Vendidos',
      value: `${soldCount} / ${totalNumbers}`,
      icon: <ShoppingCart size={20} />,
      color: 'text-elevare-accent',
      bgColor: 'bg-elevare-accent/10',
    },
    {
      label: 'Disponíveis',
      value: `${availableCount}`,
      icon: <Package size={20} />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      label: 'Compradores',
      value: `${buyersCount}`,
      icon: <Users size={20} />,
      color: 'text-sky-400',
      bgColor: 'bg-sky-400/10',
    },
    {
      label: 'Descontos',
      value: formatCurrency(totalDiscount),
      icon: <Tag size={20} />,
      color: 'text-elevare-yellow',
      bgColor: 'bg-elevare-yellow/10',
    },
    {
      label: 'Arrecadado',
      value: formatCurrency(totalCollected),
      icon: <DollarSign size={20} />,
      color: 'text-elevare-accent',
      bgColor: 'bg-elevare-accent/10',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <div className="bg-elevare-card rounded-xl p-4 border border-elevare-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-elevare-accent/10">
              <TrendingUp size={20} className="text-elevare-accent" />
            </div>
            <div>
              <p className="text-xs text-elevare-text/50 uppercase tracking-wide font-medium">
                Progresso
              </p>
              <p className="text-lg font-bold text-elevare-text">
                {progressPercent}%
              </p>
            </div>
          </div>
          <span className="text-sm text-elevare-text/60">
            {soldAndReserved} de {totalNumbers}
          </span>
        </div>
        <div className="w-full h-3 bg-elevare-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-elevare-accent to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-elevare-text/40">
          <span>{soldCount} vendidos</span>
          <span>{reservedCount} reservados</span>
          <span>{availableCount} disponíveis</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-elevare-card rounded-xl p-4 border border-elevare-border hover:border-elevare-accent/30 transition-colors duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('p-1.5 rounded-lg', card.bgColor)}>
                <span className={card.color}>{card.icon}</span>
              </div>
            </div>
            <p className="text-xs text-elevare-text/50 uppercase tracking-wide font-medium">
              {card.label}
            </p>
            <p className={cn('text-lg font-bold mt-0.5', card.color)}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
