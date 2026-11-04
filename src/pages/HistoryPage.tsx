import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { AuditLog } from '../types'
import { formatDate } from '../lib/utils'
import {
  History,
  ShoppingCart,
  CheckCircle2,
  Trash2,
  Settings,
  UserPlus,
  ChevronDown,
} from 'lucide-react'

const actionConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  sale_created: { label: 'Venda registrada', icon: <ShoppingCart className="w-4 h-4" />, color: 'text-elevare-accent' },
  payment_confirmed: { label: 'Pagamento confirmado', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-elevare-accent' },
  numbers_released: { label: 'Números liberados', icon: <Trash2 className="w-4 h-4" />, color: 'text-elevare-red' },
  settings_updated: { label: 'Configurações atualizadas', icon: <Settings className="w-4 h-4" />, color: 'text-elevare-yellow' },
  seller_created: { label: 'Vendedor cadastrado', icon: <UserPlus className="w-4 h-4" />, color: 'text-sky-400' },
}

export function HistoryPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const PAGE_SIZE = 30

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, authLoading, navigate])

  useEffect(() => {
    fetchLogs(true)
  }, [actionFilter])

  async function fetchLogs(reset = false) {
    const currentPage = reset ? 0 : page
    setLoading(true)

    let query = supabase
      .from('audit_log')
      .select('*, user:profiles(*)')
      .order('created_at', { ascending: false })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)

    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar histórico:', error)
    } else {
      if (reset) {
        setLogs((data || []) as AuditLog[])
        setPage(0)
      } else {
        setLogs((prev) => [...prev, ...((data || []) as AuditLog[])])
      }
      setHasMore((data || []).length === PAGE_SIZE)
    }
    setLoading(false)
  }

  function loadMore() {
    setPage((prev) => prev + 1)
    fetchLogs(false)
  }

  function formatDetails(log: AuditLog): string {
    if (!log.details) return ''
    const d = log.details

    if (d.buyer_name && d.numbers) {
      const nums = Array.isArray(d.numbers) ? d.numbers.join(', ') : d.numbers
      return `${d.buyer_name} → nº ${nums} (${d.status === 'sold' ? 'vendido' : 'reservado'})`
    }
    if (d.numbers) {
      const nums = Array.isArray(d.numbers) ? d.numbers.join(', ') : d.numbers
      return `Números: ${nums}`
    }
    return JSON.stringify(d)
  }

  if (authLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-elevare-border rounded w-1/3 animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-elevare-card border border-elevare-border rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-elevare-border rounded w-1/2 mb-2" />
            <div className="h-3 bg-elevare-border rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-elevare-text flex items-center gap-3">
        <History className="w-7 h-7 text-elevare-accent" />
        Histórico
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'sale_created', label: 'Vendas' },
          { key: 'payment_confirmed', label: 'Pagamentos' },
          { key: 'numbers_released', label: 'Liberações' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActionFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              actionFilter === key
                ? 'bg-elevare-accent text-elevare-bg'
                : 'bg-elevare-secondary/50 text-elevare-text/60 hover:bg-elevare-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Log List */}
      {logs.length === 0 && !loading ? (
        <div className="text-center py-12 text-elevare-text/40">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const config = actionConfig[log.action] || {
              label: log.action,
              icon: <History className="w-4 h-4" />,
              color: 'text-elevare-text/60',
            }

            return (
              <div
                key={log.id}
                className="bg-elevare-card border border-elevare-border rounded-xl p-4 flex items-start gap-3"
              >
                <div className={`mt-0.5 ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-sm ${config.color}`}>{config.label}</span>
                    {log.user && (
                      <span className="text-xs text-elevare-text/40">
                        por {(log.user as any).full_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-elevare-text/50 mt-1">{formatDetails(log)}</p>
                  <p className="text-xs text-elevare-text/30 mt-1">{formatDate(log.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-elevare-accent/30 border-t-elevare-accent rounded-full animate-spin" />
        </div>
      )}

      {hasMore && !loading && logs.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            className="flex items-center gap-2 px-6 py-3 bg-elevare-secondary border border-elevare-border rounded-xl text-sm text-elevare-text/70 hover:bg-elevare-border transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
            Carregar mais
          </button>
        </div>
      )}
    </div>
  )
}

