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
import type { Student, Professor, Enrollment } from '@/lib/types'
import { createAulaGoogleEvent } from '@/app/actions/aulas'
import { addDays, addWeeks, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AulaFormProps {
  students: Student[]
  professors: Professor[]
  enrollments: Enrollment[]
}

type RepeatMode = 'none' | 'daily' | 'weekly'

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

export function AulaForm({ students, professors, enrollments }: AulaFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    student_id: '',
    teacher_id: '',
    enrollment_id: '',
    scheduled_at: '',
    level: 'fundamental',
    subject: '',
    price: '',
    notes: '',
    repeat: 'none' as RepeatMode,
    repeat_until: '',
  })

  const filteredEnrollments = useMemo(
    () => enrollments.filter(e => !form.student_id || e.student_id === form.student_id),
    [enrollments, form.student_id]
  )

  const previewDates = useMemo(() => {
    if (!form.scheduled_at || form.repeat === 'none') return []
    return buildDates(form.scheduled_at, form.repeat, form.repeat_until)
  }, [form.scheduled_at, form.repeat, form.repeat_until])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.student_id || !form.teacher_id || !form.scheduled_at) return
    setLoading(true)

    const dates = buildDates(form.scheduled_at, form.repeat, form.repeat_until)

    const payloads = dates.map(d => ({
      student_id: form.student_id,
      teacher_id: form.teacher_id,
      enrollment_id: form.enrollment_id || null,
      scheduled_at: d.toISOString(),
      level: form.level,
      subject: form.subject || null,
      price: form.price ? parseFloat(form.price) : null,
      status: 'agendada',
      notes: form.notes || null,
    }))

    const { error } = await supabase.from('classes').insert(payloads)
    setLoading(false)

    if (error) {
      toast.error('Erro ao registrar aula: ' + error.message)
      return
    }

    const studentName = students.find(s => s.id === form.student_id)?.name ?? 'Aluno'
    const professorName = professors.find(p => p.id === form.teacher_id)?.name ?? 'Prof'

    toast.success(dates.length > 1 ? `${dates.length} aulas registradas!` : 'Aula registrada!')

    dates.forEach(d => {
      createAulaGoogleEvent({
        studentName,
        professorName,
        scheduledAt: d.toISOString(),
        level: form.level,
        notes: form.notes,
      }).catch(() => {})
    })

    router.push('/aulas')
    router.refresh()
  }

  const selectedStudent = students.find(s => s.id === form.student_id)
  const selectedProfessor = professors.find(p => p.id === form.teacher_id)
  const selectedEnrollment = filteredEnrollments.find(e => e.id === form.enrollment_id)

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Nova Aula</CardTitle>
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
                <SelectValue placeholder="Selecione o aluno">
                  {selectedStudent?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id} label={s.name}>{s.name}</SelectItem>
                ))}
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
                <SelectValue placeholder="Selecione o professor">
                  {selectedProfessor?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {professors.map(p => (
                  <SelectItem key={p.id} value={p.id} label={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Matéria + Nível — lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Matéria</Label>
              <Select
                value={form.subject || 'none'}
                onValueChange={v => setForm(f => ({ ...f, subject: v === 'none' ? '' : (v ?? '') }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sem matéria">
                    {form.subject
                      ? ({ matematica: 'Matemática', fisica: 'Física', quimica: 'Química', portugues: 'Português', historia: 'História', geografia: 'Geografia', filosofia: 'Filosofia', redacao: 'Redação', sociologia: 'Sociologia' }[form.subject] ?? form.subject)
                      : 'Sem matéria'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" label="— Sem matéria —">— Sem matéria —</SelectItem>
                  <SelectItem value="matematica" label="Matemática">Matemática</SelectItem>
                  <SelectItem value="fisica" label="Física">Física</SelectItem>
                  <SelectItem value="quimica" label="Química">Química</SelectItem>
                  <SelectItem value="portugues" label="Português">Português</SelectItem>
                  <SelectItem value="historia" label="História">História</SelectItem>
                  <SelectItem value="geografia" label="Geografia">Geografia</SelectItem>
                  <SelectItem value="filosofia" label="Filosofia">Filosofia</SelectItem>
                  <SelectItem value="redacao" label="Redação">Redação</SelectItem>
                  <SelectItem value="sociologia" label="Sociologia">Sociologia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível *</Label>
              <Select
                value={form.level}
                onValueChange={v => { if (v) setForm(f => ({ ...f, level: v })) }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {{ fundamental: 'Fundamental', medio: 'Médio', superior: 'Superior', internacional: 'Internacional' }[form.level]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fundamental" label="Fundamental">Fundamental (R$40 repasse)</SelectItem>
                  <SelectItem value="medio" label="Médio">Médio (R$45 repasse)</SelectItem>
                  <SelectItem value="superior" label="Superior">Superior (R$50 repasse)</SelectItem>
                  <SelectItem value="internacional" label="Internacional">Internacional (R$50 repasse)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data/Hora + Valor — lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="scheduled_at">Data e Hora *</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Valor da Aula (R$)</Label>
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
                  {form.enrollment_id
                    ? ((selectedEnrollment?.plan as any)?.name ?? 'Plano')
                    : 'Aula avulsa'}
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

          {/* Repetição + Repetir até — lado a lado quando ativado */}
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
                  <SelectItem value="none" label="Não repete">Não repete</SelectItem>
                  <SelectItem value="daily" label="Todo dia">Repete todo dia</SelectItem>
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
              disabled={loading || !form.student_id || !form.teacher_id || !form.scheduled_at || (form.repeat !== 'none' && !form.repeat_until)}
            >
              {loading
                ? 'Salvando...'
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
  )
}
