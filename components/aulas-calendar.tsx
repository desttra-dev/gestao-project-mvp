'use client'

import { useState, useEffect, useRef } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, addHours,
  getHours, getMinutes,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_H = 60        // px per hour
const START_H = 7        // 7:00
const END_H = 23         // 23:00
const TOTAL_H = END_H - START_H
const HOURS = Array.from({ length: TOTAL_H }, (_, i) => START_H + i)
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const subjectLabels: Record<string, string> = {
  matematica: 'Matemática', fisica: 'Física', quimica: 'Química', portugues: 'Português',
  historia: 'História', geografia: 'Geografia', filosofia: 'Filosofia',
  redacao: 'Redação', sociologia: 'Sociologia',
}
const levelLabels: Record<string, string> = {
  fundamental: 'Fund.', medio: 'Médio', superior: 'Sup.', internacional: 'Intl.',
}
const statusStyle: Record<string, { bg: string; text: string; dot: string; border: string; label: string }> = {
  agendada:  { bg: '#e8faf0', text: '#1e6b40', dot: '#1e6b40', border: '#1e6b40', label: 'Agendada' },
  realizada: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af', border: '#9ca3af', label: 'Realizada' },
  cancelada: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444', border: '#ef4444', label: 'Cancelada' },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassItem {
  id: string
  scheduled_at: string
  ends_at?: string | null
  status: string
  level: string
  subject?: string | null
  student: { name: string } | null
  professor: { name: string } | null
}

type CalView = 'mes' | 'semana' | 'dia'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEndsAt(c: ClassItem): Date {
  return c.ends_at ? new Date(c.ends_at) : addHours(new Date(c.scheduled_at), 1)
}

function eventPosition(start: Date, end: Date) {
  const startFrac = Math.max(getHours(start) + getMinutes(start) / 60, START_H)
  const endFrac   = Math.min(getHours(end)   + getMinutes(end)   / 60, END_H)
  return {
    top:    (startFrac - START_H) * HOUR_H,
    height: Math.max((endFrac - startFrac) * HOUR_H, 22),
  }
}

function currentTimeTop(now: Date) {
  return (getHours(now) + getMinutes(now) / 60 - START_H) * HOUR_H
}

// ─── Time Grid (shared by Week & Day) ────────────────────────────────────────

