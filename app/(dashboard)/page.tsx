export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, GraduationCap, PhoneCall, Clock, Plus } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toBRT } from '@/lib/date-utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const statusStyle: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  agendada:  { bg: '#e8faf0', text: '#1e6b40', dot: '#1e6b40', label: 'Agendada'  },
  realizada: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af', label: 'Realizada' },
  cancelada: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444', label: 'Cancelada' },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const nowUTC = new Date()
  const nowBRT = toBRT(nowUTC)

  const todayBRT    = format(nowBRT, 'yyyy-MM-dd')
  const tomorrowBRT = format(addDays(nowBRT, 1), 'yyyy-MM-dd')

  // UTC ranges for BRT days (BRT midnight = 03:00 UTC)
  const todayStartUTC = `${todayBRT}T03:00:00Z`
  const todayEndUTC   = `${tomorrowBRT}T03:00:00Z`

  const weekStartBRT = startOfWeek(nowBRT, { weekStartsOn: 0 })
  const weekEndBRT   = addDays(endOfWeek(nowBRT, { weekStartsOn: 0 }), 1)
  const weekStartUTC = `${format(weekStartBRT, 'yyyy-MM-dd')}T03:00:00Z`
  const weekEndUTC   = `${format(weekEndBRT, 'yyyy-MM-dd')}T03:00:00Z`

  const monthStartBRT = new Date(nowBRT.getFullYear(), nowBRT.getMonth(), 1)
  const monthEndBRT   = new Date(nowBRT.getFullYear(), nowBRT.getMonth() + 1, 1)
  const monthStartUTC = `${format(monthStartBRT, 'yyyy-MM-dd')}T03:00:00Z`
  const monthEndUTC   = `${format(monthEndBRT,   'yyyy-MM-dd')}T03:00:00Z`

  const [
    { data: todayClasses },
    { data: weekClasses },
    { data: monthClasses },
    { count: totalStudents },
    { count: totalProfessors },
    { data: followUpStudents },
  ] = await Promise.all([
    supabase.from('classes')
      .select('*, student:students(name), professor:professors(name)')
      .gte('scheduled_at', todayStartUTC)
      .lt('scheduled_at', todayEndUTC)
      .order('scheduled_at'),
    supabase.from('classes').select('id, status')
      .gte('scheduled_at', weekStartUTC).lt('scheduled_at', weekEndUTC),
    supabase.from('classes').select('id, status')
      .gte('scheduled_at', monthStartUTC).lt('scheduled_at', monthEndUTC),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('professors').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('students').select('id, name, follow_up, follow_up_notes')
      .neq('follow_up', 'none').eq('status', 'ativo'),
  ])

  const todayCount    = todayClasses?.length ?? 0
  const weekAgendadas = weekClasses?.filter(c => c.status === 'agendada').length ?? 0
  const monthRealized = monthClasses?.filter(c => c.status === 'realizada').length ?? 0
  const monthCancelled= monthClasses?.filter(c => c.status === 'cancelada').length ?? 0

  const nextClass = (todayClasses ?? []).find(c => c.scheduled_at > nowUTC.toISOString())

  const dateLabel = format(nowBRT, "EEEE, dd 'de' MMMM", { locale: ptBR })

  const nextWeekStudents  = (followUpStudents ?? []).filter(s => s.follow_up === 'next_week')
  const curMonthShort     = format(nowBRT, 'MMM', { locale: ptBR })
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 3)
  const thisMonthStudents = (followUpStudents ?? []).filter(s => s.follow_up === curMonthShort)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1">Dashboard</h1>
          <p className="text-body capitalize mt-1" style={{ color: '#6b8c6b' }}>{dateLabel}</p>
        </div>
        <Link href="/aulas/nova" className="flex-shrink-0">
          <Button style={{ height: 44 }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Aula
          </Button>
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-label">Aulas hoje</p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#0d2e1e' }}>{todayCount}</p>
            {nextClass && (
              <p className="text-xs mt-1.5" style={{ color: '#1e6b40' }}>
                Próxima: {format(toBRT(nextClass.scheduled_at), 'HH:mm')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-label">Agendadas na semana</p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#1e6b40' }}>{weekAgendadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-label">Realizadas no mês</p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#2da862' }}>{monthRealized}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-label">Canceladas no mês</p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#b91c1c' }}>{monthCancelled}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-h2 flex items-center gap-2">
            <Clock className="h-5 w-5" style={{ color: '#1e6b40' }} />
            Aulas de hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayCount === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p style={{ color: '#9dbfa9' }}>Sem aulas hoje.</p>
              <Link href="/aulas/nova">
                <Button variant="outline" size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Agendar aula
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(todayClasses ?? []).map(c => {
                const st      = statusStyle[c.status] ?? statusStyle.agendada
                const startBRT = toBRT(c.scheduled_at)
                const endBRT   = c.ends_at ? toBRT(c.ends_at) : null
                const isPast   = c.scheduled_at < nowUTC.toISOString()
                return (
                  <Link key={c.id} href={`/aulas/${c.id}`}>
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm"
                      style={{
                        borderColor: '#e4f0e4',
                        backgroundColor: isPast && c.status === 'agendada' ? '#fefce8' : 'white',
                        opacity: c.status === 'cancelada' ? 0.6 : 1,
                      }}
                    >
                      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: st.dot }} />
                      <div className="flex-shrink-0 text-center" style={{ minWidth: 50 }}>
                        <p className="text-sm font-bold" style={{ color: '#0d2e1e' }}>
                          {format(startBRT, 'HH:mm')}
                        </p>
                        {endBRT && (
                          <p className="text-xs" style={{ color: '#9dbfa9' }}>{format(endBRT, 'HH:mm')}</p>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#0d2e1e' }}>
                          {(c.student as any)?.name ?? '—'}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#6b8c6b' }}>
                          Prof. {(c.professor as any)?.name ?? '—'}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: st.bg, color: st.text }}>
                        {st.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/alunos">
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full" style={{ backgroundColor: '#e8faf0' }}>
                  <Users className="h-4 w-4" style={{ color: '#1e6b40' }} />
                </div>
                <div>
                  <p className="text-label">Alunos ativos</p>
                  <p className="text-2xl font-bold" style={{ color: '#0d2e1e' }}>{totalStudents ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/professores">
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full" style={{ backgroundColor: '#e8faf0' }}>
                  <GraduationCap className="h-4 w-4" style={{ color: '#2da862' }} />
                </div>
                <div>
                  <p className="text-label">Professores</p>
                  <p className="text-2xl font-bold" style={{ color: '#0d2e1e' }}>{totalProfessors ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Follow-ups */}
      {((nextWeekStudents.length) + (thisMonthStudents.length)) > 0 && (
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
                    <Link key={s.id} href={`/alunos/${s.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-verde-gelo transition-colors">
                      <p className="text-sm font-semibold" style={{ color: '#0d2e1e' }}>{s.name}</p>
                      {s.follow_up_notes && <p className="text-xs" style={{ color: '#6b8c6b' }}>{s.follow_up_notes}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {thisMonthStudents.length > 0 && (
              <div>
                <p className="text-label mb-2" style={{ color: '#1e6b40' }}>ESTE MÊS</p>
                <div className="space-y-1">
                  {thisMonthStudents.map(s => (
                    <Link key={s.id} href={`/alunos/${s.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-verde-gelo transition-colors">
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
