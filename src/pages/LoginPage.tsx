import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Leaf, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await signIn(email, password)
    if (err) {
      setError(err?.message || 'Erro ao fazer login. Verifique suas credenciais.')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-elevare-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-elevare-secondary mb-4">
            <Leaf className="w-10 h-10 text-elevare-accent" />
          </div>
          <h1 className="text-3xl font-bold text-elevare-text tracking-wider">
            ELEVARE
          </h1>
          <p className="text-elevare-accent mt-2 text-sm italic">
            Doar hoje. Transformar amanhã.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-elevare-card border border-elevare-border rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-elevare-text mb-6 text-center">
            Área Restrita
          </h2>

          {error && (
            <div className="bg-elevare-red/20 border border-elevare-red/40 text-elevare-red rounded-lg p-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-elevare-text/70 mb-1">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-lg text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 focus:border-elevare-accent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-elevare-text/70 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-elevare-input border border-elevare-border rounded-lg text-elevare-text placeholder-elevare-text/30 focus:outline-none focus:ring-2 focus:ring-elevare-accent/50 focus:border-elevare-accent transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-elevare-text/40 hover:text-elevare-text/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-elevare-accent text-elevare-bg font-semibold rounded-lg hover:bg-elevare-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-elevare-bg/30 border-t-elevare-bg rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-elevare-text/50 hover:text-elevare-accent transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a rifa pública
          </Link>
        </div>
      </div>
    </div>
  )
}
