import { useState, useRef, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { CurrencyInput } from '../components/CurrencyInput'

// PMT: dado total + n + juros → parcela
function calcPMT(pv: number, n: number, rate: number): number {
  if (pv <= 0 || n <= 0) return 0
  if (rate === 0) return pv / n
  const i = rate / 100
  return (pv * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
}

// PV: dado parcela + n + juros → total
function calcPV(pmt: number, n: number, rate: number): number {
  if (pmt <= 0 || n <= 0) return 0
  if (rate === 0) return pmt * n
  const i = rate / 100
  return (pmt * (Math.pow(1 + i, n) - 1)) / (i * Math.pow(1 + i, n))
}

// N: dado total + parcela + juros → nº parcelas
function calcN(pv: number, pmt: number, rate: number): number {
  if (pv <= 0 || pmt <= 0) return 0
  if (rate === 0) return Math.ceil(pv / pmt) // ceil garante que o total é coberto
  const i = rate / 100
  if (pmt <= pv * i) return 0 // parcela insuficiente para cobrir os juros
  return Math.ceil(Math.log(pmt / (pmt - pv * i)) / Math.log(1 + i))
}

type Field = 'total' | 'installments' | 'installmentValue'

export function NewConsortium() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [totalValue, setTotalValue] = useState(0)
  const [installmentValue, setInstallmentValue] = useState(0)
  const [totalInstallments, setTotalInstallments] = useState(0)
  const [interestRate, setInterestRate] = useState(0)

  const [form, setForm] = useState({ name: '', start_date: '', description: '' })
  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  // qual campo foi editado por último pelo usuário
  const lastEdited = useRef<Field | null>(null)

  const rate = interestRate

  const handleTotal = (v: number) => {
    setTotalValue(v)
    lastEdited.current = 'total'
    if (totalInstallments > 0) {
      setInstallmentValue(calcPMT(v, totalInstallments, rate))
    } else if (installmentValue > 0) {
      setTotalInstallments(calcN(v, installmentValue, rate))
    }
  }

  const handleInstallments = (n: number) => {
    setTotalInstallments(n)
    lastEdited.current = 'installments'
    if (totalValue > 0) {
      setInstallmentValue(calcPMT(totalValue, n, rate))
    } else if (installmentValue > 0) {
      setTotalValue(calcPV(installmentValue, n, rate))
    }
  }

  const handleInstallmentValue = (v: number) => {
    setInstallmentValue(v)
    lastEdited.current = 'installmentValue'
    if (totalValue > 0) {
      setTotalInstallments(calcN(totalValue, v, rate))
    } else if (totalInstallments > 0) {
      setTotalValue(calcPV(v, totalInstallments, rate))
    }
  }

  const handleInterest = (e: React.ChangeEvent<HTMLInputElement>) => {
    const r = parseFloat(e.target.value || '0')
    setInterestRate(r)
    // recalcula o campo que não foi editado por último
    if (lastEdited.current === 'installmentValue') {
      if (totalValue > 0 && installmentValue > 0)
        setTotalInstallments(calcN(totalValue, installmentValue, r))
    } else if (lastEdited.current === 'installments') {
      if (totalValue > 0 && totalInstallments > 0)
        setInstallmentValue(calcPMT(totalValue, totalInstallments, r))
    } else {
      // default: recalcula parcela
      if (totalValue > 0 && totalInstallments > 0)
        setInstallmentValue(calcPMT(totalValue, totalInstallments, r))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const consortium = await apiFetch<{ id: number }>('/consortiums', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          total_value: totalValue,
          installment_value: installmentValue,
          start_date: form.start_date,
          total_installments: totalInstallments,
          interest_rate: interestRate,
          description: form.description || null,
        }),
      })
      navigate(`/consorcio/${consortium.id}/membros`)
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Cadastrar consórcio</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Dados gerais</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              required
              placeholder="Ex: Consórcio do apartamento"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição <span className="text-gray-400 font-normal">— opcional</span>
            </label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Contexto ou observações"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Valores</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor total</label>
            <CurrencyInput value={totalValue} onChange={handleTotal} required className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor da parcela</label>
            <CurrencyInput value={installmentValue} onChange={handleInstallmentValue} required className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nº de parcelas</label>
              <input
                type="number"
                value={totalInstallments || ''}
                onChange={(e) => handleInstallments(parseInt(e.target.value || '0'))}
                required
                min="1"
                step="1"
                placeholder="Ex: 36"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Juros (% a.m.)</label>
              <input
                type="number"
                value={interestRate || ''}
                onChange={handleInterest}
                min="0"
                step="0.01"
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>

          {totalValue > 0 && installmentValue > 0 && totalInstallments > 0 && (() => {
            const fmt = (v: number) =>
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
            const fullCount = Math.floor(totalValue / installmentValue)
            const lastInstallment = Math.round((totalValue - fullCount * installmentValue) * 100) / 100
            const hasRemainder = interestRate === 0 && lastInstallment > 0.01 && fullCount < totalInstallments
            const totalJuros = Math.max(0, installmentValue * totalInstallments - totalValue)

            return (
              <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-700 space-y-1">
                {hasRemainder ? (
                  <>
                    <div className="flex justify-between">
                      <span>{fullCount}x de {fmt(installmentValue)}</span>
                      <span className="font-semibold">{fmt(fullCount * installmentValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Última parcela</span>
                      <span className="font-semibold">{fmt(lastInstallment)}</span>
                    </div>
                    <div className="flex justify-between border-t border-indigo-200 pt-1 mt-1">
                      <span className="font-medium">Total exato</span>
                      <span className="font-bold">{fmt(totalValue)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Parcela × {totalInstallments}x</span>
                      <span className="font-semibold">{fmt(installmentValue * totalInstallments)}</span>
                    </div>
                    {interestRate > 0 && (
                      <div className="flex justify-between text-indigo-500">
                        <span>Juros totais</span>
                        <span className="font-semibold">{fmt(totalJuros)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })()}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Prazo</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de início</label>
            <input
              type="date"
              value={form.start_date}
              onChange={set('start_date')}
              required
              className={inputClass}
            />
          </div>
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
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl py-3 text-sm transition-colors"
        >
          {loading ? 'Salvando...' : 'Salvar consórcio'}
        </button>
      </form>
    </div>
  )
}