function TimeGrid({ days, classes }: { days: Date[]; classes: ClassItem[] }) {
  const [now, setNow] = useState(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      const top = Math.max(currentTimeTop(now) - 120, 0)
      scrollRef.current.scrollTop = top
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const forDay = (d: Date) => classes.filter(c => isSameDay(new Date(c.scheduled_at), d))

  return (
    <div className="flex flex-col" style={{ border: '1px solid #d4e8d4', borderRadius: 12, overflow: 'hidden' }}>
      {/* Day header */}
      <div className="flex" style={{ borderBottom: '1px solid #d4e8d4', backgroundColor: '#f5f7f5' }}>
        <div className="w-14 flex-shrink-0" />
        {days.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center py-2"
            style={{ borderLeft: '1px solid #d4e8d4' }}
          >
            <p className="text-xs font-medium" style={{ color: '#6b8c6b' }}>
              {DIAS_CURTOS[d.getDay()]}
            </p>
            <p
              className="text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full"
              style={{
                backgroundColor: isToday(d) ? '#1e6b40' : 'transparent',
                color: isToday(d) ? 'white' : '#0d2e1e',
              }}
            >
              {format(d, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 560 }}>
        <div className="flex relative" style={{ height: TOTAL_H * HOUR_H }}>
          {/* Hour labels */}
          <div className="w-14 flex-shrink-0 relative">
            {HOURS.map(h => (
              <div
                key={h}
                style={{ position: 'absolute', top: (h - START_H) * HOUR_H - 9, left: 0, width: '100%' }}
                className="pr-2 text-right"
              >
                <span className="text-xs" style={{ color: '#9dbfa9' }}>{h}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, di) => {
            const dayClasses = forDay(d)
            const todayLine = isToday(d) ? currentTimeTop(now) : null

            return (
              <div
                key={di}
                className="flex-1 relative"
                style={{ borderLeft: '1px solid #d4e8d4' }}
              >
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    style={{
                      position: 'absolute', top: (h - START_H) * HOUR_H,
                      left: 0, right: 0, borderTop: '1px solid #f0f4f0',
                    }}
                  />
                ))}

                {/* Current time indicator */}
                {todayLine !== null && todayLine >= 0 && todayLine <= TOTAL_H * HOUR_H && (
                  <div style={{ position: 'absolute', top: todayLine, left: 0, right: 0, zIndex: 10 }}>
                    <div style={{ height: 2, backgroundColor: '#ef4444', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    </div>
                  </div>
                )}

                {/* Events */}
                {dayClasses.map(c => {
                  const start = new Date(c.scheduled_at)
                  const end = getEndsAt(c)
                  const { top, height } = eventPosition(start, end)
                  const st = statusStyle[c.status] ?? statusStyle.agendada
                  return (
                    <div
                      key={c.id}
                      style={{
                        position: 'absolute', top: top + 1, left: 3, right: 3, height: height - 2,
                        backgroundColor: st.bg, color: st.text,
                        borderLeft: `3px solid ${st.border}`,
                        borderRadius: 4, padding: '2px 5px',
                        overflow: 'hidden', cursor: 'default', zIndex: 5,
                      }}
                    >
                      <p className="text-xs font-semibold leading-tight truncate">
                        {format(start, 'HH:mm')}
                        {c.ends_at ? `–${format(end, 'HH:mm')}` : ''}
                      </p>
                      <p className="text-xs leading-tight truncate">{c.student?.name?.split(' ')[0] ?? '—'}</p>
                      {height > 44 && (
                        <p className="text-xs leading-tight truncate" style={{ opacity: 0.75 }}>
                          {c.subject ? subjectLabels[c.subject] : levelLabels[c.level]}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({ current, classes }: { current: Date; classes: ClassItem[] }) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(current), { weekStartsOn: 0 }),
    end:   endOfWeek(endOfMonth(current),     { weekStartsOn: 0 }),
  })

  const forDay = (d: Date) => classes.filter(c => isSameDay(new Date(c.scheduled_at), d))
  const selectedClasses = selectedDay ? forDay(selectedDay) : []

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #d4e8d4' }}>
        {/* Day-of-week header */}
        <div className="grid grid-cols-7" style={{ backgroundColor: '#f5f7f5', borderBottom: '1px solid #d4e8d4' }}>
          {DIAS_CURTOS.map(d => (
            <div key={d} className="p-2 text-center text-xs font-semibold" style={{ color: '#6b8c6b' }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dc = forDay(day)
            const inMonth = isSameMonth(day, current)
            const selected = selectedDay && isSameDay(day, selectedDay)
            return (
              <div
                key={i}
                onClick={() => setSelectedDay(selected ? null : day)}
                className="min-h-[72px] p-1.5 cursor-pointer"
                style={{
                  borderRight: '1px solid #d4e8d4', borderBottom: '1px solid #d4e8d4',
                  backgroundColor: selected ? '#e8faf0' : 'white',
                  opacity: inMonth ? 1 : 0.3,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isToday(day) ? '#1e6b40' : 'transparent',
                      color: isToday(day) ? 'white' : '#0d2e1e',
                    }}
                  >
                    {format(day, 'd')}
                  </span>
                  {dc.length > 0 && (
                    <span className="text-xs font-bold" style={{ color: '#1e6b40' }}>{dc.length}</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dc.slice(0, 2).map(c => {
                    const st = statusStyle[c.status] ?? statusStyle.agendada
                    return (
                      <div key={c.id} className="text-xs px-1 py-0.5 rounded truncate"
                        style={{ backgroundColor: st.bg, color: st.text }}>
                        {format(new Date(c.scheduled_at), 'HH:mm')} {c.student?.name?.split(' ')[0]}
                      </div>
                    )
                  })}
                  {dc.length > 2 && <div className="text-xs" style={{ color: '#6b8c6b' }}>+{dc.length - 2} mais</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: '#d4e8d4', backgroundColor: '#f5f7f5' }}>
          <p className="font-semibold capitalize text-sm" style={{ color: '#1e6b40' }}>
            {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
          {selectedClasses.length === 0 ? (
            <p className="text-sm" style={{ color: '#9dbfa9' }}>Nenhuma aula.</p>
          ) : selectedClasses.map(c => {
            const st = statusStyle[c.status] ?? statusStyle.agendada
            const end = getEndsAt(c)
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border" style={{ borderColor: '#d4e8d4' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: st.dot }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#0d2e1e' }}>
                    {format(new Date(c.scheduled_at), 'HH:mm')}–{format(end, 'HH:mm')} · {c.student?.name ?? '—'}
                  </p>
                  <p className="text-xs" style={{ color: '#6b8c6b' }}>
                    Prof. {c.professor?.name ?? '—'} · {c.subject ? subjectLabels[c.subject] : levelLabels[c.level]}
                  </p>
                </div>
                <Badge variant="outline" style={{ fontSize: '0.7rem' }}>{st.label}</Badge>
              </div>
            )
          })}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function AulasCalendar({ classes }: { classes: ClassItem[] }) {
  const [view, setView] = useState<CalView>('mes')
  const [current, setCurrent] = useState(new Date())

  const goNext = () => {
    if (view === 'mes')    setCurrent(d => addMonths(d, 1))
    if (view === 'semana') setCurrent(d => addWeeks(d, 1))
    if (view === 'dia')    setCurrent(d => addDays(d, 1))
  }
  const goPrev = () => {
    if (view === 'mes')    setCurrent(d => subMonths(d, 1))
    if (view === 'semana') setCurrent(d => subWeeks(d, 1))
    if (view === 'dia')    setCurrent(d => subDays(d, 1))
  }

  const weekDays = eachDayOfInterval({
    start: startOfWeek(current, { weekStartsOn: 0 }),
    end:   endOfWeek(current,   { weekStartsOn: 0 }),
  })

  const title = view === 'mes'
    ? format(current, 'MMMM yyyy', { locale: ptBR })
    : view === 'semana'
    ? `${format(weekDays[0], "dd 'de' MMM", { locale: ptBR })} – ${format(weekDays[6], "dd 'de' MMM yyyy", { locale: ptBR })}`
    : format(current, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" style={{ color: '#1e6b40' }} />
          </button>
          <h2 className="text-base font-semibold capitalize px-1 min-w-[200px] text-center" style={{ color: '#0d2e1e' }}>
            {title}
          </h2>
          <button
            onClick={goNext}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4" style={{ color: '#1e6b40' }} />
          </button>
          <button
            onClick={() => setCurrent(new Date())}
            className="ml-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100"
            style={{ color: '#1e6b40', border: '1px solid #d4e8d4' }}
          >
            Hoje
          </button>
        </div>

        {/* View toggle */}
        <div className="flex p-0.5 rounded-lg gap-0.5" style={{ backgroundColor: '#f5f7f5', border: '1px solid #d4e8d4' }}>
          {([
            { key: 'mes',    icon: CalendarRange, label: 'Mês'    },
            { key: 'semana', icon: CalendarDays,  label: 'Semana' },
            { key: 'dia',    icon: Clock,         label: 'Dia'    },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                backgroundColor: view === key ? 'white' : 'transparent',
                color: view === key ? '#1e6b40' : '#6b8c6b',
                boxShadow: view === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      {view === 'mes' && (
        <MonthView current={current} classes={classes} />
      )}
      {view === 'semana' && (
        <TimeGrid days={weekDays} classes={classes} />
      )}
      {view === 'dia' && (
        <TimeGrid days={[current]} classes={classes} />
      )}
    </div>
  )
}
