import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Profile } from '../types'
import { formatCurrency } from '../lib/utils'
import toast from 'react-hot-toast'
import {
  Trophy,
  UserPlus,
  X,
  Eye,
  EyeOff,
  Hash,
  DollarSign,
} from 'lucide-react'

interface SellerStats extends Profile {
  numbersSold: number
  totalCollected: number
}

export function SellersPage() {
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [sellers, setSellers] = useState<SellerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      navigate('/')
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate])

  useEffect(() => {
    fetchSellers()
  }, [])

  async function fetchSellers() {
    setLoading(true)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('active', true)
      .order('full_name')

    const { data: numbers } = await supabase
      .from('raffle_numbers')
      .select('seller_id, amount_charged, status')
      .in('status', ['sold', 'reserved'])

    const sellerMap = new Map<string, { count: number; total: number }>()
    ;(numbers || []).forEach((n) => {
      if (!n.seller_id) return
      const existing = sellerMap.get(n.seller_id) || { count: 0, total: 0 }
      existing.count++
      existing.total += n.amount_charged || 0
      sellerMap.set(n.seller_id, existing)
    })

    const stats: SellerStats[] = (profiles || []).map((p) => {
      const s = sellerMap.get(p.id) || { count: 0, total: 0 }
      return { ...p, numbersSold: s.count, totalCollected: s.total }
    })

    stats.sort((a, b) => b.numbersSold - a.numbersSold)
    setSellers(stats)
    setLoading(false)
  }

  async function handleAddSeller(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return

    setAddLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: newEmail.trim(),
        password: newPassword.trim(),
        options: {
          data: {
            full_name: newName.trim(),
            role: 'seller',
          },
        },
      })

      if (error) throw error

      toast.success(`Vendedor ${newName.trim()} cadastrado!`)
      setShowAddForm(false)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      fetchSellers()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao cadastrar vendedor')
    } finally {
      setAddLoading(false)
    }
  }

  const medals = ['🥇', '🥈', '🥉']

  if (loading || authLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-elevare-border rounded w-1/3 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-elevare-card border border-elevare-border rounded-xl p-4 animate-pulse">
            <div className="h-5 bg-elevare-border rounded w-1/2 mb-2" />
            <div className="h-4 bg-elevare-border rounded w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-elevare-text flex items-center gap-3">
          <Trophy className="w-7 h-7 text-elevare-accent" />
          Ranking de Vendedores
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-elevare-accent text-elevare-bg font-semibold rounded-xl text-sm hover:bg-elevare-accent/90 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Novo Vendedor
        </button>
      </div>

      {/* Add Seller Form */}
      {showAddForm && (
        <div className="bg-elevare-card border border-elevare-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-elevare-text">Cadastrar Vendedor</h3>
            <button onClick={() => setShowAddForm(false)} className="text-elevare-text/50 hover:text-elevare-text cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddSeller} className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome completo"
              required
              className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="E-mail"
              required
              className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Senha (mín. 6 caracteres)"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-xl text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 text-sm pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-elevare-text/40 hover:text-elevare-text/70 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="w-full py-3 bg-elevare-accent text-elevare-bg font-semibold rounded-xl hover:bg-elevare-accent/90 transition-colors disabled:opacity-50 cursor-pointer text-sm"
            >
              {addLoading ? 'Cadastrando...' : 'Cadastrar Vendedor'}
            </button>
          </form>
        </div>
      )}

      {/* Sellers List */}
      <div className="space-y-3">
        {sellers.map((seller, index) => (
          <div
            key={seller.id}
            className="bg-elevare-card border border-elevare-border rounded-xl p-4 flex items-center gap-4"
          >
            <div className="text-2xl w-10 text-center shrink-0">
              {index < 3 ? medals[index] : (
                <span className="text-sm text-elevare-text/40 font-bold">{index + 1}º</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-elevare-text truncate">{seller.full_name}</h3>
              <p className="text-xs text-elevare-text/50">{seller.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-lg mt-1 inline-block ${
                seller.role === 'admin'
                  ? 'bg-elevare-yellow/10 text-elevare-yellow'
                  : 'bg-elevare-accent/10 text-elevare-accent'
              }`}>
                {seller.role === 'admin' ? 'Admin' : 'Vendedor'}
              </span>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="text-center">
                <div className="flex items-center gap-1 text-elevare-text/50">
                  <Hash className="w-3 h-3" />
                  <span className="text-xs">Números</span>
                </div>
                <p className="text-lg font-bold text-elevare-accent">{seller.numbersSold}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-elevare-text/50">
                  <DollarSign className="w-3 h-3" />
                  <span className="text-xs">Arrecadado</span>
                </div>
                <p className="text-lg font-bold text-elevare-accent">{formatCurrency(seller.totalCollected)}</p>
              </div>
            </div>
          </div>
        ))}

        {sellers.length === 0 && (
          <div className="text-center py-12 text-elevare-text/40">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum vendedor cadastrado</p>
          </div>
        )}
      </div>
    </div>
  )
}

