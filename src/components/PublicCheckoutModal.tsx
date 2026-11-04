import { useState } from 'react'
import {
  X,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { formatCurrency } from '../lib/utils'

interface PublicCheckoutModalProps {
  open: boolean
  onClose: () => void
  selectedNumbers: number[]
  pricePerNumber: number
  onConfirmReservation: (data: {
    buyerName: string
    buyerPhone: string
    numbers: number[]
    totalAmount: number
  }) => Promise<{ success: boolean; error?: string }>
}

function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.073.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
    </svg>
  )
}

export function PublicCheckoutModal({
  open,
  onClose,
  selectedNumbers,
  pricePerNumber,
  onConfirmReservation,
}: PublicCheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [pixCopied, setPixCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!open) return null

  const totalAmount = selectedNumbers.length * pricePerNumber
  const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b)
  const numbersStr = sortedNumbers.map((n) => String(n).padStart(3, '0')).join(', ')

  const pixKey = 'elevare.fecap@gmail.com'
  const whatsappNumber = '5511993309871' // (11) 99330-9871

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    }
    if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }
    setBuyerPhone(formatted)
  }

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixKey)
      setPixCopied(true)
      setTimeout(() => setPixCopied(false), 2500)
    } catch {
      // fallback
    }
  }

  const handleAdvanceToPix = (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyerName.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.')
      return
    }
    const rawPhone = buyerPhone.replace(/\D/g, '')
    if (rawPhone.length < 10) {
      setErrorMessage('Por favor, informe um número de WhatsApp válido.')
      return
    }
    setErrorMessage('')
    setStep(2)
  }

  const handleAdvanceToWhatsApp = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      // Cria a reserva atômica no banco de dados para travar os números
      const res = await onConfirmReservation({
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        numbers: sortedNumbers,
        totalAmount,
      })

      if (!res.success) {
        setErrorMessage(res.error || 'Não foi possível reservar esses números. Tente outros.')
        setStep(1)
        setLoading(false)
        return
      }

      setStep(3)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro de conexão ao reservar.')
    } finally {
      setLoading(false)
    }
  }

  const getWhatsAppLink = () => {
    const text = encodeURIComponent(
      `Olá! Acabei de escolher os números [${numbersStr}] na Rifa ELEVARE para ${buyerName.trim()}.\n\nSegue o meu comprovante do Pix no valor de ${formatCurrency(totalAmount)} para validação:`
    )
    return `https://wa.me/${whatsappNumber}?text=${text}`
  }

  const handleOpenWhatsApp = () => {
    window.open(getWhatsAppLink(), '_blank')
    setStep(4)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-elevare-card border border-elevare-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-elevare-border bg-elevare-secondary/40">
          <div>
            <span className="text-xs text-elevare-accent font-semibold tracking-wider uppercase">
              Rifa Beneficente ELEVARE
            </span>
            <h2 className="text-lg font-bold text-elevare-text">
              {step === 1 && '1. Seus Dados'}
              {step === 2 && '2. Pagamento via Pix'}
              {step === 3 && '3. Enviar Comprovante'}
              {step === 4 && 'Reserva Concluída!'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-elevare-text/50 hover:text-elevare-text hover:bg-elevare-secondary transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-elevare-border/60 bg-elevare-input/60 px-5 py-2.5 text-xs text-elevare-text/60 gap-4 justify-between">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-elevare-accent font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono">1</span>
            <span>Identificação</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-elevare-accent font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono">2</span>
            <span>Pix</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-elevare-accent font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono">3</span>
            <span>Comprovante</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-elevare-red/15 border border-elevare-red/40 text-elevare-red text-xs">
              {errorMessage}
            </div>
          )}

          {/* Numbers Summary Badge */}
          <div className="p-3.5 rounded-xl bg-elevare-input/70 border border-elevare-border flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-elevare-text/50">Números escolhidos ({selectedNumbers.length}):</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {sortedNumbers.map((num) => (
                  <span
                    key={num}
                    className="px-2 py-0.5 rounded bg-elevare-accent/20 text-elevare-accent font-mono font-bold text-xs"
                  >
                    {String(num).padStart(3, '0')}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-elevare-text/50">Total:</p>
              <p className="text-lg font-bold text-elevare-accent">{formatCurrency(totalAmount)}</p>
            </div>
          </div>

          {/* STEP 1: Dados do Comprador */}
          {step === 1 && (
            <form onSubmit={handleAdvanceToPix} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-elevare-text/70 mb-1.5">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Ex: Maria da Silva"
                  className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-elevare-text/70 mb-1.5">
                  Seu WhatsApp com DDD *
                </label>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
                />
                <p className="text-[11px] text-elevare-text/40 mt-1">
                  Usaremos para validar o seu bilhete e avisar em caso de premiação!
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm text-elevare-text/60 hover:text-elevare-text hover:bg-elevare-secondary transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-elevare-accent text-elevare-bg font-bold text-sm hover:bg-elevare-accent/90 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-elevare-accent/20"
                >
                  <span>Continuar para o Pix</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Instruções do Pix */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-elevare-secondary/40 border border-elevare-border text-center space-y-2">
                <p className="text-xs text-elevare-text/60 uppercase tracking-wide font-medium">
                  Valor a transferir
                </p>
                <p className="text-3xl font-extrabold text-elevare-accent">
                  {formatCurrency(totalAmount)}
                </p>
                <p className="text-xs text-elevare-text/70">
                  Transfira exatamente o valor acima via Pix para a chave abaixo:
                </p>
              </div>

              {/* Chave Pix Box */}
              <div>
                <label className="block text-xs font-semibold text-elevare-text/70 mb-1.5">
                  Chave Pix (E-mail oficial ELEVARE)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl font-mono text-sm text-elevare-text select-all flex items-center">
                    {pixKey}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-elevare-accent text-elevare-bg font-bold text-xs hover:bg-elevare-accent/90 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    {pixCopied ? (
                      <>
                        <Check size={16} />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copiar Chave</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-elevare-yellow/10 border border-elevare-yellow/30 text-xs text-elevare-yellow flex items-start gap-2.5">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Atenção:</strong> Após realizar o Pix no seu banco, guarde o print do comprovante para enviar no próximo passo e garantir seus números.
                </span>
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-elevare-text/60 hover:text-elevare-text transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Voltar</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleAdvanceToWhatsApp}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-elevare-accent text-elevare-bg font-bold text-sm hover:bg-elevare-accent/90 transition-transform active:scale-95 cursor-pointer disabled:opacity-50 shadow-lg shadow-elevare-accent/20"
                >
                  {loading ? (
                    <span>Bloqueando números...</span>
                  ) : (
                    <>
                      <span>Já fiz o Pix / Enviar Comprovante</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Envio de Comprovante no WhatsApp */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center p-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <WhatsAppIcon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-elevare-text">
                  Último passo: Enviar o Comprovante
                </h3>
                <p className="text-xs text-elevare-text/70 mt-1 max-w-sm mx-auto">
                  Seus números foram <strong>pré-reservados</strong> no sistema para que ninguém mais possa escolhê-los.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-elevare-input border border-elevare-border space-y-2 text-xs text-elevare-text/80">
                <p>
                  Para o administrador <strong>autorizar e confirmar</strong> seus números definitivamente, clique no botão verde abaixo para abrir o WhatsApp oficial da ELEVARE e enviar o print do comprovante:
                </p>
                <p className="font-semibold text-elevare-accent text-sm text-center pt-1">
                  WhatsApp Oficial: (11) 99330-9871
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-sm transition-all duration-150 active:scale-95 cursor-pointer shadow-xl shadow-emerald-900/40"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  <span>Enviar Comprovante no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full py-2.5 text-center text-xs text-elevare-text/50 hover:text-elevare-text transition-colors cursor-pointer"
                >
                  Já enviei meu comprovante / Concluir
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Concluído com Sucesso */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-elevare-accent/20 text-elevare-accent flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-elevare-text">
                  Reserva Registrada com Sucesso!
                </h3>
                <p className="text-xs text-elevare-text/70 max-w-sm mx-auto">
                  Obrigado por apoiar o projeto acadêmico <strong>ELEVARE (FECAP)</strong>!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-elevare-input/80 border border-elevare-border text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-elevare-text/50">Comprador:</span>
                  <span className="font-semibold text-elevare-text">{buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-elevare-text/50">WhatsApp:</span>
                  <span className="font-mono text-elevare-text">{buyerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-elevare-text/50">Números:</span>
                  <span className="font-mono font-bold text-elevare-accent">{numbersStr}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-elevare-border">
                  <span className="text-elevare-text/50">Status:</span>
                  <span className="text-elevare-yellow font-semibold flex items-center gap-1">
                    <Clock size={12} /> Aguardando autorização do admin
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-elevare-secondary/50 text-[11px] text-elevare-text/70 text-center flex items-center justify-center gap-1.5">
                <Sparkles size={14} className="text-elevare-yellow shrink-0" />
                <span>Assim que o admin validar o comprovante no WhatsApp, seus bilhetes estarão 100% ativos!</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-elevare-accent text-elevare-bg font-bold text-sm hover:bg-elevare-accent/90 transition-all cursor-pointer"
              >
                Voltar para a Rifa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
