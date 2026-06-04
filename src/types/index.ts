export type UserRole = 'recebedor' | 'pagador'
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Consortium {
  id: number
  name: string
  total_value: number
  installment_value: number
  start_date: string
  total_installments: number
  description: string | null
  interest_rate: number
  created_by: number
  created_at: string
}

export interface ConsortiumMember {
  id: number
  name: string
  email: string
  user_role: UserRole
  member_role: 'pagador'
  status: 'pending' | 'accepted' | 'rejected'
}

export interface Invite extends Consortium {
  invite_status: 'pending'
  recebedor_name: string
}

export interface Payment {
  id: number
  consortium_id: number
  payment_date: string
  installment_amount: number
  extra_amount: number
  note: string | null
  status: PaymentStatus
  confirmed_by: number | null
  confirmed_at: string | null
  created_by: number
  created_at: string
  user_name?: string
  confirmed_by_name?: string
}

export interface ConsortiumStats {
  totalPaid: number
  totalExtra: number
  installmentsPaid: number
  remaining: number
  percentagePaid: number
  installmentsRemaining: number
}
