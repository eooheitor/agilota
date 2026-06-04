import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Receipt, PlusCircle, LogOut, Zap, CheckCircle2, UserCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ROLE_LABEL: Record<string, string> = {
  recebedor: 'Recebedor',
  pagador: 'Pagador',
}

function getNavItems(role: string) {
  if (role === 'recebedor') {
    return [
      { to: '/', icon: LayoutDashboard, label: 'Início' },
      { to: '/consorcio/novo', icon: PlusCircle, label: 'Novo' },
      { to: '/pagamentos', icon: CheckCircle2, label: 'Confirmar' },
    ]
  }
  return [
    { to: '/', icon: LayoutDashboard, label: 'Início' },
    { to: '/pagamentos', icon: Receipt, label: 'Histórico' },
    { to: '/pagamentos/novo', icon: PlusCircle, label: 'Pagar' },
  ]
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  const navItems = getNavItems(user?.role ?? 'pagador')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-5 h-5 fill-white" />
            <span className="font-extrabold text-lg tracking-tight">AgilOta</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => navigate('/perfil')}
                className="hidden sm:flex flex-col items-end hover:opacity-80 transition-opacity"
              >
                <span className="text-sm text-white font-medium">{user.name}</span>
                <span className="text-xs text-indigo-200">{ROLE_LABEL[user.role]}</span>
              </button>
            )}
            <button
              onClick={() => navigate('/perfil')}
              className="sm:hidden text-indigo-100 hover:text-white transition-colors"
              title="Minha conta"
            >
              <UserCircle className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 text-indigo-100 hover:text-white transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
