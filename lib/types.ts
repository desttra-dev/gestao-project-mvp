export type Country = 'BR' | 'EU'
export type Currency = 'BRL' | 'EUR'
export type PlanType = 'avulsa' | 'weekly_1x' | 'weekly_2x' | 'weekly_3x' | 'custom'
export type ClassLevel = 'fundamental' | 'medio' | 'superior' | 'internacional'
export type ClassStatus = 'agendada' | 'realizada' | 'cancelada'
export type ChargeStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado'
export type PaymentMethod = 'pix' | 'iban' | 'wise' | 'cora'
export type PayoutStatus = 'pendente' | 'pago'
export type EnrollmentStatus = 'ativo' | 'pausado' | 'cancelado'
export type StudentStatus = 'ativo' | 'suspenso' | 'cancelado' | 'experimento'
export type FollowUp = 'none' | 'next_week' | 'jan' | 'fev' | 'mar' | 'abr' | 'mai' | 'jun' | 'jul' | 'ago' | 'set' | 'out' | 'nov' | 'dez'
export type TransactionType = 'entrada' | 'saida'

export interface Professor {
  id: string
  name: string
  email: string | null
  phone: string | null
  bank_info: string | null
  active: boolean
  created_at: string
}

export interface Student {
  id: string
  name: string
  email: string | null
  phone: string | null
  country: Country
  notes: string | null
  active: boolean
  status: StudentStatus
  responsible_name: string | null
  responsible_phone: string | null
  responsible_email: string | null
  follow_up: FollowUp
  follow_up_notes: string | null
  created_at: string
}

export interface Plan {
  id: string
  name: string
  description: string | null
  country: Country
  currency: Currency
  price: number
  classes_per_month: number | null
  type: PlanType
  active: boolean
  created_at: string
}

export interface TeacherRate {
  id: string
  level: ClassLevel
  rate_brl: number
  updated_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  plan_id: string
  teacher_id: string
  start_date: string
  status: EnrollmentStatus
  custom_price: number | null
  custom_description: string | null
  created_at: string
  student?: Student
  plan?: Plan
  professor?: Professor
}

export interface Class {
  id: string
  enrollment_id: string
  student_id: string
  teacher_id: string
  scheduled_at: string
  level: ClassLevel
  status: ClassStatus
  notes: string | null
  created_at: string
  student?: Student
  professor?: Professor
  enrollment?: Enrollment
}

export interface Charge {
  id: string
  student_id: string
  enrollment_id: string | null
  amount: number
  currency: Currency
  due_date: string
  period_reference: string
  status: ChargeStatus
  payment_method: PaymentMethod | null
  paid_at: string | null
  notes: string | null
  created_at: string
  student?: Student
  enrollment?: Enrollment
}

export interface TeacherPayout {
  id: string
  teacher_id: string
  period_month: number
  period_year: number
  total_classes: number
  amount_brl: number
  status: PayoutStatus
  paid_at: string | null
  notes: string | null
  created_at: string
  professor?: Professor
}

export interface FinancialTransaction {
  id: string
  type: TransactionType
  amount: number
  currency: Currency
  transaction_date: string
  description: string
  student_id: string | null
  responsible_name: string | null
  professor_id: string | null
  category: string | null
  notes: string | null
  created_at: string
  student?: Student
  professor?: Professor
}
