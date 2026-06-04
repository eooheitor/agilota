import { CheckCircle2, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatMoney } from '../lib/api'
import { Payment } from '../types'

interface Props {
  payment: Payment
  installmentNumber: number
  totalInstallments: number
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

export function ConfirmPaymentModal({ payment, installmentNumber, totalInstallments, onConfirm, onCancel, loading }: Props) {
  const total = payment.installment_amount + payment.extra_amount

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Confirmar pagamento</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Valor total</p>
            <p className="text-3xl font-bold text-green-700">{formatMoney(total)}</p>
            {payment.extra_amount > 0 && (
              <p className="text-xs text-green-600 mt-1">
                {formatMoney(payment.installment_amount)} parcela + {formatMoney(payment.extra_amount)} extra
              </p>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Parcela</span>
              <span className="font-semibold text-gray-900">
                {installmentNumber}ª de {totalInstallments}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Data</span>
              <span className="font-medium text-gray-900">
                {format(parseISO(payment.payment_date), "dd 'de' MMMM yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Parcela mensal</span>
              <span className="font-medium text-gray-900">{formatMoney(payment.installment_amount)}</span>
            </div>
            {payment.extra_amount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Valor extra</span>
                <span className="font-medium text-purple-700">{formatMoney(payment.extra_amount)}</span>
              </div>
            )}
            {payment.note && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Observação</span>
                <span className="font-medium text-gray-900 text-right max-w-[55%]">{payment.note}</span>
              </div>
            )}
            {payment.user_name && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Registrado por</span>
                <span className="font-medium text-gray-900">{payment.user_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 font-medium rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium rounded-xl py-2.5 text-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
