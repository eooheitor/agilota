import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, UserPlus, Trash2, AlertCircle } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { ConsortiumMember, Consortium, User } from '../types'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando',
  accepted: 'Aceito',
  rejected: 'Recusado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  accepted: 'text-green-700 bg-green-50 border-green-200',
  rejected: 'text-red-600 bg-red-50 border-red-200',
}

export function ManageMembers() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [consortium, setConsortium] = useState<Consortium | null>(null)
  const [members, setMembers] = useState<ConsortiumMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiFetch<Consortium[]>('/consortiums'),
      apiFetch<ConsortiumMember[]>(`/consortiums/${id}/members`),
      apiFetch<User[]>('/auth/users'),
    ]).then(([consortiums, memberList, users]) => {
      setConsortium(consortiums.find((c) => c.id === Number(id)) ?? null)
      setMembers(memberList)
      setAvailableUsers(users)
    }).finally(() => setLoading(false))
  }, [id])

  const memberIds = new Set(members.map((m) => m.id))
  const nonMembers = availableUsers.filter((u) => !memberIds.has(u.id) && u.role === 'pagador')

  const handleAdd = async () => {
    if (!selectedUserId) return
    setError('')
    setAdding(true)
    try {
      const member = await apiFetch<ConsortiumMember>(`/consortiums/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: Number(selectedUserId) }),
      })
      setMembers((m) => [...m, member])
      setSelectedUserId('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (userId: number) => {
    if (!confirm('Remover este membro?')) return
    setRemoving(userId)
    try {
      await apiFetch(`/consortiums/${id}/members/${userId}`, { method: 'DELETE' })
      setMembers((m) => m.filter((x) => x.id !== userId))
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pagadores</h1>
          {consortium && <p className="text-xs text-gray-500">{consortium.name}</p>}
        </div>
      </div>

      {/* Current members */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Pagadores vinculados</h2>
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum pagador vinculado ainda.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium border rounded-full px-2.5 py-0.5 ${STATUS_COLORS[m.status]}`}>
                    {STATUS_LABEL[m.status]}
                  </span>
                  <button
                    onClick={() => handleRemove(m.id)}
                    disabled={removing === m.id}
                    className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add member */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-indigo-500" />
          Adicionar pagador
        </h2>

        {nonMembers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">
            Nenhum pagador disponível para adicionar.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Usuário</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Selecione um usuário</option>
                {nonMembers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={!selectedUserId || adding}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {adding ? 'Adicionando...' : 'Adicionar pagador'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
