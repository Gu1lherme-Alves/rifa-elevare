import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { RaffleNumber, Settings, FilterType } from '../types'
import { formatCurrency, copyToClipboard } from '../lib/utils'
import { StatsCards } from '../components/StatsCards'
import { NumberGrid } from '../components/NumberGrid'
import { SaleModal, SaleFormData } from '../components/SaleModal'
import { NumberDetailModal } from '../components/NumberDetailModal'
import toast from 'react-hot-toast'
import {
  Leaf,
  Globe,
  Copy,
  Check,
  Trophy,
} from 'lucide-react'

function InstagramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
}

export function Dashboard() {
  const { user, profile, isAuthenticated, isAdmin } = useAuth()
  const [numbers, setNumbers] = useState<RaffleNumber[]>([])
  const [buyersCount, setBuyersCount] = useState(0)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDetailNumber, setSelectedDetailNumber] = useState<RaffleNumber | null>(null)
  const [loading, setLoading] = useState(true)
  const [saleLoading, setSaleLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)

  const fetchNumbers = useCallback(async () => {
    const query = isAuthenticated
      ? supabase.from('raffle_numbers').select('*, buyer:buyers(*), seller:profiles(*)').order('number')
      : supabase.from('raffle_numbers').select('number, status').order('number')

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar números:', error)
      return
    }
    if (data) {
      setNumbers(data as RaffleNumber[])
    }
  }, [isAuthenticated])

  const fetchBuyersCount = useCallback(async () => {
    const { count } = await supabase
      .from('buyers')
      .select('*', { count: 'exact', head: true })
    setBuyersCount(count || 0)
  }, [])

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) setSettings(data as Settings)
  }, [])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      await Promise.all([fetchNumbers(), fetchBuyersCount(), fetchSettings()])
      setLoading(false)
    }
    loadData()
  }, [fetchNumbers, fetchBuyersCount, fetchSettings])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('raffle-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'raffle_numbers' },
        () => {
          fetchNumbers()
          fetchBuyersCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNumbers, fetchBuyersCount])

  function handleSelectNumber(num: number) {
    setSelectedNumbers((prev) =>
      prev.includes(num)
        ? prev.filter((n) => n !== num)
        : [...prev, num]
    )
  }

  function handleNumberDetail(num: RaffleNumber) {
    setSelectedDetailNumber(num)
    setShowDetailModal(true)
  }

  async function handleSaleConfirm(formData: SaleFormData) {
    if (selectedNumbers.length === 0 || !user) return

    setSaleLoading(true)
    try {
      const { data, error } = await supabase.rpc('reserve_numbers', {
        p_numbers: selectedNumbers,
        p_buyer_name: formData.buyerName,
        p_buyer_phone: formData.buyerPhone || null,
        p_seller_id: user.id,
        p_amount_charged: formData.amountCharged,
        p_payment_status: formData.paymentStatus,
        p_observation: formData.observation || null,
      })

      if (error) throw error

      const result = typeof data === 'string' ? JSON.parse(data) : data
      if (result && result.success === false) {
        toast.error(result.error || 'Números já escolhidos por outra pessoa!')
        fetchNumbers()
      } else {
        const statusText = formData.paymentStatus === 'paid' ? 'vendido(s)' : 'reservado(s)'
        toast.success(`${selectedNumbers.length} número(s) ${statusText} para ${formData.buyerName}!`)
        setSelectedNumbers([])
        setShowSaleModal(false)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao registrar venda. Tente novamente.')
    } finally {
      setSaleLoading(false)
    }
  }

  async function handleConfirmPayment(numberVal: number) {
    if (!user) return
    setDetailLoading(true)
    try {
      const { error } = await supabase.rpc('confirm_payment', {
        p_numbers: [numberVal],
        p_user_id: user.id,
      })
      if (error) throw error
      toast.success('Pagamento confirmado!')
      setShowDetailModal(false)
      setSelectedDetailNumber(null)
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao confirmar pagamento.')
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleReleaseNumber(numberVal: number) {
    if (!user) return
    setDetailLoading(true)
    try {
      const { error } = await supabase.rpc('release_numbers', {
        p_numbers: [numberVal],
        p_user_id: user.id,
      })
      if (error) throw error
      toast.success('Número liberado!')
      setShowDetailModal(false)
      setSelectedDetailNumber(null)
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao liberar número.')
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleCopyPix() {
    if (!settings?.pix_key) return
    await copyToClipboard(settings.pix_key)
    setPixCopied(true)
    toast.success('Chave Pix copiada!')
    setTimeout(() => setPixCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-elevare-card border border-elevare-border rounded-xl p-4 animate-pulse">
          <div className="h-6 bg-elevare-border rounded w-1/3 mb-4" />
          <div className="h-3 bg-elevare-border rounded w-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-elevare-card border border-elevare-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-elevare-border rounded w-1/2 mb-3" />
              <div className="h-8 bg-elevare-border rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="bg-elevare-card border border-elevare-border rounded-xl p-6 animate-pulse">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="h-12 bg-elevare-border rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-elevare-text flex items-center gap-3">
            <Leaf className="w-7 h-7 text-elevare-accent" />
            Rifa ELEVARE
          </h1>
          <p className="text-elevare-text/50 text-sm mt-1">
            {settings?.prize_description || 'Prêmio surpresa'}
          </p>
        </div>

        {settings?.raffle_drawn && (
          <div className="flex items-center gap-2 bg-elevare-yellow/20 border border-elevare-yellow/40 rounded-xl px-4 py-2">
            <Trophy className="w-5 h-5 text-elevare-yellow" />
            <span className="text-elevare-yellow font-semibold text-sm">
              Rifa Sorteada! Número: {settings.raffle_winner_number}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <StatsCards numbers={numbers} buyersCount={buyersCount} settings={settings} />

      {/* Number Grid */}
      <NumberGrid
        numbers={numbers}
        selectedNumbers={selectedNumbers}
        onSelect={handleSelectNumber}
        onSell={() => setShowSaleModal(true)}
        filter={filter}
        setFilter={setFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isAuthenticated={isAuthenticated}
        onNumberClick={handleNumberDetail}
      />

      {/* Public Footer */}
      <footer className="bg-elevare-card border border-elevare-border rounded-2xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Prize */}
          <div>
            <h3 className="text-elevare-accent font-semibold text-lg mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Prêmio
            </h3>
            <p className="text-elevare-text/70 text-sm leading-relaxed">
              {settings?.prize_description || '1 Alexa Echo Dot OU R$ 400,00 no Pix'}
            </p>
            <p className="mt-3 text-elevare-yellow font-semibold">
              {formatCurrency(settings?.price_per_number ?? 10)} por número
            </p>
          </div>

          {/* Pix */}
          <div>
            <h3 className="text-elevare-accent font-semibold text-lg mb-3">
              Chave Pix
            </h3>
            <button
              onClick={handleCopyPix}
              className="flex items-center gap-2 bg-elevare-input border border-elevare-border rounded-xl px-4 py-3 text-elevare-text text-sm hover:border-elevare-accent/50 transition-colors w-full cursor-pointer"
            >
              <span className="truncate flex-1 text-left">{settings?.pix_key || 'elevare.fecap@gmail.com'}</span>
              {pixCopied ? (
                <Check className="w-4 h-4 text-elevare-accent shrink-0" />
              ) : (
                <Copy className="w-4 h-4 text-elevare-text/40 shrink-0" />
              )}
            </button>
            <p className="text-elevare-text/40 text-xs mt-2">
              Escolha seu número chamando a gente no privado
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-elevare-accent font-semibold text-lg mb-3">
              Links
            </h3>
            <div className="space-y-3">
              <a
                href={settings?.instagram_url || 'https://www.instagram.com/elevare.doe'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-elevare-text/70 hover:text-elevare-accent transition-colors text-sm"
              >
                <InstagramIcon className="w-5 h-5" />
                @elevare.doe
              </a>
              <a
                href={settings?.website_url || 'https://liderancasempaticas.com/'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-elevare-text/70 hover:text-elevare-accent transition-colors text-sm"
              >
                <Globe className="w-5 h-5" />
                Lideranças Empáticas
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-elevare-border text-center">
          <p className="text-elevare-accent italic text-lg font-medium">
            "Doar hoje. Transformar amanhã."
          </p>
          <p className="text-elevare-text/30 text-xs mt-2">
            Projeto ELEVARE &copy; {new Date().getFullYear()} — FECAP
          </p>
        </div>
      </footer>

      {/* Modals */}
      <SaleModal
        open={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        onConfirm={handleSaleConfirm}
        selectedNumbers={selectedNumbers}
        pricePerNumber={settings?.price_per_number ?? 10}
        loading={saleLoading}
      />

      <NumberDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedDetailNumber(null)
        }}
        number={selectedDetailNumber}
        onConfirmPayment={handleConfirmPayment}
        onReleaseNumber={handleReleaseNumber}
        loading={detailLoading}
      />
    </div>
  )
}
