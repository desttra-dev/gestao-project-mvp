'use client'

import { useState } from 'react'
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

interface AulaFormProps {
  students: Student[]
  professors: Professor[]
  enrollments: Enrollment[]
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
    level: 'fundamental' as string,
    notes: '',
  })

  const filteredEnrollments = enrollments.filter(
    e => (!form.student_id || e.student_id === form.student_id) && e.status === 'ativo'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      student_id: form.student_id,
      teacher_id: form.teacher_id,
      enrollment_id: form.enrollment_id || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      level: form.level,
      status: 'agendada',
      notes: form.notes || null,
    }

    const { error } = await supabase.from('classes').insert(payload)

    setLoading(false)

    if (error) {
      toast.error('Erro ao registrar aula: ' + error.message)
      return
    }

    toast.success('Aula registrada!')
    router.push('/aulas')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Nova Aula</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Aluno *</Label>
            <Select
              value={form.student_id}
              onValueChange={v => { if (v) setForm(f => ({ ...f, student_id: v, enrollment_id: '' })) }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Professor *</Label>
            <Select
              value={form.teacher_id}
              onValueChange={v => { if (v) setForm(f => ({ ...f, teacher_id: v })) }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o professor" />
              </SelectTrigger>
              <SelectContent>
                {professors.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Matrícula / Plano</Label>
            <Select
              value={form.enrollment_id}
              onValueChange={v => { if (v) setForm(f => ({ ...f, enrollment_id: v })) }}
              disabled={!form.student_id}
            >
              <SelectTrigger>
                <SelectValue placeholder={form.student_id ? "Selecione a matrícula (opcional)" : "Selecione um aluno primeiro"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aula avulsa (sem matrícula)</SelectItem>
                {filteredEnrollments.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {(e.plan as any)?.name ?? 'Plano'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label>Nível da Aula *</Label>
            <Select
              value={form.level}
              onValueChange={v => { if (v) setForm(f => ({ ...f, level: v })) }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fundamental">Fundamental (R$40 repasse)</SelectItem>
                <SelectItem value="medio">Médio (R$45 repasse)</SelectItem>
                <SelectItem value="superior">Superior (R$50 repasse)</SelectItem>
                <SelectItem value="internacional">Internacional (R$50 repasse)</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Registrar Aula'}
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
