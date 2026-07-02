export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, GraduationCap, BookOpen, AlertCircle, Euro, Banknote, PhoneCall } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DashboardChart } from '@/components/dashboard-chart'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const periodRef = `${year}-${String(month).padStart(2, '0')}`

  // Busca dados em paralelo
  const [
    { count: totalStudents },
    { count: totalProfessors },
    { data: classes },
    { data: pendingCharges },
    { data: paidChargesMonth },
    { data: pendingPayouts },
    { data: followUpStudents },
    { data: allTransactions },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('professors').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('classes').select('id').eq('status', 'agendada'),
    supabase.from('charges').select('id, amount, currency').eq('status', 'pendente'),
    supabase.from('charges').select('amount, currency').eq('status', 'pago').eq('period_reference', periodRef),
    supabase.from('teacher_payouts').select('amount_brl').eq('status', 'pendente').eq('period_month', month).eq('period_year', year),
    supabase.from('students').select('id, name, follow_up, follow_up_notes').neq('follow_up', 'none').eq('status', 'ativo'),
    supabase.from('financial_transactions').select('type, amount, currency, transaction_date').gte('transaction_date', format(subMonths(now, 11), 'yyyy-MM-01')),
  ])

  // Métricas financeiras do mês
  const revenueBRL = (paidChargesMonth ?? []).filter(c => c.currency === 'BRL').reduce((s, c) => s + c.amount, 0)
  const revenueEUR = (paidChargesMonth ?? []).filter(c => c.currency === 'EUR').reduce((s, c) => s + c.amount, 0)
  const totalPayouts = (pendingPayouts ?? []).reduce((s, p) => s + p.amount_brl, 0)
  const pendingBRL = (pendingCharges ?? []).filter(c => c.currency === 'BRL').reduce((s, c) => s + c.amount, 0)
  const pendingEUR = (pendingCharges ?? []).filter(c => c.currency === 'EUR').reduce((s, c) => s + c.amount, 0)

  // Monta dados dos gráficos — últimos 12 meses
  const buildChartData = (currency: string) =>
    Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, 11 - i)
      const key = format(d, 'yyyy-MM')
      const label = format(d, 'MMM/yy', { locale: ptBR })
      const monthTx = (allTransactions ?? []).filter(t => t.transaction_date.startsWith(key) && t.currency === currency)
      return {
        month: label,
        entradas: monthTx.filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0),
        saidas:   monthTx.filter(t => t.type === 'saida').reduce((s, t) => s + t.amount, 0),
      }
    })

  const chartDataBRL = buildChartData('BRL')
  const chartDataEUR = buildChartData('EUR')

  // Alunos com retorno pendente
  const nextWeekStudents = (followUpStudents ?? []).filter(s => s.follow_up === 'next_week')
  const currentMonthShort = format(now, 'MMM', { locale: ptBR }).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 3)
  const thisMonthStudents = (followUpStudents ?? []).filter(s => s.follow_up === currentMonthShort)

  const monthName = format(now, 'MMMM yyyy', { locale: ptBR })
  const fmt = (v: number, c = 'BRL') => c === 'EUR'
    ? `€ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1">Dashboard</h1>
        <p className="text-body capitalize mt-1">{monthName}</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Alunos ativos', value: totalStudents ?? 0, icon: Users, bg: '#e8faf0', color: '#1e6b40' },
          { label: 'Professores', value: totalProfessors ?? 0, icon: GraduationCap, bg: '#e8faf0', color: '#2da862' },
          { label: 'Aulas agendadas', value: classes?.length ?? 0, icon: BookOpen, bg: '#e8faf0', color: '#0d2e1e' },
          { label: 'Cobranças pendentes', value: pendingCharges?.length ?? 0, icon: AlertCircle, bg: '#fef3c7', color: '#b45309' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-label">{label}</p>
                  <p className="text-display mt-1" style={{ fontSize: 32, color: '#0d2e1e' }}>{value}</p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: bg }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Receita e repasses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="h-4 w-4" style={{ color: '#1e6b40' }} />
              <span className="text-label">Recebido no mês (BRL)</span>
            </div>
            <p className="text-h2 mt-1" style={{ color: '#1e6b40' }}>{fmt(revenueBRL)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <Euro className="h-4 w-4" style={{ color: '#2da862' }} />
              <span className="text-label">Recebido no mês (EUR)</span>
            </div>
            <p className="text-h2 mt-1" style={{ color: '#2da862' }}>{fmt(revenueEUR, 'EUR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4" style={{ color: '#b45309' }} />
              <span className="text-label">Repasses pendentes</span>
            </div>
            <p className="text-h2 mt-1" style={{ color: '#b45309' }}>{fmt(totalPayouts)}</p>
            {pendingBRL > 0 && <p className="text-xs mt-1" style={{ color: '#6b8c6b' }}>Cobranças: {fmt(pendingBRL)}{pendingEUR > 0 ? ` · ${fmt(pendingEUR, 'EUR')}` : ''}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <DashboardChart data12months={chartDataBRL} currency="BRL" />
      <DashboardChart data12months={chartDataEUR} currency="EUR" />

      {/* Retornos pendentes */}
      {((nextWeekStudents?.length ?? 0) + (thisMonthStudents?.length ?? 0)) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-h2 flex items-center gap-2">
              <PhoneCall className="h-5 w-5" style={{ color: '#1e6b40' }} />
              Contatos pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextWeekStudents.length > 0 && (
              <div>
                <p className="text-label mb-2" style={{ color: '#b45309' }}>SEMANA QUE VEM</p>
                <div className="space-y-1">
                  {nextWeekStudents.map(s => (
                    <Link key={s.id} href={`/alunos/${s.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-verde-gelo transition-colors">
                      <p className="text-sm font-semibold" style={{ color: '#0d2e1e' }}>{s.name}</p>
                      {s.follow_up_notes && <p className="text-xs" style={{ color: '#6b8c6b' }}>{s.follow_up_notes}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {thisMonthStudents.length > 0 && (
              <div>
                <p className="text-label mb-2 capitalize" style={{ color: '#1e6b40' }}>ESTE MÊS</p>
                <div className="space-y-1">
                  {thisMonthStudents.map(s => (
                    <Link key={s.id} href={`/alunos/${s.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-verde-gelo transition-colors">
                      <p className="text-sm font-semibold" style={{ color: '#0d2e1e' }}>{s.name}</p>
                      {s.follow_up_notes && <p className="text-xs" style={{ color: '#6b8c6b' }}>{s.follow_up_notes}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
