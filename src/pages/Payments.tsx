import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { apiFetch, formatMoney } from '../lib/api'
import { Payment, Consortium } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { ConfirmPaymentModal } from '../components/ConfirmPaymentModal'

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

export function Payments() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [payments, setPayments] = useState<Payment[]>([])
  const [consortium, setConsortium] = useState<Consortium | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  useEffect(() => {
    apiFetch<Consortium[]>('/consortiums').then(async (list) => {
      const cons = list[0] ?? null
      setConsortium(cons)
      if (cons) {
        const pays = await apiFetch<Payment[]>(`/consortiums/${cons.id}/payments`)
        setPayments(pays)
      }
      setLoading(false)
    })
  }, [])

  const sortedByDate = [...payments].sort((a, b) => a.payment_date.localeCompare(b.payment_date))

  const getInstallmentNumber = (payment: Payment) =>
    sortedByDate.findIndex((p) => p.id === payment.id) + 1

  const handleConfirmClick = (payment: Payment) => {
    setSelectedPayment(payment)
  }

  const handleConfirm = async () => {
    if (!selectedPayment) return
    setConfirming(true)
    try {
      const updated = await apiFetch<Payment>(`/payments/${selectedPayment.id}/confirm`, { method: 'PUT' })
      setPayments((p) => p.map((x) => (x.id === selectedPayment.id ? updated : x)))
      setSelectedPayment(null)
    } finally {
      setConfirming(false)
    }
  }

  const handleReject = async (id: number) => {
    if (!confirm('Rejeitar este pagamento?')) return
    try {
      const updated = await apiFetch<Payment>(`/payments/${id}/reject`, { method: 'PUT' })
      setPayments((p) => p.map((x) => (x.id === id ? updated : x)))
    } catch {}
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este pagamento?')) return
    setDeleting(id)
    await apiFetch(`/payments/${id}`, { method: 'DELETE' })
    setPayments((p) => p.filter((x) => x.id !== id))
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const confirmedTotal = payments
    .filter((p) => p.status === 'confirmed')
    .reduce((s, p) => s + p.installment_amount + p.extra_amount, 0)

  const pendingCount = payments.filter((p) => p.status === 'pending').length
  const isRecebedor = user?.role === 'recebedor'
  const isPagador = user?.role === 'pagador'

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {isRecebedor ? 'Confirmar Pagamentos' : 'Histórico'}
          </h1>
          {isPagador && (
            <button
              onClick={() => navigate('/pagamentos/novo')}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Novo
            </button>
          )}
        </div>

        {consortium && payments.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Total confirmado</p>
              <p className="text-xl font-bold text-indigo-800">{formatMoney(confirmedTotal)}</p>
            </div>
            <div className="text-right">
              {pendingCount > 0 ? (
                <>
                  <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Pendentes</p>
                  <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Pagamentos</p>
                  <p className="text-xl font-bold text-indigo-800">{payments.length}</p>
                </>
              )}
            </div>
          </div>
        )}

        {payments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-sm">Nenhum pagamento registrado ainda.</p>
            {isPagador && (
              <button
                onClick={() => navigate('/pagamentos/novo')}
                className="mt-4 text-indigo-600 font-medium text-sm"
              >
                Registrar primeiro pagamento
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-xl border p-4 ${
                  p.status === 'pending' ? 'border-amber-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">
                        {formatMoney(p.installment_amount + p.extra_amount)}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {getInstallmentNumber(p)}ª parcela — {formatMoney(p.installment_amount)}
                      {p.extra_amount > 0 && (
                        <span className="text-purple-600"> + {formatMoney(p.extra_amount)} extra</span>
                      )}
                      {p.user_name && (
                        <span className="ml-2 text-gray-400">por {p.user_name}</span>
                      )}
                    </p>
                    {p.note && <p className="text-xs text-gray-400 mt-1 italic truncate">{p.note}</p>}
                    {p.confirmed_by_name && p.status === 'confirmed' && (
                      <p className="text-xs text-green-600 mt-1">Confirmado por {p.confirmed_by_name}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs font-medium text-gray-600 whitespace-nowrap">
                      {format(parseISO(p.payment_date), "dd 'de' MMM yyyy", { locale: ptBR })}
                    </p>

                    {isRecebedor && p.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleConfirmClick(p)}
                          className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-2.5 py-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-2 py-1 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {isRecebedor && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {isPagador && p.status === 'pending' && p.created_by === user?.id && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPayment && consortium && (
        <ConfirmPaymentModal
          payment={selectedPayment}
          installmentNumber={getInstallmentNumber(selectedPayment)}
          totalInstallments={consortium.total_installments}
          onConfirm={handleConfirm}
          onCancel={() => setSelectedPayment(null)}
          loading={confirming}
        />
      )}
    </>
  )
}
