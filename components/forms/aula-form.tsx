'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Student, Professor, Enrollment, Class } from '@/lib/types'
import { createAulaGoogleEvent } from '@/app/actions/aulas'
import { addDays, addWeeks, addHours, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Calendar } from 'lucide-react'

interface AulaFormProps {
  students: Student[]
  professors: Professor[]
  enrollments: Enrollment[]
  aula?: Class
}

type RepeatMode = 'none' | 'daily' | 'weekly'
type EditScope  = 'single' | 'following'

const SUBJECT_LABELS: Record<string, string> = {
  matematica: 'Matemática', fisica: 'Física', quimica: 'Química', portugues: 'Português',
  historia: 'História', geografia: 'Geografia', filosofia: 'Filosofia',
  redacao: 'Redação', sociologia: 'Sociologia',
}

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
  if (!endsAtTime) return null
  const d = new Date(scheduledAt)
  const [h, m] = endsAtTime.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export function AulaForm({ students, professors, enrollments, aula }: AulaFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading]               = useState(false)
  const [showSeriesDialog, setShowSeriesDialog] = useState(false)
  const isEditing  = !!aula
  const hasSeries  = isEditing && !!aula?.series_id

  const [form, setForm] = useState({
    student_id:    aula?.student_id    ?? '',
    teacher_id:    aula?.teacher_id    ?? '',
    enrollment_id: aula?.enrollment_id ?? '',
    scheduled_at:  aula?.scheduled_at  ? toDatetimeLocal(aula.scheduled_at) : '',
    ends_at_time:  aula?.ends_at       ? format(new Date(aula.ends_at), 'HH:mm') : '',
    level:         aula?.level   ?? 'fundamental',
    subject:       aula?.subject ?? '',
    price:         aula?.price   != null ? String(aula.price) : '',
    status:        aula?.status  ?? 'agendada',
    notes:         aula?.notes   ?? '',
    repeat:        'none' as RepeatMode,
    repeat_until:  '',
  })

  const filteredEnrollments = useMemo(
    () => enrollments.filter(e => !form.student_id || e.student_id === form.student_id),
    [enrollments, form.student_id]
  )

  const previewDates = useMemo(() => {
    if (isEditing || !form.scheduled_at || form.repeat === 'none') return []
    return buildDates(form.scheduled_at, form.repeat, form.repeat_until)
  }, [isEditing, form.scheduled_at, form.repeat, form.repeat_until])

  // ── Save helpers ────────────────────────────────────────────────────────────

  async function doSave(scope: EditScope) {
    setShowSeriesDialog(false)
    setLoading(true)

    const startDt  = new Date(form.scheduled_at)
    const endsAt   = computeEndsAt(form.scheduled_at, form.ends_at_time)

    const basePayload = {
      student_id:    form.student_id,
      teacher_id:    form.teacher_id,
      enrollment_id: form.enrollment_id || null,
      level:         form.level,
      subject:       form.subject || null,
      price:         form.price ? parseFloat(form.price) : null,
      status:        form.status,
      notes:         form.notes || null,
    }

    if (scope === 'single') {
      const { error } = await supabase
        .from('classes')
        .update({ ...basePayload, scheduled_at: startDt.toISOString(), ends_at: endsAt })
        .eq('id', aula!.id)

      setLoading(false)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Aula atualizada!')

    } else {
      // 1. Update current class
      const { error: err1 } = await supabase
        .from('classes')
        .update({ ...basePayload, scheduled_at: startDt.toISOString(), ends_at: endsAt })
        .eq('id', aula!.id)

      if (err1) { setLoading(false); toast.error('Erro: ' + err1.message); return }

      // 2. Fetch following classes in same series (after current)
      const { data: following, error: err2 } = await supabase
        .from('classes')
        .select('id, scheduled_at')
        .eq('series_id', aula!.series_id)
        .gt('scheduled_at', aula!.scheduled_at)
        .order('scheduled_at')

      if (err2) { setLoading(false); toast.error('Erro: ' + err2.message); return }

      // 3. Update each following class: keep their DATE, apply the new TIME from current edit
      if (following && following.length > 0) {
        const newHour   = startDt.getHours()
        const newMinute = startDt.getMinutes()

        const updates = following.map(c => {
          // Keep original date, swap to new time of day
          const newStart = new Date(c.scheduled_at)
          newStart.setHours(newHour, newMinute, 0, 0)
          return {
            id: c.id,
            ...basePayload,
            scheduled_at: newStart.toISOString(),
            ends_at: computeEndsAt(newStart.toISOString(), form.ends_at_time),
          }
        })

        const { error: err3 } = await supabase.from('classes').upsert(updates, { onConflict: 'id' })
        if (err3) { setLoading(false); toast.error('Erro: ' + err3.message); return }
      }

      setLoading(false)
      const total = 1 + (following?.length ?? 0)
      toast.success(`${total} aula${total !== 1 ? 's' : ''} atualizada${total !== 1 ? 's' : ''}!`)
    }

    router.push('/aulas')
    router.refresh()
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.student_id || !form.teacher_id || !form.scheduled_at) return

    if (isEditing) {
      // If belongs to a series, ask the user what to edit
      if (hasSeries) {
        setShowSeriesDialog(true)
        return
      }
      await doSave('single')
      return
    }

    // ── CREATE ───────────────────────────────────────────────────────────────
    setLoading(true)
    const dates = buildDates(form.scheduled_at, form.repeat, form.repeat_until)
    const seriesId = dates.length > 1 ? crypto.randomUUID() : null

    const payloads = dates.map(d => ({
      student_id:    form.student_id,
      teacher_id:    form.teacher_id,
      enrollment_id: form.enrollment_id || null,
      scheduled_at:  d.toISOString(),
      ends_at:       computeEndsAt(d.toISOString(), form.ends_at_time),
      level:         form.level,
      subject:       form.subject || null,
      price:         form.price ? parseFloat(form.price) : null,
      status:        'agendada',
      notes:         form.notes || null,
      series_id:     seriesId,
    }))

    const { data: inserted, error } = await supabase
      .from('classes')
      .insert(payloads)
      .select('id, scheduled_at, ends_at')

    setLoading(false)
    if (error) { toast.error('Erro ao registrar: ' + error.message); return }

    const selectedProf    = professors.find(p => p.id === form.teacher_id)
    const selectedStudent = students.find(s => s.id === form.student_id)
    const studentName     = selectedStudent?.name ?? 'Aluno'
    const professorName   = selectedProf?.name ?? 'Prof'
    toast.success(dates.length > 1 ? `${dates.length} aulas registradas!` : 'Aula registrada!')

    dates.forEach(d => {
      createAulaGoogleEvent({ studentName, professorName, scheduledAt: d.toISOString(), level: form.level, notes: form.notes }).catch(() => {})
    })

    if (inserted && inserted.length > 0) {
      let durationMinutes = 60
      if (form.ends_at_time && form.scheduled_at) {
        const start = new Date(form.scheduled_at)
        const [h, m] = form.ends_at_time.split(':').map(Number)
        const end = new Date(form.scheduled_at)
        end.setHours(h, m, 0, 0)
        const mins = Math.round((end.getTime() - start.getTime()) / 60000)
        if (mins > 0) durationMinutes = mins
      }

      const subjectLabel = form.subject
        ? ({ matematica: 'Matemática', fisica: 'Física', quimica: 'Química', portugues: 'Português', historia: 'História', geografia: 'Geografia', filosofia: 'Filosofia', redacao: 'Redação', sociologia: 'Sociologia' }[form.subject] ?? form.subject)
        : null
      const levelLabel = { fundamental: 'Fundamental', medio: 'Médio', superior: 'Superior', internacional: 'Internacional' }[form.level] ?? form.level
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
          durationMinutes,
          topic,
          professorEmail: selectedProf?.email ?? null,
          professorName,
          studentName,
          studentEmail: selectedStudent?.email ?? null,
          responsibleEmail: selectedStudent?.responsible_email ?? null,
          subject: form.subject || null,
          level: form.level,
          notes: form.notes || null,
        }),
      }).catch(err => console.error('[post-create] erro:', err))
    }

    router.push('/aulas')
    router.refresh()
  }

  const selectedStudent    = students.find(s => s.id === form.student_id)
  const selectedProfessor  = professors.find(p => p.id === form.teacher_id)
  const selectedEnrollment = filteredEnrollments.find(e => e.id === form.enrollment_id)

  return (
    <>
      {/* ── Dialog de série ─────────────────────────────────────────────── */}
      {showSeriesDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div>
              <p className="font-semibold text-base" style={{ color: '#0d2e1e' }}>
                Esta aula faz parte de uma série
              </p>
              <p className="text-sm mt-1" style={{ color: '#6b8c6b' }}>
                O que você deseja alterar?
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => doSave('single')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors hover:bg-gray-50"
                style={{ borderColor: '#d4e8d4' }}
              >
                <Calendar className="h-5 w-5 flex-shrink-0" style={{ color: '#1e6b40' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0d2e1e' }}>Só esta aula</p>
                  <p className="text-xs" style={{ color: '#6b8c6b' }}>As outras aulas da série não serão afetadas</p>
                </div>
              </button>

              <button
                onClick={() => doSave('following')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors hover:bg-gray-50"
                style={{ borderColor: '#d4e8d4' }}
              >
                <CalendarDays className="h-5 w-5 flex-shrink-0" style={{ color: '#1e6b40' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0d2e1e' }}>Esta e as seguintes</p>
                  <p className="text-xs" style={{ color: '#6b8c6b' }}>As alterações se aplicam a esta aula e todas as próximas da série</p>
                </div>
              </button>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setShowSeriesDialog(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{isEditing ? 'Editar Aula' : 'Nova Aula'}</CardTitle>
              {hasSeries && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#e8faf0', color: '#1e6b40' }}>
                  Série semanal
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Aluno */}
            <div className="space-y-2">
              <Label>Aluno *</Label>
              <Select
                value={form.student_id}
                onValueChange={v => { if (v) setForm(f => ({ ...f, student_id: v, enrollment_id: '' })) }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o aluno">{selectedStudent?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id} label={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Professor */}
            <div className="space-y-2">
              <Label>Professor *</Label>
              <Select
                value={form.teacher_id}
                onValueChange={v => { if (v) setForm(f => ({ ...f, teacher_id: v })) }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o professor">{selectedProfessor?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {professors.map(p => <SelectItem key={p.id} value={p.id} label={p.name}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Matéria + Nível */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Matéria</Label>
                <Select
                  value={form.subject || 'none'}
                  onValueChange={v => setForm(f => ({ ...f, subject: v === 'none' ? '' : (v ?? '') }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sem matéria">
                      {form.subject ? (SUBJECT_LABELS[form.subject] ?? form.subject) : 'Sem matéria'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" label="— Sem matéria —">— Sem matéria —</SelectItem>
                    {Object.entries(SUBJECT_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v} label={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nível *</Label>
                <Select value={form.level} onValueChange={v => { if (v) setForm(f => ({ ...f, level: v })) }}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {{ fundamental: 'Fundamental', medio: 'Médio', superior: 'Superior', internacional: 'Internacional' }[form.level]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fundamental"   label="Fundamental">Fundamental (R$40 repasse)</SelectItem>
                    <SelectItem value="medio"         label="Médio">Médio (R$45 repasse)</SelectItem>
                    <SelectItem value="superior"      label="Superior">Superior (R$50 repasse)</SelectItem>
                    <SelectItem value="internacional" label="Internacional">Internacional (R$50 repasse)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Início + Término + Valor */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Início *</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={e => {
                    const val = e.target.value
                    setForm(f => ({
                      ...f,
                      scheduled_at: val,
                      ends_at_time: f.ends_at_time || (val ? format(addHours(new Date(val), 1), 'HH:mm') : ''),
                    }))
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at_time">Término</Label>
                <Input
                  id="ends_at_time"
                  type="time"
                  value={form.ends_at_time}
                  onChange={e => setForm(f => ({ ...f, ends_at_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Valor (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>
            </div>

            {/* Status — só no edit */}
            {isEditing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => { if (v) setForm(f => ({ ...f, status: v })) }}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {{ agendada: 'Agendada', realizada: 'Realizada', cancelada: 'Cancelada' }[form.status]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendada"  label="Agendada">Agendada</SelectItem>
                    <SelectItem value="realizada" label="Realizada">Realizada</SelectItem>
                    <SelectItem value="cancelada" label="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Matrícula / Plano */}
            <div className="space-y-2">
              <Label>Matrícula / Plano</Label>
              <Select
                value={form.enrollment_id || 'avulsa'}
                onValueChange={v => setForm(f => ({ ...f, enrollment_id: v === 'avulsa' ? '' : (v ?? '') }))}
                disabled={!form.student_id}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={form.student_id ? 'Selecione o plano' : 'Selecione um aluno primeiro'}>
                    {form.enrollment_id ? ((selectedEnrollment?.plan as any)?.name ?? 'Plano') : 'Aula avulsa'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avulsa" label="Aula avulsa">Aula avulsa</SelectItem>
                  {filteredEnrollments.map(e => (
                    <SelectItem key={e.id} value={e.id} label={(e.plan as any)?.name ?? 'Plano'}>
                      {(e.plan as any)?.name ?? 'Plano'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Repetição — só na criação */}
            {!isEditing && (
              <div className={form.repeat !== 'none' ? 'grid grid-cols-2 gap-3' : ''}>
                <div className="space-y-2">
                  <Label>Repetição</Label>
                  <Select
                    value={form.repeat}
                    onValueChange={v => setForm(f => ({ ...f, repeat: v as RepeatMode, repeat_until: '' }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {{ none: 'Não repete', daily: 'Todo dia', weekly: 'Semanalmente' }[form.repeat]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none"   label="Não repete">Não repete</SelectItem>
                      <SelectItem value="daily"  label="Todo dia">Repete todo dia</SelectItem>
                      <SelectItem value="weekly" label="Semanalmente">Repete semanalmente (mesmo dia)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.repeat !== 'none' && (
                  <div className="space-y-2">
                    <Label htmlFor="repeat_until">Repetir até *</Label>
                    <Input
                      id="repeat_until"
                      type="date"
                      value={form.repeat_until}
                      min={form.scheduled_at ? form.scheduled_at.slice(0, 10) : undefined}
                      onChange={e => setForm(f => ({ ...f, repeat_until: e.target.value }))}
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* Preview datas */}
            {previewDates.length > 1 && (
              <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: '#e8faf0', border: '1px solid #d4e8d4' }}>
                <p className="text-xs font-semibold" style={{ color: '#1e6b40' }}>
                  {previewDates.length} aulas serão criadas:
                </p>
                <div className="flex flex-wrap gap-1">
                  {previewDates.slice(0, 8).map((d, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'white', color: '#1e6b40', border: '1px solid #d4e8d4' }}>
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

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={
                  loading ||
                  !form.student_id ||
                  !form.teacher_id ||
                  !form.scheduled_at ||
                  (!isEditing && form.repeat !== 'none' && !form.repeat_until)
                }
              >
                {loading
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar Alterações'
                    : previewDates.length > 1
                      ? `Registrar ${previewDates.length} Aulas`
                      : 'Registrar Aula'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  )
}
