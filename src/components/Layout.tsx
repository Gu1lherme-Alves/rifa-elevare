import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  Trophy,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Lock,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  requiresAuth?: boolean
  requiresAdmin?: boolean
}

export function Layout() {
  const { isAuthenticated, isAdmin, profile, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems: NavItem[] = [
    {
      to: '/',
      label: 'Início',
      icon: <LayoutDashboard size={20} />,
    },
    {
      to: '/buyers',
      label: 'Compradores',
      icon: <Users size={20} />,
      requiresAuth: true,
    },
    {
      to: '/sellers',
      label: 'Vendedores',
      icon: <Trophy size={20} />,
      requiresAdmin: true,
    },
    {
      to: '/history',
      label: 'Histórico',
      icon: <History size={20} />,
      requiresAuth: true,
    },
    {
      to: '/settings',
      label: 'Configurações',
      icon: <Settings size={20} />,
      requiresAdmin: true,
    },
  ]

  const visibleNavItems = navItems.filter((item) => {
    if (item.requiresAdmin && !isAdmin) return false
    if (item.requiresAuth && !isAuthenticated) return false
    return true
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-elevare-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-elevare-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-elevare-text/60 text-sm">Carregando...</span>
        </div>
      </div>
    )
  }

  // Visualização Pública (sem login)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-elevare-bg relative">
        <main className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
          <Outlet />
        </main>

        {/* Botão discreto no canto inferior esquerdo para login de Adm/Vendedor */}
        <div className="fixed bottom-4 left-4 z-40">
          <NavLink
            to="/login"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-elevare-card/90 hover:bg-elevare-card text-elevare-text/40 hover:text-elevare-accent border border-elevare-border/70 hover:border-elevare-accent/40 shadow-xl backdrop-blur-md text-xs font-medium transition-all duration-200 group cursor-pointer"
            title="Acesso Administrativo"
          >
            <Lock size={14} className="text-elevare-accent/60 group-hover:text-elevare-accent group-hover:scale-110 transition-all" />
            <span>Área Restrita</span>
          </NavLink>
        </div>
      </div>
    )
  }

  // Visualização Autenticada (Admin / Vendedor)
  return (
    <div className="min-h-screen bg-elevare-bg flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-elevare-card border-r border-elevare-border min-h-screen fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-elevare-border">
          <h1 className="text-xl font-bold tracking-wider">
            <span className="text-elevare-accent">RIFA</span>{' '}
            <span className="text-elevare-yellow">ELEVARE</span>
          </h1>
          {profile && (
            <p className="text-xs text-elevare-text/50 mt-1 truncate">
              {profile.full_name}
              <span className="ml-1 text-elevare-accent/60">
                ({profile.role === 'admin' ? 'Admin' : 'Vendedor'})
              </span>
            </p>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-elevare-accent/15 text-elevare-accent'
                    : 'text-elevare-text/70 hover:bg-elevare-secondary/50 hover:text-elevare-text'
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-elevare-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-elevare-red/80 hover:bg-elevare-red/10 hover:text-elevare-red transition-all duration-200 cursor-pointer"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-elevare-card/95 backdrop-blur-md border-b border-elevare-border">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold tracking-wider">
            <span className="text-elevare-accent">RIFA</span>{' '}
            <span className="text-elevare-yellow">ELEVARE</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-elevare-text/60 hover:text-elevare-red transition-colors cursor-pointer"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-elevare-text/60 hover:text-elevare-text transition-colors cursor-pointer"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {sidebarOpen && (
          <div className="border-t border-elevare-border bg-elevare-card px-4 py-3 space-y-1">
            {profile && (
              <p className="text-xs text-elevare-text/50 px-3 pb-2 truncate">
                {profile.full_name} ({profile.role === 'admin' ? 'Admin' : 'Vendedor'})
              </p>
            )}
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-elevare-accent/15 text-elevare-accent'
                      : 'text-elevare-text/70 hover:bg-elevare-secondary/50 hover:text-elevare-text'
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-elevare-card/95 backdrop-blur-md border-t border-elevare-border safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {visibleNavItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] min-h-[44px] justify-center transition-all duration-200',
                  isActive
                    ? 'text-elevare-accent'
                    : 'text-elevare-text/50 hover:text-elevare-text/80'
                )
              }
            >
              {item.icon}
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-14 pb-20 md:pt-0 md:pb-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
