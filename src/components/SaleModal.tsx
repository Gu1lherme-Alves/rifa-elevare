import { useState, useEffect } from 'react'
import { X, Check, Clock, Minus, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, cn } from '../lib/utils'

interface SaleModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (data: SaleFormData) => void
  selectedNumbers: number[]
  pricePerNumber: number
  loading?: boolean
}

export interface SaleFormData {
  buyerName: string
  buyerPhone: string
  amountCharged: number
  paymentStatus: 'paid' | 'pending'
  observation: string
}

export function SaleModal({
  open,
  onClose,
  onConfirm,
  selectedNumbers,
  pricePerNumber,
  loading = false,
}: SaleModalProps) {
  const { profile } = useAuth()
  const defaultAmount = selectedNumbers.length * pricePerNumber

  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [amountCharged, setAmountCharged] = useState(defaultAmount)
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('pending')
  const [observation, setObservation] = useState('')

  useEffect(() => {
    setAmountCharged(selectedNumbers.length * pricePerNumber)
  }, [selectedNumbers, pricePerNumber])

  useEffect(() => {
    if (open) {
      setBuyerName('')
      setBuyerPhone('')
      setAmountCharged(selectedNumbers.length * pricePerNumber)
      setPaymentStatus('pending')
      setObservation('')
    }
  }, [open, selectedNumbers, pricePerNumber])

  if (!open) return null

  const discount = defaultAmount - amountCharged
  const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyerName.trim()) return
    onConfirm({
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      amountCharged,
      paymentStatus,
      observation: observation.trim(),
    })
  }

  const handlePhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
      let formatted = digits
      if (digits.length > 2) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`
      }
      if (digits.length > 7) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
      }
      setBuyerPhone(formatted)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-elevare-card rounded-2xl max-w-md w-full mx-4 border border-elevare-border shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-elevare-border">
          <h2 className="text-lg font-bold text-elevare-text">Nova Venda</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-elevare-secondary text-elevare-text/50 hover:text-elevare-text transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Numbers */}
        <div className="px-5 pt-4">
          <p className="text-xs text-elevare-text/50 uppercase tracking-wide font-medium mb-2">
            Números selecionados
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sortedNumbers.map((n) => (
              <span
                key={n}
                className="px-2.5 py-1 bg-elevare-accent/15 text-elevare-accent rounded-lg text-xs font-bold"
              >
                {String(n).padStart(3, '0')}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Buyer Name */}
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">
              Nome do comprador *
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Nome completo"
              required
              autoFocus
              className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 focus:border-elevare-accent/50 transition-all text-sm"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">
              Telefone / WhatsApp
            </label>
            <input
              type="tel"
              value={buyerPhone}
              onChange={(e) => handlePhoneInput(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 focus:border-elevare-accent/50 transition-all text-sm"
            />
          </div>

          {/* Amount Charged */}
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">
              Valor cobrado
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-elevare-text/40 text-sm">
                R$
              </span>
              <input
                type="number"
                value={amountCharged}
                onChange={(e) => setAmountCharged(Math.max(0, Number(e.target.value)))}
                min={0}
                step={0.01}
                className="w-full pl-12 pr-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 focus:border-elevare-accent/50 transition-all text-sm"
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-elevare-text/40">
                {selectedNumbers.length} × {formatCurrency(pricePerNumber)} = {formatCurrency(defaultAmount)}
              </span>
              {discount > 0 && (
                <span className="text-xs text-elevare-yellow font-medium">
                  Desconto: {formatCurrency(discount)}
                </span>
              )}
              {discount < 0 && (
                <span className="text-xs text-elevare-red font-medium">
                  Acréscimo: {formatCurrency(Math.abs(discount))}
                </span>
              )}
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">
              Status do pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
                  paymentStatus === 'paid'
                    ? 'bg-elevare-accent text-elevare-bg'
                    : 'bg-elevare-input border border-elevare-border text-elevare-text/50 hover:text-elevare-text'
                )}
              >
                <Check size={16} />
                Pago
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('pending')}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
                  paymentStatus === 'pending'
                    ? 'bg-elevare-yellow text-elevare-bg'
                    : 'bg-elevare-input border border-elevare-border text-elevare-text/50 hover:text-elevare-text'
                )}
              >
                <Clock size={16} />
                Pendente
              </button>
            </div>
          </div>

          {/* Seller (read-only) */}
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">
              Vendedor
            </label>
            <div className="w-full px-4 py-3 bg-elevare-input/50 border border-elevare-border/50 rounded-xl text-elevare-text/60 text-sm">
              {profile?.full_name ?? 'Não identificado'}
            </div>
          </div>

          {/* Observation */}
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">
              Observação
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Informações adicionais (opcional)"
              rows={2}
              className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 focus:border-elevare-accent/50 transition-all text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium border border-elevare-border text-elevare-text/70 hover:bg-elevare-secondary/50 hover:text-elevare-text transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!buyerName.trim() || loading}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-elevare-accent text-elevare-bg hover:bg-elevare-accent/90 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-elevare-bg/30 border-t-elevare-bg rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : (
                'Confirmar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
