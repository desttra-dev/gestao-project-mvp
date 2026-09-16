'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Student, Professor, Class } from '@/lib/types'
import { createAulaGoogleEvent } from '@/app/actions/aulas'
import { addDays, addWeeks, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Calendar, Search, X } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { value: 'matematica',  label: 'Matemática' },
  { value: 'fisica',      label: 'Física'     },
  { value: 'quimica',     label: 'Química'    },
  { value: 'portugues',   label: 'Português'  },
  { value: 'historia',    label: 'História'   },
  { value: 'geografia',   label: 'Geografia'  },
  { value: 'filosofia',   label: 'Filosofia'  },
  { value: 'redacao',     label: 'Redação'    },
  { value: 'sociologia',  label: 'Sociologia' },
]

const LEVELS = [
  { value: 'fundamental'   as const, label: 'Fundamental'   },
  { value: 'medio'         as const, label: 'Médio'         },
  { value: 'superior'      as const, label: 'Superior'      },
  { value: 'internacional' as const, label: 'Internacional' },
]

const DURATIONS = [
  { label: '1h', minutes: 60  },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
  { label: '4h', minutes: 240 },
]

const TIME_OPTIONS = (() => {
  const opts: string[] = []
  for (let h = 6; h <= 23; h++) {
    for (const m of [0, 30]) {
      if (h === 23 && m === 30) continue
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return opts
})()

type RepeatMode = 'none' | 'daily' | 'weekly'
type EditScope  = 'single' | 'following'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDates(scheduledAt: string, repeat: RepeatMode, repeatUntil: string): Date[] {
  const start = new Date(scheduledAt)
  if (repeat === 'none' || !repeatUntil) return [start]
  const until = new Date(repeatUntil + 'T23:59:59')
  const dates: Date[] = []
  let current = start
  while (current <= until && dates.length < 60) {
    dates.push(new Date(current))
    current = repeat === 'daily' ? addDays(current, 1) : addWeeks(current, 1)
  }
  return dates
}

function toDatetimeLocal(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm")
}

function computeEndsAt(scheduledAt: string, endsAtTime: string): string | null {
  if (!endsAtTime || !scheduledAt) return null
  const d = new Date(scheduledAt)
  const [h, m] = endsAtTime.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
      style={{
        backgroundColor: selected ? '#1e6b40' : 'white',
        color:           selected ? 'white'    : '#4a5a4a',
        borderColor:     selected ? '#1e6b40'  : '#d4e8d4',
      }}
    >
      {label}
    </button>
  )
}

// ─── Student Search ────────────────────────────────────────────────────────────

function StudentSearch({ students, value, onChange }: {
  students: Student[]
  value: string
  onChange: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const inputRef          = useRef<HTMLInputElement>(null)
  const selected          = students.find(s => s.id === value)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return students.filter(s => s.name.toLowerCase().includes(q)).slice(0, 8)
  }, [students, query])

  const handleSelect = (id: string) => {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9dbfa9' }} />
        <input
          ref={inputRef}
          value={selected ? selected.name : query}
          onChange={e => { setQuery(e.target.value); onChange(''); setOpen(true) }}
          onFocus={() => !selected && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar aluno..."
          className="w-full pl-9 py-2.5 rounded-lg border text-sm outline-none transition-colors"
          style={{
            borderColor:     value ? '#1e6b40' : '#d4e8d4',
            paddingRight:    value ? '36px' : '12px',
            backgroundColor: value ? '#f5fdf8' : 'white',
            color: '#0d2e1e',
          }}
        />
        {value && (
          <button type="button" onClick={() => { onChange(''); setQuery(''); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100">
            <X className="h-3.5 w-3.5" style={{ color: '#6b8c6b' }} />
          </button>
        )}
      </div>
      {open && !selected && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border shadow-lg overflow-hidden"
          style={{ borderColor: '#d4e8d4', backgroundColor: 'white', maxHeight: 220, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm" style={{ color: '#9dbfa9' }}>Nenhum aluno encontrado</p>
          ) : filtered.map(s => (
            <button key={s.id} type="button" onMouseDown={() => handleSelect(s.id)}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-verde-gelo"
              style={{ color: '#0d2e1e' }}>
              <span className="font-medium">{s.name}</span>
              {s.responsible_name && (
                <span className="ml-2 text-xs" style={{ color: '#9dbfa9' }}>{s.responsible_name}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Professor Search ──────────────────────────────────────────────────────────

function ProfessorSearch({ professors, value, onChange }: {
  professors: Professor[]
  value: string
  onChange: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const inputRef          = useRef<HTMLInputElement>(null)
  const selected          = professors.find(p => p.id === value)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return professors.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8)
  }, [professors, query])

  const handleSelect = (id: string) => {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9dbfa9' }} />
        <input
          ref={inputRef}
          value={selected ? selected.name : query}
          onChange={e => { setQuery(e.target.value); onChange(''); setOpen(true) }}
          onFocus={() => !selected && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar professor..."
          className="w-full pl-9 py-2.5 rounded-lg border text-sm outline-none transition-colors"
          style={{
            borderColor:     value ? '#1e6b40' : '#d4e8d4',
            paddingRight:    value ? '36px' : '12px',
            backgroundColor: value ? '#f5fdf8' : 'white',
            color: '#0d2e1e',
          }}
        />
        {value && (
          <button type="button" onClick={() => { onChange(''); setQuery(''); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100">
            <X className="h-3.5 w-3.5" style={{ color: '#6b8c6b' }} />
          </button>
        )}
      </div>
      {open && !selected && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border shadow-lg overflow-hidden"
          style={{ borderColor: '#d4e8d4', backgroundColor: 'white', maxHeight: 220, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm" style={{ color: '#9dbfa9' }}>Nenhum professor encontrado</p>
          ) : filtered.map(p => (
            <button key={p.id} type="button" onMouseDown={() => handleSelect(p.id)}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-verde-gelo"
              style={{ color: '#0d2e1e' }}>
              <span className="font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Form ─────────────────────────────────────────────────────────────────

interface AulaFormProps {
  students:    Student[]
  professors:  Professor[]
  enrollments: unknown[]
  aula?:       Class
}

export function AulaForm({ students, professors, aula }: AulaFormProps) {
  const router    = useRouter()
  const supabase  = createClient()
  const [loading, setLoading]               = useState(false)
  const [showSeriesDialog, setShowSeriesDialog] = useState(false)
  const isEditing = !!aula
  const hasSeries = isEditing && !!aula?.series_id

  const defaultDt = format(new Date(), "yyyy-MM-dd'T'HH:mm")

  const [form, setForm] = useState({
    student_id:   aula?.student_id   ?? '',
    teacher_id:   aula?.teacher_id   ?? '',
    scheduled_at: aula?.scheduled_at ? toDatetimeLocal(aula.scheduled_at) : defaultDt,
    ends_at_time: aula?.ends_at      ? format(new Date(aula.ends_at), 'HH:mm') : '',
    level:        aula?.level   ?? 'fundamental',
    subject:      aula?.subject ?? '',
    status:       aula?.status  ?? 'agendada',
    notes:        aula?.notes   ?? '',
    repeat:       'none' as RepeatMode,
    repeat_until: '',
  })

  const dateValue = form.scheduled_at.slice(0, 10)
  const timeValue = form.scheduled_at.slice(11, 16)

  const setDate = (d: string) =>
    setForm(f => ({ ...f, scheduled_at: `${d}T${f.scheduled_at.slice(11, 16) || '00:00'}` }))

  const setTime = (t: string) =>
    setForm(f => ({ ...f, scheduled_at: `${f.scheduled_at.slice(0, 10)}T${t}`, ends_at_time: '' }))

  const applyDuration = (minutes: number) => {
    if (!form.scheduled_at || !timeValue) return
    const start = new Date(form.scheduled_at)
    const end   = new Date(start.getTime() + minutes * 60000)
    setForm(f => ({ ...f, ends_at_time: format(end, 'HH:mm') }))
  }

  const selectedDuration = useMemo(() => {
    if (!form.scheduled_at || !form.ends_at_time || !timeValue) return null
    const start = new Date(form.scheduled_at)
    const [h, m] = form.ends_at_time.split(':').map(Number)
    const end = new Date(form.scheduled_at)
    end.setHours(h, m, 0, 0)
    return Math.round((end.getTime() - start.getTime()) / 60000)
  }, [form.scheduled_at, form.ends_at_time, timeValue])

  const isPersonalizado = selectedDuration !== null && !DURATIONS.some(d => d.minutes === selectedDuration)

  const previewDates = useMemo(() => {
    if (isEditing || !form.scheduled_at || form.repeat === 'none') return []
    return buildDates(form.scheduled_at, form.repeat, form.repeat_until)
  }, [isEditing, form.scheduled_at, form.repeat, form.repeat_until])

  // ── Save logic ─────────────────────────────────────────────────────────────

  async function doSave(scope: EditScope) {
    setShowSeriesDialog(false)
    setLoading(true)

    const startDt = new Date(form.scheduled_at)
    const endsAt  = computeEndsAt(form.scheduled_at, form.ends_at_time)

    const base = {
      student_id:    form.student_id,
      teacher_id:    form.teacher_id,
      enrollment_id: null,
      level:         form.level,
      subject:       form.subject || null,
      price:         null,
      status:        form.status,
      notes:         form.notes || null,
    }

    if (scope === 'single') {
      const { error } = await supabase.from('classes')
        .update({ ...base, scheduled_at: startDt.toISOString(), ends_at: endsAt })
        .eq('id', aula!.id)
      setLoading(false)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Aula atualizada!')
    } else {
      const { error: e1 } = await supabase.from('classes')
        .update({ ...base, scheduled_at: startDt.toISOString(), ends_at: endsAt })
        .eq('id', aula!.id)
      if (e1) { setLoading(false); toast.error('Erro: ' + e1.message); return }

      const { data: following, error: e2 } = await supabase.from('classes')
        .select('id, scheduled_at')
        .eq('series_id', aula!.series_id)
        .gt('scheduled_at', aula!.scheduled_at)
        .order('scheduled_at')
      if (e2) { setLoading(false); toast.error('Erro: ' + e2.message); return }

      if (following?.length) {
        const updates = following.map(c => {
          const ns = new Date(c.scheduled_at)
          ns.setHours(startDt.getHours(), startDt.getMinutes(), 0, 0)
          return { id: c.id, ...base, scheduled_at: ns.toISOString(), ends_at: computeEndsAt(ns.toISOString(), form.ends_at_time) }
        })
        const { error: e3 } = await supabase.from('classes').upsert(updates, { onConflict: 'id' })
        if (e3) { setLoading(false); toast.error('Erro: ' + e3.message); return }
      }

      setLoading(false)
      const total = 1 + (following?.length ?? 0)
      toast.success(`${total} aula${total !== 1 ? 's' : ''} atualizada${total !== 1 ? 's' : ''}!`)
    }

    router.push('/aulas')
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.student_id || !form.teacher_id || !dateValue || !timeValue) return

    if (isEditing) {
      if (hasSeries) { setShowSeriesDialog(true); return }
      await doSave('single')
      return
    }

    setLoading(true)
    const dates    = buildDates(form.scheduled_at, form.repeat, form.repeat_until)
    const seriesId = dates.length > 1 ? crypto.randomUUID() : null

    const payloads = dates.map(d => ({
      student_id:    form.student_id,
      teacher_id:    form.teacher_id,
      enrollment_id: null,
      scheduled_at:  d.toISOString(),
      ends_at:       computeEndsAt(d.toISOString(), form.ends_at_time),
      level:         form.level,
      subject:       form.subject || null,
      price:         null,
      status:        'agendada',
      notes:         form.notes || null,
      series_id:     seriesId,
    }))

    const { data: inserted, error } = await supabase.from('classes').insert(payloads).select('id, scheduled_at, ends_at')
    setLoading(false)
    if (error) { toast.error('Erro ao registrar: ' + error.message); return }

    const prof    = professors.find(p => p.id === form.teacher_id)
    const student = students.find(s => s.id === form.student_id)
    const studentName   = student?.name ?? 'Aluno'
    const professorName = prof?.name    ?? 'Prof'

    toast.success(dates.length > 1 ? `${dates.length} aulas registradas!` : 'Aula registrada!')

    dates.forEach(d => {
      createAulaGoogleEvent({ studentName, professorName, scheduledAt: d.toISOString(), level: form.level, notes: form.notes }).catch(() => {})
    })

    if (inserted?.length) {
      let durationMinutes = 60
      if (form.ends_at_time) {
        const start = new Date(form.scheduled_at)
        const [h, m] = form.ends_at_time.split(':').map(Number)
        const end = new Date(form.scheduled_at)
        end.setHours(h, m, 0, 0)
        const mins = Math.round((end.getTime() - start.getTime()) / 60000)
        if (mins > 0) durationMinutes = mins
      }

      const subjectLabel = SUBJECTS.find(s => s.value === form.subject)?.label ?? null
      const levelLabel   = LEVELS.find(l => l.value === form.level)?.label ?? form.level
      const topic = subjectLabel
        ? `Aula de ${subjectLabel} (${levelLabel}) — ${studentName}`
        : `Aula ${levelLabel} — ${studentName}`

      fetch('/api/aulas/post-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classes: inserted.map(c => ({ id: c.id, scheduledAt: c.scheduled_at, endsAt: c.ends_at ?? null })),
          repeatMode: form.repeat,
          repeatUntil: form.repeat_until || undefined,
          durationMinutes, topic,
          professorEmail:   prof?.email    ?? null,
          professorName,    studentName,
          studentEmail:     student?.email ?? null,
          responsibleEmail: student?.responsible_email ?? null,
          subject: form.subject || null,
          level:   form.level,
          notes:   form.notes || null,
        }),
      }).catch(err => console.error('[post-create]', err))
    }

    router.push('/aulas')
    router.refresh()
  }

  const isValid = !!(form.student_id && form.teacher_id && dateValue && timeValue &&
    (form.repeat === 'none' || !!form.repeat_until || isEditing))

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Series dialog */}
      {showSeriesDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div>
              <p className="font-semibold text-base" style={{ color: '#0d2e1e' }}>Esta aula faz parte de uma série</p>
              <p className="text-sm mt-1" style={{ color: '#6b8c6b' }}>O que você deseja alterar?</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => doSave('single')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border text-left hover:bg-gray-50"
                style={{ borderColor: '#d4e8d4' }}>
                <Calendar className="h-5 w-5 flex-shrink-0" style={{ color: '#1e6b40' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0d2e1e' }}>Só esta aula</p>
                  <p className="text-xs" style={{ color: '#6b8c6b' }}>As outras aulas não serão afetadas</p>
                </div>
              </button>
              <button onClick={() => doSave('following')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border text-left hover:bg-gray-50"
                style={{ borderColor: '#d4e8d4' }}>
                <CalendarDays className="h-5 w-5 flex-shrink-0" style={{ color: '#1e6b40' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0d2e1e' }}>Esta e as seguintes</p>
                  <p className="text-xs" style={{ color: '#6b8c6b' }}>Aplica a esta e todas as próximas da série</p>
                </div>
              </button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setShowSeriesDialog(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="max-w-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{isEditing ? 'Editar Aula' : 'Nova Aula'}</CardTitle>
              {hasSeries && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#e8faf0', color: '#1e6b40' }}>Série semanal</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Status (edit only) */}
            {isEditing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'agendada',  label: 'Agendada'  },
                    { value: 'realizada', label: 'Realizada' },
                    { value: 'cancelada', label: 'Cancelada' },
                  ] as const).map(s => (
                    <Chip key={s.value} label={s.label} selected={form.status === s.value}
                      onClick={() => setForm(f => ({ ...f, status: s.value }))} />
                  ))}
                </div>
              </div>
            )}

            {/* Aluno */}
            <div className="space-y-2">
              <Label>Aluno *</Label>
              <StudentSearch students={students} value={form.student_id}
                onChange={id => setForm(f => ({ ...f, student_id: id }))} />
            </div>

            {/* Professor */}
            <div className="space-y-2">
              <Label>Professor *</Label>
              <ProfessorSearch professors={professors} value={form.teacher_id}
                onChange={id => setForm(f => ({ ...f, teacher_id: id }))} />
            </div>

            {/* Data e horário */}
            <div className="space-y-2">
              <Label>Data e Horário *</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={dateValue}
                  onChange={e => setDate(e.target.value)} required />
                <select
                  value={timeValue}
                  onChange={e => setTime(e.target.value)}
                  required
                  className="rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
                  style={{ borderColor: timeValue ? '#1e6b40' : '#d4e8d4', color: timeValue ? '#0d2e1e' : '#9dbfa9', backgroundColor: timeValue ? '#f5fdf8' : 'white' }}
                >
                  <option value="">Horário</option>
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duração */}
            {timeValue && (
              <div className="space-y-2">
                <Label>Duração</Label>
                <div className="flex flex-wrap gap-2 items-center">
                  {DURATIONS.map(d => (
                    <Chip key={d.minutes} label={d.label} selected={selectedDuration === d.minutes}
                      onClick={() => applyDuration(d.minutes)} />
                  ))}
                  <Chip label="Personalizado" selected={isPersonalizado}
                    onClick={() => setForm(f => ({ ...f, ends_at_time: '' }))} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm" style={{ color: '#6b8c6b' }}>Término:</span>
                  <input type="time" value={form.ends_at_time}
                    onChange={e => setForm(f => ({ ...f, ends_at_time: e.target.value }))}
                    className="px-2 py-1.5 rounded-lg border text-sm w-28 outline-none"
                    style={{ borderColor: '#d4e8d4', color: '#0d2e1e' }} />
                </div>
              </div>
            )}

            {/* Nível */}
            <div className="space-y-2">
              <Label>Nível *</Label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map(l => (
                  <Chip key={l.value} label={l.label} selected={form.level === l.value}
                    onClick={() => setForm(f => ({ ...f, level: l.value }))} />
                ))}
              </div>
            </div>

            {/* Matéria */}
            <div className="space-y-2">
              <Label>Matéria <span style={{ color: '#9dbfa9', fontWeight: 400 }}>(opcional)</span></Label>
              <div className="flex flex-wrap gap-2">
                <Chip label="Nenhuma" selected={!form.subject}
                  onClick={() => setForm(f => ({ ...f, subject: '' }))} />
                {SUBJECTS.map(s => (
                  <Chip key={s.value} label={s.label} selected={form.subject === s.value}
                    onClick={() => setForm(f => ({ ...f, subject: s.value }))} />
                ))}
              </div>
            </div>

            {/* Repetição (create only) */}
            {!isEditing && (
              <div className="space-y-2">
                <Label>Repetição</Label>
                <div className="flex gap-2">
                  <Chip label="Não repete" selected={form.repeat === 'none'}
                    onClick={() => setForm(f => ({ ...f, repeat: 'none', repeat_until: '' }))} />
                  <Chip label="Semanal" selected={form.repeat === 'weekly'}
                    onClick={() => setForm(f => ({ ...f, repeat: 'weekly' }))} />
                </div>
                {form.repeat === 'weekly' && (
                  <div className="space-y-1.5 mt-2">
                    <Label style={{ fontSize: 12, color: '#6b8c6b' }}>Repetir até</Label>
                    <Input type="date" value={form.repeat_until} min={dateValue}
                      onChange={e => setForm(f => ({ ...f, repeat_until: e.target.value }))} required />
                  </div>
                )}
                {previewDates.length > 1 && (
                  <div className="rounded-lg p-3 space-y-1.5 mt-2"
                    style={{ backgroundColor: '#e8faf0', border: '1px solid #d4e8d4' }}>
                    <p className="text-xs font-semibold" style={{ color: '#1e6b40' }}>
                      {previewDates.length} aulas serão criadas:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {previewDates.slice(0, 8).map((d, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: 'white', color: '#1e6b40', border: '1px solid #d4e8d4' }}>
                          {format(d, 'dd/MM (EEE)', { locale: ptBR })}
                        </span>
                      ))}
                      {previewDates.length > 8 && (
                        <span className="text-xs px-1.5 py-0.5" style={{ color: '#6b8c6b' }}>
                          +{previewDates.length - 8} mais
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações <span style={{ color: '#9dbfa9', fontWeight: 400 }}>(opcional)</span></Label>
              <textarea id="notes" value={form.notes} rows={3}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none"
                style={{ borderColor: '#d4e8d4', color: '#0d2e1e' }} />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-1">
              <Button type="submit" className="flex-1" disabled={!isValid || loading}
                style={{ height: 48, fontSize: 15 }}>
                {loading
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar Alterações'
                    : previewDates.length > 1
                      ? `Registrar ${previewDates.length} Aulas`
                      : 'Registrar Aula'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </>
  )
}
