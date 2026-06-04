import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { apiFetch, formatMoney } from '../lib/api'
import { Consortium } from '../types'
import { CurrencyInput } from '../components/CurrencyInput'

export function NewPayment() {
  const navigate = useNavigate()
  const [consortium, setConsortium] = useState<Consortium | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [installmentAmount, setInstallmentAmount] = useState(0)
  const [extraAmount, setExtraAmount] = useState(0)
  const [note, setNote] = useState('')

  useEffect(() => {
    apiFetch<Consortium[]>('/consortiums').then((list) => {
      const cons = list[0] ?? null
      setConsortium(cons)
      if (cons) setInstallmentAmount(cons.installment_value)
      setLoadingData(false)
    })
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!consortium) return
    setError('')
    setLoading(true)
    try {
      await apiFetch(`/consortiums/${consortium.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          payment_date: paymentDate,
          installment_amount: installmentAmount,
          extra_amount: extraAmount,
          note: note || null,
        }),
      })
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!consortium) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>Nenhum consórcio encontrado.</p>
      </div>
    )
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const total = installmentAmount + extraAmount

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Registrar pagamento</h1>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 text-sm">
        <p className="font-medium text-indigo-800">{consortium.name}</p>
        <p className="text-indigo-600 text-xs mt-0.5">
          Parcela padrão: {formatMoney(consortium.installment_value)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data do pagamento</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor da parcela</label>
            <CurrencyInput
              value={installmentAmount}
              onChange={setInstallmentAmount}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor extra <span className="text-gray-400 font-normal">— opcional</span>
            </label>
            <CurrencyInput
              value={extraAmount}
              onChange={setExtraAmount}
              placeholder="R$ 0,00"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">Qualquer valor acima da parcela mensal</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observação <span className="text-gray-400 font-normal">— opcional</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Pix enviado dia 01/06"
              className={inputClass}
            />
          </div>
        </div>

        {total > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs text-green-600 uppercase font-medium tracking-wide">Total a registrar</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatMoney(total)}</p>
            {extraAmount > 0 && (
              <p className="text-xs text-green-600 mt-0.5">
                {formatMoney(installmentAmount)} parcela + {formatMoney(extraAmount)} extra
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || installmentAmount <= 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium rounded-xl py-3 text-sm transition-colors"
        >
          {loading ? 'Registrando...' : 'Confirmar pagamento'}
        </button>
      </form>
    </div>
  )
}
