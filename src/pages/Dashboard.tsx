import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { RaffleNumber, Settings, FilterType } from '../types'
import { formatCurrency, copyToClipboard } from '../lib/utils'
import { StatsCards } from '../components/StatsCards'
import { NumberGrid } from '../components/NumberGrid'
import { SaleModal, SaleFormData } from '../components/SaleModal'
import { NumberDetailModal } from '../components/NumberDetailModal'
import { PublicCheckoutModal } from '../components/PublicCheckoutModal'
import toast from 'react-hot-toast'
import {
  Leaf,
  Globe,
  Copy,
  Check,
  Trophy,
  Sparkles,
  TrendingUp,
  ShieldAlert,
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

function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.073.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
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
  const [showAdminSaleModal, setShowAdminSaleModal] = useState(false)
  const [showPublicModal, setShowPublicModal] = useState(false)
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

  // Abertura do modal apropriado de compra
  function handleOpenBuyModal() {
    if (isAuthenticated) {
      setShowAdminSaleModal(true)
    } else {
      setShowPublicModal(true)
    }
  }

  // Reserva pública passo a passo (sem login)
  async function handlePublicReservation(data: {
    buyerName: string
    buyerPhone: string
    numbers: number[]
    totalAmount: number
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: res, error } = await supabase.rpc('reserve_numbers', {
        p_numbers: data.numbers,
        p_buyer_name: data.buyerName,
        p_buyer_phone: data.buyerPhone,
        p_seller_id: null,
        p_amount_charged: data.totalAmount,
        p_payment_status: 'pending',
        p_observation: 'Reserva feita pelo site público (aguardando comprovante via WhatsApp)',
      })

      if (error) throw error

      const result = typeof res === 'string' ? JSON.parse(res) : res
      if (result && result.success === false) {
        return { success: false, error: result.error }
      }

      fetchNumbers()
      fetchBuyersCount()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao processar reserva.' }
    }
  }

  // Venda realizada pelo Administrador
  async function handleAdminSaleConfirm(formData: SaleFormData) {
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
        setShowAdminSaleModal(false)
        fetchNumbers()
        fetchBuyersCount()
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao registrar venda.')
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
      toast.success('Pagamento confirmado com sucesso!')
      setShowDetailModal(false)
      setSelectedDetailNumber(null)
      fetchNumbers()
      fetchBuyersCount()
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
      toast.success('Número liberado com sucesso!')
      setShowDetailModal(false)
      setSelectedDetailNumber(null)
      fetchNumbers()
      fetchBuyersCount()
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

  const totalNumbers = settings?.total_numbers ?? 200
  const soldCount = numbers.filter((n) => n.status === 'sold').length
  const reservedCount = numbers.filter((n) => n.status === 'reserved').length
  const availableCount = numbers.filter((n) => n.status === 'available').length
  const takenCount = soldCount + reservedCount
  const progressPercent = totalNumbers > 0 ? Math.round((takenCount / totalNumbers) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-elevare-card border border-elevare-border rounded-2xl p-6 animate-pulse">
          <div className="h-7 bg-elevare-border rounded w-1/3 mb-4" />
          <div className="h-4 bg-elevare-border rounded w-2/3" />
        </div>
        <div className="bg-elevare-card border border-elevare-border rounded-2xl p-6 animate-pulse">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="h-12 bg-elevare-border rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ============================================================== */}
      {/* CABEÇALHO PARA VISITANTES PÚBLICOS (SUPER LIMPO + BANNER)      */}
      {/* ============================================================== */}
      {!isAuthenticated ? (
        <div className="space-y-5">
          {/* Hero Banner Ilustrativo com Prêmio */}
          <div className="bg-gradient-to-br from-elevare-card via-elevare-secondary/50 to-elevare-card border border-elevare-border rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              {/* Imagem do Cartaz Oficial */}
              <div className="md:col-span-5 p-4 sm:p-6 flex justify-center bg-black/20">
                <img
                  src="/banner-rifa.jpg"
                  alt="Cartaz Rifa ELEVARE"
                  className="rounded-2xl shadow-2xl max-h-[380px] w-auto object-contain border border-elevare-border/60 hover:scale-[1.01] transition-transform duration-300"
                />
              </div>

              {/* Informações de Destaque */}
              <div className="md:col-span-7 p-6 sm:p-8 space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-elevare-accent/15 border border-elevare-accent/30 text-elevare-accent text-xs font-bold tracking-wide uppercase">
                  <Sparkles size={14} />
                  <span>Projeto Acadêmico FECAP</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-elevare-text tracking-tight leading-none">
                  RIFA <span className="text-elevare-accent">ELEVARE</span>
                </h1>

                <p className="text-elevare-text/75 text-sm sm:text-base leading-relaxed max-w-xl">
                  Sua chance de fazer o bem para comunidades em vulnerabilidade e ainda concorrer a prêmios incríveis!
                </p>

                {/* Card de Prêmio e Preço */}
                <div className="p-4 rounded-2xl bg-elevare-input/90 border border-elevare-accent/30 space-y-2">
                  <div className="flex items-center justify-center md:justify-start gap-2.5 text-elevare-accent font-bold text-base sm:text-lg">
                    <Trophy className="w-5 h-5 shrink-0 text-elevare-yellow" />
                    <span>1 Alexa Echo Dot <span className="text-elevare-text/50 font-normal">OU</span> R$ 400,00 no Pix</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-3 pt-1 text-sm">
                    <span className="px-3 py-1 rounded-xl bg-elevare-accent text-elevare-bg font-extrabold">
                      R$ 10,00 cada número
                    </span>
                    <span className="text-elevare-text/60 text-xs">
                      200 números no total
                    </span>
                  </div>
                </div>

                {/* Chave Pix Rápida */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <div className="w-full sm:flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-elevare-secondary/50 border border-elevare-border text-xs text-elevare-text/90 font-mono">
                    <span className="truncate">{settings?.pix_key || 'elevare.fecap@gmail.com'}</span>
                    <span className="text-[10px] text-elevare-text/40 ml-2 uppercase">Pix</span>
                  </div>
                  <button
                    onClick={handleCopyPix}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-elevare-secondary hover:bg-elevare-border text-elevare-text border border-elevare-border text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    {pixCopied ? <Check size={14} className="text-elevare-accent" /> : <Copy size={14} />}
                    <span>{pixCopied ? 'Copiado!' : 'Copiar Pix'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Progresso da Rifa */}
          <div className="bg-elevare-card border border-elevare-border rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-elevare-accent/15 text-elevare-accent">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-elevare-text">
                    Progresso da Arrecadação
                  </h3>
                  <p className="text-xs text-elevare-text/50">
                    {takenCount} de {totalNumbers} números já garantidos ({progressPercent}%)
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  {availableCount} disponíveis
                </span>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full h-3.5 bg-elevare-bg rounded-full overflow-hidden p-0.5 border border-elevare-border/50">
              <div
                className="h-full bg-gradient-to-r from-elevare-accent via-emerald-400 to-elevare-accent rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-xs text-elevare-text/50 text-center pt-1 italic">
              "Doar hoje. Transformar amanhã." — 100% dos alimentos arrecadados são doados.
            </p>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* CABEÇALHO PARA ADMINISTRADOR AUTENTICADO                       */
        /* ============================================================== */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-elevare-card border border-elevare-border rounded-2xl p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-elevare-yellow/20 text-elevare-yellow text-xs font-bold uppercase tracking-wider">
                  Painel de Controle
                </span>
                <span className="text-xs text-elevare-text/40">Logado como Admin</span>
              </div>
              <h1 className="text-2xl font-bold text-elevare-text mt-1 flex items-center gap-2">
                <Leaf className="w-6 h-6 text-elevare-accent" />
                Gerenciamento Rifa ELEVARE
              </h1>
            </div>

            {settings?.raffle_drawn && (
              <div className="flex items-center gap-2 bg-elevare-yellow/20 border border-elevare-yellow/40 rounded-xl px-4 py-2">
                <Trophy className="w-5 h-5 text-elevare-yellow" />
                <span className="text-elevare-yellow font-semibold text-sm">
                  Sorteada! Ganhador: nº {settings.raffle_winner_number}
                </span>
              </div>
            )}
          </div>

          {/* Cards Completos de Gestão Administrativa */}
          <StatsCards numbers={numbers} buyersCount={buyersCount} settings={settings} />

          {/* Alerta de Números Aguardando Autorização */}
          {reservedCount > 0 && (
            <div className="p-4 rounded-xl bg-elevare-yellow/15 border border-elevare-yellow/40 flex items-center justify-between gap-3 text-elevare-yellow">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>
                  Existem <strong>{reservedCount}</strong> número(s) aguardando sua autorização / validação de comprovante!
                </span>
              </div>
              <span className="text-xs underline cursor-pointer" onClick={() => setFilter('reserved')}>
                Ver pendentes
              </span>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* GRADE DOS 200 NÚMEROS                                          */}
      {/* ============================================================== */}
      <div className="bg-elevare-card border border-elevare-border rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="border-b border-elevare-border pb-3 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-elevare-text flex items-center gap-2">
              <span>Grade de Números (1 a 200)</span>
            </h2>
            <p className="text-xs text-elevare-text/50">
              {isAuthenticated
                ? 'Selecione números para vender ou clique nos amarelos/cinzas para gerenciar.'
                : 'Toque nos números verdes para escolher e garantir a sua chance!'}
            </p>
          </div>

          <div className="text-xs text-elevare-accent font-bold">
            {availableCount} disponíveis
          </div>
        </div>

        <NumberGrid
          numbers={numbers}
          selectedNumbers={selectedNumbers}
          onSelect={handleSelectNumber}
          onSell={handleOpenBuyModal}
          filter={filter}
          setFilter={setFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isAuthenticated={isAuthenticated}
          onNumberClick={handleNumberDetail}
        />
      </div>

      {/* ============================================================== */}
      {/* RODAPÉ PÚBLICO LIMPO                                           */}
      {/* ============================================================== */}
      <footer className="bg-elevare-card border border-elevare-border rounded-2xl p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prêmio */}
          <div>
            <h3 className="text-elevare-accent font-semibold text-base mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-elevare-yellow" />
              Premiação Oficial
            </h3>
            <p className="text-elevare-text/70 text-xs sm:text-sm leading-relaxed">
              1 Alexa Echo Dot ou R$ 400,00 no Pix direto na sua conta.
            </p>
            <p className="mt-2 text-elevare-yellow font-bold text-sm">
              Apenas R$ 10,00 cada número!
            </p>
          </div>

          {/* Chave Pix e WhatsApp */}
          <div>
            <h3 className="text-elevare-accent font-semibold text-base mb-2">
              Chave Pix Oficial
            </h3>
            <button
              onClick={handleCopyPix}
              className="flex items-center gap-2 bg-elevare-input border border-elevare-border rounded-xl px-3.5 py-2.5 text-elevare-text text-xs hover:border-elevare-accent/50 transition-colors w-full cursor-pointer"
            >
              <span className="truncate flex-1 text-left font-mono">{settings?.pix_key || 'elevare.fecap@gmail.com'}</span>
              {pixCopied ? (
                <Check className="w-4 h-4 text-elevare-accent shrink-0" />
              ) : (
                <Copy className="w-4 h-4 text-elevare-text/40 shrink-0" />
              )}
            </button>
            <a
              href="https://wa.me/5511993309871"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 mt-2.5 font-medium transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0" />
              <span>Dúvidas? Fale conosco no WhatsApp: (11) 99330-9871</span>
            </a>
          </div>

          {/* Redes Sociais */}
          <div>
            <h3 className="text-elevare-accent font-semibold text-base mb-2">
              Acompanhe a ELEVARE
            </h3>
            <div className="space-y-2">
              <a
                href={settings?.instagram_url || 'https://www.instagram.com/elevare.doe'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-elevare-text/70 hover:text-elevare-accent transition-colors text-xs"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>Instagram: @elevare.doe</span>
              </a>
              <a
                href={settings?.website_url || 'https://liderancasempaticas.com/'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-elevare-text/70 hover:text-elevare-accent transition-colors text-xs"
              >
                <Globe className="w-4 h-4" />
                <span>Lideranças Empáticas</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-elevare-border/70 text-center">
          <p className="text-elevare-accent italic text-base font-semibold">
            "Doar hoje. Transformar amanhã."
          </p>
          <p className="text-elevare-text/40 text-[11px] mt-1">
            Projeto ELEVARE &copy; {new Date().getFullYear()} — FECAP (Fundação Escola de Comércio Álvares Penteado)
          </p>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* MODAL PASSO A PASSO PÚBLICO (CHECKOUT SEM LOGIN)               */}
      {/* ============================================================== */}
      <PublicCheckoutModal
        open={showPublicModal}
        onClose={() => {
          setShowPublicModal(false)
          setSelectedNumbers([])
        }}
        selectedNumbers={selectedNumbers}
        pricePerNumber={settings?.price_per_number ?? 10}
        onConfirmReservation={handlePublicReservation}
      />

      {/* ============================================================== */}
      {/* MODAL ADMINISTRATIVO DE VENDA                                 */}
      {/* ============================================================== */}
      <SaleModal
        open={showAdminSaleModal}
        onClose={() => setShowAdminSaleModal(false)}
        onConfirm={handleAdminSaleConfirm}
        selectedNumbers={selectedNumbers}
        pricePerNumber={settings?.price_per_number ?? 10}
        loading={saleLoading}
      />

      {/* ============================================================== */}
      {/* MODAL ADMINISTRATIVO DE DETALHES DO NÚMERO (AUTORIZAR/LIBERAR) */}
      {/* ============================================================== */}
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
