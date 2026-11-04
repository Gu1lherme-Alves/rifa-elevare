import {
  X,
  User,
  Phone,
  Tag,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Trash2,
  UserCog,
} from 'lucide-react'
import { RaffleNumber } from '../types'
import { formatCurrency, formatPhone, formatDate, cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'

interface NumberDetailModalProps {
  open: boolean
  onClose: () => void
  number: RaffleNumber | null
  onConfirmPayment?: (number: number) => void
  onReleaseNumber?: (number: number) => void
  loading?: boolean
}

export function NumberDetailModal({
  open,
  onClose,
  number,
  onConfirmPayment,
  onReleaseNumber,
  loading = false,
}: NumberDetailModalProps) {
  const { isAdmin } = useAuth()

  if (!open || !number) return null

  const statusConfig = {
    available: { label: 'Disponível', color: 'bg-elevare-accent text-elevare-bg' },
    reserved: { label: 'Reservado', color: 'bg-elevare-yellow text-elevare-bg' },
    sold: { label: 'Vendido', color: 'bg-gray-600 text-gray-300' },
  }

  const paymentConfig = {
    paid: { label: 'Pago', icon: <CheckCircle2 size={14} />, color: 'text-elevare-accent' },
    pending: { label: 'Pendente', icon: <Clock size={14} />, color: 'text-elevare-yellow' },
  }

  const status = statusConfig[number.status]
  const payment = number.payment_status ? paymentConfig[number.payment_status] : null

  const pricePerNumber = number.amount_charged ?? 10
  const discount = number.discount ?? 0
  const date = number.sold_at ?? number.reserved_at

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-elevare-card rounded-2xl max-w-sm w-full mx-4 border border-elevare-border shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-elevare-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-elevare-text">
              #{String(number.number).padStart(3, '0')}
            </span>
            <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold', status.color)}>
              {status.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-elevare-secondary text-elevare-text/50 hover:text-elevare-text transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Buyer Info */}
          {number.buyer && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-400/10">
                  <User size={16} className="text-sky-400" />
                </div>
                <div>
                  <p className="text-xs text-elevare-text/50">Comprador</p>
                  <p className="text-sm font-medium text-elevare-text">
                    {number.buyer.name}
                  </p>
                </div>
              </div>

              {number.buyer.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-400/10">
                    <Phone size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-elevare-text/50">Telefone</p>
                    <p className="text-sm font-medium text-elevare-text">
                      {formatPhone(number.buyer.phone)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Seller */}
          {number.seller && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-400/10">
                <UserCog size={16} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-elevare-text/50">Vendedor</p>
                <p className="text-sm font-medium text-elevare-text">
                  {number.seller.full_name}
                </p>
              </div>
            </div>
          )}

          {/* Divider */}
          {(number.buyer || number.seller) && (
            <div className="border-t border-elevare-border" />
          )}

          {/* Financial Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-elevare-accent/10">
                <DollarSign size={16} className="text-elevare-accent" />
              </div>
              <div>
                <p className="text-xs text-elevare-text/50">Valor cobrado</p>
                <p className="text-sm font-bold text-elevare-accent">
                  {formatCurrency(pricePerNumber)}
                </p>
              </div>
            </div>

            {discount > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-elevare-yellow/10">
                  <Tag size={16} className="text-elevare-yellow" />
                </div>
                <div>
                  <p className="text-xs text-elevare-text/50">Desconto</p>
                  <p className="text-sm font-bold text-elevare-yellow">
                    {formatCurrency(discount)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Status */}
          {payment && (
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  number.payment_status === 'paid' ? 'bg-elevare-accent/10' : 'bg-elevare-yellow/10'
                )}
              >
                {number.payment_status === 'paid' ? (
                  <CheckCircle2 size={16} className="text-elevare-accent" />
                ) : (
                  <Clock size={16} className="text-elevare-yellow" />
                )}
              </div>
              <div>
                <p className="text-xs text-elevare-text/50">Pagamento</p>
                <p className={cn('text-sm font-medium', payment.color)}>
                  {payment.label}
                </p>
              </div>
            </div>
          )}

          {/* Date */}
          {date && (
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-elevare-text/5">
                <Calendar size={16} className="text-elevare-text/50" />
              </div>
              <div>
                <p className="text-xs text-elevare-text/50">
                  {number.status === 'sold' ? 'Vendido em' : 'Reservado em'}
                </p>
                <p className="text-sm font-medium text-elevare-text/80">
                  {formatDate(date)}
                </p>
              </div>
            </div>
          )}

          {/* Observation */}
          {number.observation && (
            <div className="p-3 bg-elevare-bg/50 rounded-xl">
              <p className="text-xs text-elevare-text/50 mb-1">Observação</p>
              <p className="text-sm text-elevare-text/80">{number.observation}</p>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        {isAdmin && (number.status === 'reserved' || number.status === 'sold') && (
          <div className="p-5 pt-0 space-y-2">
            <div className="border-t border-elevare-border mb-4" />

            {number.status === 'reserved' && number.payment_status === 'pending' && onConfirmPayment && (
              <button
                onClick={() => onConfirmPayment(number.number)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-elevare-accent text-elevare-bg hover:bg-elevare-accent/90 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck size={16} />
                Confirmar Pagamento
              </button>
            )}

            {onReleaseNumber && (
              <button
                onClick={() => onReleaseNumber(number.number)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-elevare-red/30 text-elevare-red hover:bg-elevare-red/10 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={16} />
                Liberar Número
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
