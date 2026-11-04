import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Buyer, RaffleNumber } from '../types'
import { formatCurrency, formatPhone, generateWhatsAppMessage, copyToClipboard } from '../lib/utils'
import toast from 'react-hot-toast'
import {
  Users,
  Search,
  Copy,
  Download,
  AlertTriangle,
  Phone,
  Hash,
  CheckCircle2,
  Clock,
} from 'lucide-react'

interface BuyerWithNumbers extends Buyer {
  raffle_numbers: RaffleNumber[]
}

export function BuyersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [buyers, setBuyers] = useState<BuyerWithNumbers[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, authLoading, navigate])

  useEffect(() => {
    fetchBuyers()
  }, [])

  async function fetchBuyers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('buyers')
      .select('*, raffle_numbers(*)')
      .order('name')

    if (error) {
      console.error('Erro ao buscar compradores:', error)
      toast.error('Erro ao carregar compradores')
    } else {
      setBuyers((data || []) as BuyerWithNumbers[])
    }
    setLoading(false)
  }

  function getBuyerStats(buyer: BuyerWithNumbers) {
    const nums = buyer.raffle_numbers || []
    const totalPaid = nums.reduce((sum, n) => sum + (n.amount_charged || 0), 0)
    const totalDiscount = nums.reduce((sum, n) => sum + (n.discount || 0), 0)
    const allPaid = nums.length > 0 && nums.every((n) => n.payment_status === 'paid')
    const hasPending = nums.some((n) => n.payment_status === 'pending')
    return { totalPaid, totalDiscount, allPaid, hasPending, count: nums.length }
  }

  const filteredBuyers = buyers.filter((buyer) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      !query ||
      buyer.name.toLowerCase().includes(query) ||
      buyer.phone?.includes(query)

    if (!matchesSearch) return false

    if (statusFilter === 'all') return true
    const stats = getBuyerStats(buyer)
    if (statusFilter === 'paid') return stats.allPaid && stats.count > 0
    if (statusFilter === 'pending') return stats.hasPending
    return true
  })

  async function handleCopyWhatsApp(buyer: BuyerWithNumbers) {
    const nums = buyer.raffle_numbers.map((n) => n.number)
    const message = generateWhatsAppMessage(buyer.name, nums)
    await copyToClipboard(message)
    toast.success('Mensagem copiada!')
  }

  function exportCSV() {
    const header = 'Nome,Telefone,Números,Qtd,Valor Pago,Desconto,Status\n'
    const rows = buyers.map((b) => {
      const stats = getBuyerStats(b)
      const nums = b.raffle_numbers.map((n) => n.number).sort((a, b) => a - b).join('; ')
      const status = stats.allPaid ? 'Pago' : stats.hasPending ? 'Pendente' : 'Sem números'
      return `"${b.name}","${b.phone || ''}","${nums}",${stats.count},${stats.totalPaid.toFixed(2)},${stats.totalDiscount.toFixed(2)},${status}`
    }).join('\n')

    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rifa-elevare-compradores-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado!')
  }

  if (loading || authLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-elevare-border rounded w-1/3 animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-elevare-card border border-elevare-border rounded-xl p-4 animate-pulse">
            <div className="h-5 bg-elevare-border rounded w-1/2 mb-2" />
            <div className="h-4 bg-elevare-border rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-elevare-text flex items-center gap-3">
          <Users className="w-7 h-7 text-elevare-accent" />
          Compradores
          <span className="text-sm font-normal text-elevare-text/50">({buyers.length})</span>
        </h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-elevare-secondary border border-elevare-border rounded-xl text-sm text-elevare-text/80 hover:bg-elevare-border transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-elevare-text/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-10 pr-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {([
            { key: 'all', label: 'Todos' },
            { key: 'paid', label: 'Pagos' },
            { key: 'pending', label: 'Pendentes' },
          ] as { key: 'all' | 'paid' | 'pending'; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                statusFilter === key
                  ? 'bg-elevare-accent text-elevare-bg'
                  : 'bg-elevare-secondary/50 text-elevare-text/60 hover:bg-elevare-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Buyers List */}
      {filteredBuyers.length === 0 ? (
        <div className="text-center py-12 text-elevare-text/40">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum comprador encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBuyers.map((buyer) => {
            const stats = getBuyerStats(buyer)
            const hasNoNumbers = stats.count === 0

            return (
              <div
                key={buyer.id}
                className={`bg-elevare-card border rounded-xl p-4 ${
                  hasNoNumbers ? 'border-elevare-yellow/50' : 'border-elevare-border'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-elevare-text truncate">{buyer.name}</h3>
                      {stats.allPaid && stats.count > 0 && (
                        <span className="flex items-center gap-1 text-xs text-elevare-accent bg-elevare-accent/10 px-2 py-0.5 rounded-lg">
                          <CheckCircle2 className="w-3 h-3" /> Pago
                        </span>
                      )}
                      {stats.hasPending && (
                        <span className="flex items-center gap-1 text-xs text-elevare-yellow bg-elevare-yellow/10 px-2 py-0.5 rounded-lg">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                      {hasNoNumbers && (
                        <span className="flex items-center gap-1 text-xs text-elevare-yellow bg-elevare-yellow/10 px-2 py-0.5 rounded-lg">
                          <AlertTriangle className="w-3 h-3" /> Sem números
                        </span>
                      )}
                    </div>

                    {buyer.phone && (
                      <p className="text-sm text-elevare-text/50 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {formatPhone(buyer.phone)}
                      </p>
                    )}

                    {buyer.notes && (
                      <p className="text-xs text-elevare-yellow mt-1">{buyer.notes}</p>
                    )}

                    {stats.count > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <Hash className="w-3 h-3 text-elevare-text/40" />
                        {buyer.raffle_numbers
                          .map((n) => n.number)
                          .sort((a, b) => a - b)
                          .map((n) => (
                            <span
                              key={n}
                              className="px-1.5 py-0.5 bg-elevare-accent/15 text-elevare-accent rounded text-xs font-mono font-bold"
                            >
                              {n}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-elevare-accent">{formatCurrency(stats.totalPaid)}</p>
                      {stats.totalDiscount > 0 && (
                        <p className="text-xs text-elevare-yellow">-{formatCurrency(stats.totalDiscount)}</p>
                      )}
                    </div>
                    {stats.count > 0 && (
                      <button
                        onClick={() => handleCopyWhatsApp(buyer)}
                        className="p-2 rounded-lg bg-elevare-secondary/50 text-elevare-text/60 hover:text-elevare-accent hover:bg-elevare-accent/10 transition-colors cursor-pointer"
                        title="Copiar mensagem WhatsApp"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

