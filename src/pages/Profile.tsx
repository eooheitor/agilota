import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ROLE_LABEL: Record<string, string> = {
  recebedor: 'Recebedor',
  pagador: 'Pagador',
}

export function Profile() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [nameStatus, setNameStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [nameError, setNameError] = useState('')
  const [nameLoading, setNameLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passStatus, setPassStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [passError, setPassError] = useState('')
  const [passLoading, setPassLoading] = useState(false)

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  const handleNameSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setNameLoading(true)
    setNameStatus('idle')
    const { error } = await updateProfile({ name: name.trim() })
    if (error) {
      setNameError(error)
      setNameStatus('error')
    } else {
      setNameStatus('success')
    }
    setNameLoading(false)
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPassStatus('idle')
    if (newPassword !== confirmPassword) {
      setPassError('As senhas não coincidem')
      setPassStatus('error')
      return
    }
    setPassLoading(true)
    const { error } = await updateProfile({ current_password: currentPassword, new_password: newPassword })
    if (error) {
      setPassError(error)
      setPassStatus('error')
    } else {
      setPassStatus('success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setPassLoading(false)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Minha conta</h1>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 flex items-center gap-3">
        <div className="bg-indigo-200 rounded-full w-10 h-10 flex items-center justify-center text-indigo-700 font-bold text-lg flex-shrink-0">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email} · {ROLE_LABEL[user?.role ?? '']}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Nome */}
        <form onSubmit={handleNameSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Alterar nome</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameStatus('idle') }}
              required
              className={inputClass}
            />
          </div>

          {nameStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Nome atualizado com sucesso
            </div>
          )}
          {nameStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {nameError}
            </div>
          )}

          <button
            type="submit"
            disabled={nameLoading || name.trim() === user?.name}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {nameLoading ? 'Salvando...' : 'Salvar nome'}
          </button>
        </form>

        {/* Senha */}
        <form onSubmit={handlePasswordSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Alterar senha</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPassStatus('idle') }}
              required
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPassStatus('idle') }}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPassStatus('idle') }}
              required
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {passStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Senha alterada com sucesso
            </div>
          )}
          {passStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {passError}
            </div>
          )}

          <button
            type="submit"
            disabled={passLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {passLoading ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
