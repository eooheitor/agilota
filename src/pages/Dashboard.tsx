import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, TrendingUp, Calendar, CheckCircle2, Clock, Users, XCircle, Bell } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { apiFetch, formatMoney } from '../lib/api'
import { Consortium, Payment, ConsortiumStats, Invite } from '../types'
import { StatCard } from '../components/StatCard'
import { useAuth } from '../contexts/AuthContext'

function computeStats(consortium: Consortium, payments: Payment[]): ConsortiumStats {
  const confirmed = payments.filter((p) => p.status === 'confirmed')
  const totalPaid = confirmed.reduce((s, p) => s + p.installment_amount + p.extra_amount, 0)
  const totalExtra = confirmed.reduce((s, p) => s + p.extra_amount, 0)
  const installmentsPaid = confirmed.length
  const remaining = Math.max(0, consortium.total_value - totalPaid)
  const percentagePaid = Math.min(100, (totalPaid / consortium.total_value) * 100)
  const installmentsRemaining = Math.max(0, consortium.total_installments - installmentsPaid)
  return { totalPaid, totalExtra, installmentsPaid, remaining, percentagePaid, installmentsRemaining }
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Confirmado
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Rejeitado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Pendente
    </span>
  )
}

function InviteCard({ invite, onAccept, onReject }: { invite: Invite; onAccept: () => void; onReject: () => void }) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)

  const handle = async (action: 'accept' | 'reject') => {
    setLoading(action)
    try {
      await apiFetch(`/consortiums/${invite.id}/invite/${action}`, { method: 'POST' })
      action === 'accept' ? onAccept() : onReject()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white border-2 border-indigo-200 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-indigo-100 rounded-full p-2 flex-shrink-0 mt-0.5">
          <Bell className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">{invite.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">Convite de {invite.recebedor_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-gray-400 mb-0.5">Valor total</p>
          <p className="font-semibold text-gray-900">{formatMoney(invite.total_value)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-gray-400 mb-0.5">Parcela mensal</p>
          <p className="font-semibold text-gray-900">{formatMoney(invite.installment_value)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-gray-400 mb-0.5">Nº de parcelas</p>
          <p className="font-semibold text-gray-900">{invite.total_installments}x</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-gray-400 mb-0.5">
            {invite.interest_rate > 0 ? 'Juros a.m.' : 'Juros'}
          </p>
          <p className="font-semibold text-gray-900">
            {invite.interest_rate > 0 ? `${invite.interest_rate}%` : 'Sem juros'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 col-span-2">
          <p className="text-gray-400 mb-0.5">Início</p>
          <p className="font-semibold text-gray-900">
            {format(parseISO(invite.start_date), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handle('reject')}
          disabled={loading !== null}
          className="flex-1 border border-gray-300 text-gray-700 font-medium rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {loading === 'reject' ? '...' : 'Recusar'}
        </button>
        <button
          onClick={() => handle('accept')}
          disabled={loading !== null}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2 text-sm transition-colors disabled:opacity-50"
        >
          {loading === 'accept' ? '...' : 'Aceitar'}
        </button>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [consortium, setConsortium] = useState<Consortium | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [list, inviteList] = await Promise.all([
        apiFetch<Consortium[]>('/consortiums'),
        user?.role === 'pagador' ? apiFetch<Invite[]>('/consortiums/invites') : Promise.resolve([]),
      ])
      const cons = list[0] ?? null
      setConsortium(cons)
      setInvites(inviteList as Invite[])
      if (cons) {
        const pays = await apiFetch<Payment[]>(`/consortiums/${cons.id}/payments`)
        setPayments(pays)
      }
      setLoading(false)
    }
    fetchData()
  }, [user?.role])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  // Pagador sem consórcio aceito — mostrar convites ou mensagem
  if (!consortium && user?.role === 'pagador') {
    return (
      <div className="space-y-4">
        {invites.length > 0 ? (
          <>
            <div className="text-center pt-6 pb-2">
              <p className="text-sm font-semibold text-gray-700">Você tem {invites.length} convite{invites.length !== 1 ? 's' : ''} pendente{invites.length !== 1 ? 's' : ''}</p>
            </div>
            {invites.map((inv) => (
              <InviteCard
                key={inv.id}
                invite={inv}
                onAccept={() => window.location.reload()}
                onReject={() => setInvites((prev) => prev.filter((i) => i.id !== inv.id))}
              />
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-indigo-100 rounded-full p-6 mb-4">
              <TrendingUp className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum consórcio ainda</h2>
            <p className="text-gray-500 text-sm">Aguarde o recebedor vincular você a um consórcio.</p>
          </div>
        )}
      </div>
    )
  }

  if (!consortium) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-indigo-100 rounded-full p-6 mb-4">
          <TrendingUp className="w-10 h-10 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum consórcio cadastrado</h2>
        <p className="text-gray-500 text-sm mb-6">Comece criando o consórcio e vinculando os pagadores.</p>
        <button
          onClick={() => navigate('/consorcio/novo')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-5 py-2.5 text-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Criar consórcio
        </button>
      </div>
    )
  }

  const stats = computeStats(consortium, payments)
  const pending = payments.filter((p) => p.status === 'pending')
  const recentPayments = payments.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Convites pendentes para pagador com consórcio */}
      {invites.length > 0 && (
        <div className="space-y-2">
          {invites.map((inv) => (
            <InviteCard
              key={inv.id}
              invite={inv}
              onAccept={() => window.location.reload()}
              onReject={() => setInvites((prev) => prev.filter((i) => i.id !== inv.id))}
            />
          ))}
        </div>
      )}

      {/* Consortium header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-xs uppercase tracking-wide font-medium">Consórcio</p>
            <h2 className="text-xl font-bold mt-0.5">{consortium.name}</h2>
            {consortium.description && (
              <p className="text-indigo-200 text-sm mt-1">{consortium.description}</p>
            )}
          </div>
          {user?.role === 'recebedor' && (
            <button
              onClick={() => navigate(`/consorcio/${consortium.id}/membros`)}
              className="flex items-center gap-1 text-indigo-200 hover:text-white transition-colors text-xs bg-indigo-700/50 rounded-lg px-2.5 py-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Pagadores
            </button>
          )}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-indigo-200 mb-1">
            <span>{formatMoney(stats.totalPaid)} confirmados</span>
            <span>{stats.percentagePaid.toFixed(1)}%</span>
          </div>
          <div className="bg-indigo-800/50 rounded-full h-2.5">
            <div
              className="bg-white rounded-full h-2.5 transition-all duration-500"
              style={{ width: `${stats.percentagePaid}%` }}
            />
          </div>
          <p className="text-indigo-200 text-xs mt-1">de {formatMoney(consortium.total_value)} total</p>
        </div>
      </div>

      {/* Pending alert for recebedor */}
      {user?.role === 'recebedor' && pending.length > 0 && (
        <button
          onClick={() => navigate('/pagamentos')}
          className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left hover:bg-amber-100 transition-colors"
        >
          <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {pending.length} pagamento{pending.length !== 1 ? 's' : ''} aguardando confirmação
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Toque para confirmar ou rejeitar</p>
          </div>
        </button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total confirmado"
          value={formatMoney(stats.totalPaid)}
          sub={`${stats.installmentsPaid} parcela${stats.installmentsPaid !== 1 ? 's' : ''}`}
          color="green"
        />
        <StatCard
          label="Restante"
          value={formatMoney(stats.remaining)}
          sub={`${stats.installmentsRemaining} parcela${stats.installmentsRemaining !== 1 ? 's' : ''}`}
          color="amber"
        />
        <StatCard
          label="Parcela mensal"
          value={formatMoney(consortium.installment_value)}
          color="indigo"
        />
        <StatCard
          label="Extra pago"
          value={formatMoney(stats.totalExtra)}
          sub="acima das parcelas"
          color="purple"
        />
      </div>

      {/* Andamento */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          Andamento
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Início</span>
            <span className="font-medium">
              {format(parseISO(consortium.start_date), "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          {consortium.interest_rate > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Juros</span>
              <span className="font-medium">{consortium.interest_rate}% a.m.</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Total de parcelas</span>
            <span className="font-medium">{consortium.total_installments}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Confirmadas</span>
            <span className="font-medium text-green-600">{stats.installmentsPaid}x</span>
          </div>
          {pending.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Pendentes</span>
              <span className="font-medium text-amber-600">{pending.length}x</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Restantes</span>
            <span className="font-medium text-amber-600">{stats.installmentsRemaining}x</span>
          </div>
        </div>
      </div>

      {/* Recent payments */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          Últimos pagamentos
        </h3>
        {recentPayments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
            Nenhum pagamento registrado ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {recentPayments.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatMoney(p.installment_amount + p.extra_amount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Parcela: {formatMoney(p.installment_amount)}
                      {p.extra_amount > 0 && (
                        <span className="text-purple-600"> + {formatMoney(p.extra_amount)} extra</span>
                      )}
                    </p>
                    {p.note && <p className="text-xs text-gray-400 mt-1 italic">{p.note}</p>}
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-medium text-gray-600">
                      {format(parseISO(p.payment_date), 'dd/MM/yyyy')}
                    </p>
                    <StatusBadge status={p.status} />
                    {p.user_name && (
                      <p className="text-xs text-gray-400">{p.user_name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
