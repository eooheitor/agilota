import { useState, FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Zap, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types'

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'pagador', label: 'Pagador', desc: 'Registra pagamentos' },
  { value: 'recebedor', label: 'Recebedor', desc: 'Cria e confirma' },
]

export function Login() {
  const { user, signIn, register } = useAuth()
  const navigate = useNavigate()
  const [isRegistering, setIsRegistering] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('pagador')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = isRegistering
      ? await register(name, email, password, role)
      : await signIn(email, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 rounded-2xl p-3 mb-3">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">AgilOta</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRegistering ? 'Criar conta' : 'Entrar na sua conta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Heitor"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de conta</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex flex-col items-center p-2.5 rounded-lg border-2 text-xs font-medium transition-colors ${
                        role === r.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-semibold">{r.label}</span>
                      <span className={`mt-0.5 font-normal ${role === r.value ? 'text-indigo-500' : 'text-gray-400'}`}>
                        {r.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Aguarde...' : isRegistering ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError('') }}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            {isRegistering ? 'Já tenho conta — Entrar' : 'Primeira vez? Criar conta'}
          </button>
        </div>
      </div>
    </div>
  )
}
