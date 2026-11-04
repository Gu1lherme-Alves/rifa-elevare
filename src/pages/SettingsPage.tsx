import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Settings as SettingsType, RaffleNumber, Buyer } from '../types'
import { formatCurrency, copyToClipboard } from '../lib/utils'
import toast from 'react-hot-toast'
import {
  Settings as SettingsIcon,
  Save,
  Copy,
  Check,
  Download,
  Trophy,
  Sparkles,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react'

export function SettingsPage() {
  const { isAdmin, isAuthenticated, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)

  // Raffle draw state
  const [drawing, setDrawing] = useState(false)
  const [drawNumber, setDrawNumber] = useState<number | null>(null)
  const [drawConfirm, setDrawConfirm] = useState(false)

  // Form fields
  const [pricePerNumber, setPricePerNumber] = useState(10)
  const [totalNumbers, setTotalNumbers] = useState(200)
  const [pixKey, setPixKey] = useState('')
  const [prizeDescription, setPrizeDescription] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [reservationExpiryHours, setReservationExpiryHours] = useState(24)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      navigate('/')
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate])

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data } = await supabase.from('settings').select('*').single()
    if (data) {
      const s = data as SettingsType
      setSettings(s)
      setPricePerNumber(s.price_per_number)
      setTotalNumbers(s.total_numbers)
      setPixKey(s.pix_key || '')
      setPrizeDescription(s.prize_description || '')
      setInstagramUrl(s.instagram_url || '')
      setWebsiteUrl(s.website_url || '')
      setWhatsappNumber(s.whatsapp_number || '')
      setReservationExpiryHours(s.reservation_expiry_hours)
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .update({
        price_per_number: pricePerNumber,
        total_numbers: totalNumbers,
        pix_key: pixKey,
        prize_description: prizeDescription,
        instagram_url: instagramUrl,
        website_url: websiteUrl,
        whatsapp_number: whatsappNumber,
        reservation_expiry_hours: reservationExpiryHours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id)

    if (error) {
      toast.error('Erro ao salvar configurações')
    } else {
      toast.success('Configurações salvas!')
      if (user) {
        await supabase.from('audit_log').insert({
          user_id: user.id,
          action: 'settings_updated',
          details: { updated_fields: ['price_per_number', 'pix_key', 'prize_description'] },
        })
      }
    }
    setSaving(false)
  }

  async function handleCopyPix() {
    await copyToClipboard(pixKey)
    setPixCopied(true)
    toast.success('Chave Pix copiada!')
    setTimeout(() => setPixCopied(false), 2000)
  }

  async function generateWhatsAppList() {
    const { data: numbers } = await supabase
      .from('raffle_numbers')
      .select('*, buyer:buyers(*)')
      .order('number')

    if (!numbers) return

    const sold = numbers.filter((n: any) => n.status === 'sold' || n.status === 'reserved') as (RaffleNumber & { buyer: Buyer })[]
    const available = numbers.filter((n: any) => n.status === 'available').map((n: any) => n.number)

    const totalCollected = sold.reduce((sum, n) => sum + (n.amount_charged || 0), 0)

    // Group by buyer
    const buyerMap = new Map<string, { name: string; numbers: number[]; total: number }>()
    sold.forEach((n) => {
      if (!n.buyer) return
      const key = n.buyer.id
      const existing = buyerMap.get(key) || { name: n.buyer.name, numbers: [], total: 0 }
      existing.numbers.push(n.number)
      existing.total += n.amount_charged || 0
      buyerMap.set(key, existing)
    })

    let text = `📋 RIFA ELEVARE - Controle de Vendas\n━━━━━━━━━━━━━━━━━━━━━━\n`
    text += `✅ Vendidos: ${sold.length}/200\n`
    text += `💰 Arrecadado: ${formatCurrency(totalCollected)}\n\n`
    text += `COMPRADORES:\n`

    Array.from(buyerMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((buyer) => {
        const nums = buyer.numbers.sort((a, b) => a - b).join(', ')
        text += `• ${buyer.name}: ${nums} - ${formatCurrency(buyer.total)} ✅\n`
      })

    text += `\nDISPONÍVEIS (${available.length}):\n`
    text += available.join(', ')

    await copyToClipboard(text)
    toast.success('Lista copiada para o WhatsApp!')
  }

  async function exportCSV() {
    const { data: numbers } = await supabase
      .from('raffle_numbers')
      .select('*, buyer:buyers(*), seller:profiles(*)')
      .order('number')

    if (!numbers) return

    const header = 'Número,Status,Comprador,Telefone,Vendedor,Valor Cobrado,Desconto,Pagamento\n'
    const rows = numbers.map((n: any) => {
      return `${n.number},${n.status},"${n.buyer?.name || ''}","${n.buyer?.phone || ''}","${n.seller?.full_name || ''}",${n.amount_charged || 0},${n.discount || 0},${n.payment_status || ''}`
    }).join('\n')

    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rifa-elevare-completa-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado!')
  }

  async function handleDraw() {
    if (!drawConfirm) {
      setDrawConfirm(true)
      return
    }

    setDrawing(true)

    // Get all sold numbers
    const { data: soldNumbers } = await supabase
      .from('raffle_numbers')
      .select('number')
      .eq('status', 'sold')

    if (!soldNumbers || soldNumbers.length === 0) {
      toast.error('Nenhum número vendido para sortear!')
      setDrawing(false)
      setDrawConfirm(false)
      return
    }

    const allSold = soldNumbers.map((n) => n.number)

    // Animation - cycling numbers
    let cycles = 0
    const maxCycles = 30
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * allSold.length)
      setDrawNumber(allSold[randomIndex])
      cycles++

      if (cycles >= maxCycles) {
        clearInterval(interval)

        // Pick the winner
        const winnerIndex = Math.floor(Math.random() * allSold.length)
        const winnerNumber = allSold[winnerIndex]
        setDrawNumber(winnerNumber)

        // Save result
        if (settings) {
          supabase
            .from('settings')
            .update({
              raffle_drawn: true,
              raffle_winner_number: winnerNumber,
              raffle_drawn_at: new Date().toISOString(),
            })
            .eq('id', settings.id)
            .then(() => {
              fetchSettings()
              toast.success(`🎉 Número sorteado: ${winnerNumber}!`)
            })
        }
        setDrawing(false)
      }
    }, 100 + cycles * 15)
  }

  if (loading || authLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-elevare-border rounded w-1/3 animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-elevare-card border border-elevare-border rounded-xl p-4 animate-pulse">
            <div className="h-5 bg-elevare-border rounded w-1/4 mb-3" />
            <div className="h-10 bg-elevare-border rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-elevare-text flex items-center gap-3">
        <SettingsIcon className="w-7 h-7 text-elevare-accent" />
        Configurações
      </h1>

      {/* Settings Form */}
      <div className="bg-elevare-card border border-elevare-border rounded-xl p-5 space-y-5">
        <h2 className="text-lg font-semibold text-elevare-text">Dados da Rifa</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">Preço por número (R$)</label>
            <input
              type="number"
              value={pricePerNumber}
              onChange={(e) => setPricePerNumber(Number(e.target.value))}
              min={0}
              step={0.01}
              className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">Total de números</label>
            <input
              type="number"
              value={totalNumbers}
              onChange={(e) => setTotalNumbers(Number(e.target.value))}
              min={1}
              className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">Chave Pix</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="flex-1 px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
            />
            <button
              onClick={handleCopyPix}
              className="px-4 py-3 bg-elevare-secondary border border-elevare-border rounded-xl text-elevare-text/60 hover:text-elevare-accent transition-colors cursor-pointer"
            >
              {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">Descrição do prêmio</label>
          <input
            type="text"
            value={prizeDescription}
            onChange={(e) => setPrizeDescription(e.target.value)}
            className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">Instagram URL</label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">Website URL</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">Número WhatsApp</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="5511999999999"
              className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-elevare-text/60 font-medium mb-1.5">Expiração da reserva (horas)</label>
            <input
              type="number"
              value={reservationExpiryHours}
              onChange={(e) => setReservationExpiryHours(Number(e.target.value))}
              min={1}
              className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-elevare-accent text-elevare-bg font-semibold rounded-xl hover:bg-elevare-accent/90 transition-colors disabled:opacity-50 cursor-pointer text-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      {/* Export Section */}
      <div className="bg-elevare-card border border-elevare-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-elevare-text">Exportar Dados</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-3 bg-elevare-secondary border border-elevare-border rounded-xl text-sm text-elevare-text/80 hover:bg-elevare-border transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV Completo
          </button>
          <button
            onClick={generateWhatsAppList}
            className="flex items-center gap-2 px-4 py-3 bg-elevare-secondary border border-elevare-border rounded-xl text-sm text-elevare-text/80 hover:bg-elevare-border transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            Copiar Lista para WhatsApp
          </button>
        </div>
      </div>

      {/* Raffle Draw Section */}
      <div className="bg-elevare-card border border-elevare-border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-elevare-text flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-elevare-yellow" />
          Sorteio
        </h2>

        {settings?.raffle_drawn ? (
          <div className="bg-elevare-yellow/10 border border-elevare-yellow/30 rounded-xl p-6 text-center">
            <Trophy className="w-12 h-12 text-elevare-yellow mx-auto mb-3" />
            <p className="text-elevare-yellow font-bold text-xl mb-1">
              Rifa Sorteada!
            </p>
            <p className="text-3xl font-bold text-elevare-text mb-2">
              Número {settings.raffle_winner_number}
            </p>
            {settings.raffle_drawn_at && (
              <p className="text-sm text-elevare-text/50">
                Sorteado em {new Date(settings.raffle_drawn_at).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
              </p>
            )}
          </div>
        ) : (
          <>
            {drawConfirm && !drawing && (
              <div className="bg-elevare-red/10 border border-elevare-red/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-elevare-red mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-elevare-red font-medium">Tem certeza?</p>
                  <p className="text-xs text-elevare-text/50 mt-1">
                    Isso encerrará as vendas permanentemente. O sorteio será registrado e não poderá ser desfeito.
                  </p>
                </div>
              </div>
            )}

            {drawing && drawNumber !== null && (
              <div className="text-center py-8">
                <div className="text-6xl font-bold text-elevare-accent animate-bounce">
                  {drawNumber}
                </div>
                <p className="text-sm text-elevare-text/50 mt-3">Sorteando...</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDraw}
                disabled={drawing}
                className="flex items-center gap-2 px-6 py-3 bg-elevare-yellow text-elevare-bg font-bold rounded-xl hover:bg-elevare-yellow/90 transition-colors disabled:opacity-50 cursor-pointer text-sm"
              >
                <Sparkles className="w-4 h-4" />
                {drawConfirm ? 'Confirmar Sorteio' : 'Realizar Sorteio'}
              </button>
              {drawConfirm && !drawing && (
                <button
                  onClick={() => setDrawConfirm(false)}
                  className="px-4 py-3 bg-elevare-secondary border border-elevare-border rounded-xl text-sm text-elevare-text/70 hover:bg-elevare-border transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

