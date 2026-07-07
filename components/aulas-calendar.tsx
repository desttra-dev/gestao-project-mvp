'use client'

import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
  addMonths, subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const subjectLabels: Record<string, string> = {
  matematica: 'Matemática', fisica: 'Física', quimica: 'Química', portugues: 'Português',
  historia: 'História', geografia: 'Geografia', filosofia: 'Filosofia',
  redacao: 'Redação', sociologia: 'Sociologia',
}

interface ClassItem {
  id: string
  scheduled_at: string
  status: string
  level: string
  subject?: string | null
  student: { name: string } | null
  professor: { name: string } | null
}

const statusStyle: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  agendada:  { bg: '#e8faf0', text: '#1e6b40', dot: '#1e6b40', label: 'Agendada' },
  realizada: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af', label: 'Realizada' },
  cancelada: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444', label: 'Cancelada' },
}

const levelLabels: Record<string, string> = {
  fundamental: 'Fund.', medio: 'Médio', superior: 'Sup.', internacional: 'Intl.',
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function AulasCalendar({ classes }: { classes: ClassItem[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
  })

  const forDay = (d: Date) => classes.filter(c => isSameDay(new Date(c.scheduled_at), d))
  const selectedClasses = selectedDay ? forDay(selectedDay) : []

  return (
    <div className="space-y-4">
      {/* Header de navegação */}
      <div className="flex items-center justify-between">
        <h2 className="text-h2 capitalize" style={{ color: '#0d2e1e' }}>
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setCurrentMonth(d => subMonths(d, 1)); setSelectedDay(null) }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setCurrentMonth(new Date()); setSelectedDay(null) }}>
            Hoje
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setCurrentMonth(d => addMonths(d, 1)); setSelectedDay(null) }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#d4e8d4' }}>
        {/* Cabeçalho dias da semana */}
        <div className="grid grid-cols-7" style={{ backgroundColor: '#f5f7f5', borderBottom: '1px solid #d4e8d4' }}>
          {DIAS.map(d => (
            <div key={d} className="p-2 text-center text-xs font-semibold" style={{ color: '#6b8c6b' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Células */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayClasses = forDay(day)
            const inMonth = isSameMonth(day, currentMonth)
            const todayDay = isToday(day)
            const selected = selectedDay && isSameDay(day, selectedDay)

            return (
              <div
                key={i}
                onClick={() => setSelectedDay(selected ? null : day)}
                className="min-h-[72px] p-1.5 cursor-pointer transition-colors"
                style={{
                  borderRight: '1px solid #d4e8d4',
                  borderBottom: '1px solid #d4e8d4',
                  backgroundColor: selected ? '#e8faf0' : 'white',
                  opacity: inMonth ? 1 : 0.3,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                    style={{
                      backgroundColor: todayDay ? '#1e6b40' : 'transparent',
                      color: todayDay ? 'white' : inMonth ? '#0d2e1e' : '#9dbfa9',
                    }}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayClasses.length > 0 && (
                    <span className="text-xs font-bold" style={{ color: '#1e6b40' }}>
                      {dayClasses.length}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {dayClasses.slice(0, 2).map(c => {
                    const st = statusStyle[c.status] ?? statusStyle.agendada
                    return (
                      <div
                        key={c.id}
                        className="text-xs px-1 py-0.5 rounded truncate"
                        style={{ backgroundColor: st.bg, color: st.text }}
                      >
                        {format(new Date(c.scheduled_at), 'HH:mm')}{' '}
                        {c.student?.name?.split(' ')[0] ?? '—'}
                      </div>
                    )
                  })}
                  {dayClasses.length > 2 && (
                    <div className="text-xs" style={{ color: '#6b8c6b' }}>
                      +{dayClasses.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detalhe do dia selecionado */}
      {selectedDay && (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#d4e8d4', backgroundColor: '#f5f7f5' }}>
          <p className="font-semibold capitalize" style={{ color: '#1e6b40', fontSize: '0.9rem' }}>
            {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>

          {selectedClasses.length === 0 ? (
            <p className="text-sm" style={{ color: '#9dbfa9' }}>Nenhuma aula neste dia.</p>
          ) : (
            selectedClasses.map(c => {
              const st = statusStyle[c.status] ?? statusStyle.agendada
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white border"
                  style={{ borderColor: '#d4e8d4' }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: st.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#0d2e1e' }}>
                      {format(new Date(c.scheduled_at), 'HH:mm')} — {c.student?.name ?? '—'}
                    </p>
                    <p className="text-xs" style={{ color: '#6b8c6b' }}>
                      Prof. {c.professor?.name ?? '—'} · {levelLabels[c.level] ?? c.level}
                      {c.subject ? ` · ${subjectLabels[c.subject] ?? c.subject}` : ''}
                    </p>
                  </div>
                  <Badge variant="outline" style={{ fontSize: '0.7rem' }}>
                    {st.label}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Legenda */}
      <div className="flex gap-4 text-xs" style={{ color: '#6b8c6b' }}>
        {Object.values(statusStyle).map(s => (
          <span key={s.label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.dot }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
