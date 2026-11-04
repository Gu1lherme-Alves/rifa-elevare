export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPhone(phone: string | null): string {
  if (!phone) return '—'
  return phone.replace(/\D/g, '').replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function generateWhatsAppMessage(buyerName: string, numbers: number[]): string {
  const sorted = [...numbers].sort((a, b) => a - b)
  return `Olá, ${buyerName}! Seus números na Rifa ELEVARE: ${sorted.join(', ')}. Obrigado por ajudar! Boa sorte 🍀`
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
