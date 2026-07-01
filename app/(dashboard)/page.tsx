export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, AlertCircle, Euro, Banknote } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const periodRef = `${year}-${String(month).padStart(2, '0')}`

  const [
    { count: totalStudents },
    { count: totalProfessors },
    { data: classes },
    { data: pendingCharges },
    { data: paidChargesMonth },
    { data: pendingPayouts },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('professors').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('classes').select('id, status').eq('status', 'agendada'),
    supabase.from('charges').select('id, amount, currency, student:students(name)').eq('status', 'pendente'),
    supabase.from('charges').select('amount, currency').eq('status', 'pago').eq('period_reference', periodRef),
    supabase.from('teacher_payouts').select('amount_brl, professor:professors(name)').eq('status', 'pendente').eq('period_month', month).eq('period_year', year),
  ])

  const revenueBRL = (paidChargesMonth ?? []).filter(c => c.currency === 'BRL').reduce((s, c) => s + c.amount, 0)
  const revenueEUR = (paidChargesMonth ?? []).filter(c => c.currency === 'EUR').reduce((s, c) => s + c.amount, 0)
  const totalPayouts = (pendingPayouts ?? []).reduce((s, p) => s + p.amount_brl, 0)

  const pendingBRL = (pendingCharges ?? []).filter(c => c.currency === 'BRL').reduce((s, c) => s + c.amount, 0)
  const pendingEUR = (pendingCharges ?? []).filter(c => c.currency === 'EUR').reduce((s, c) => s + c.amount, 0)

  const monthName = format(now, 'MMMM yyyy', { locale: ptBR })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1 capitalize">{monthName}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Alunos ativos</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{totalStudents ?? 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Professores ativos</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{totalProfessors ?? 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Aulas agendadas</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{classes?.length ?? 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Cobranças pendentes</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{pendingCharges?.length ?? 0}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Recebido no mês (BRL)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              R$ {revenueBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Recebido no mês (EUR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              € {revenueEUR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Repasses pendentes (BRL)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              R$ {totalPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">{pendingPayouts?.length ?? 0} professor(es)</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending charges detail */}
      {(pendingCharges?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Cobranças a receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600 pb-2 border-b">
                <span className="font-medium">Pendente BRL:</span>
                <span className="font-bold text-orange-600">R$ {pendingBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span className="font-medium">Pendente EUR:</span>
                <span className="font-bold text-orange-600">€ {pendingEUR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
