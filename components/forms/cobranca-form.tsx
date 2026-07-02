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
import type { Student, Enrollment, Currency } from '@/lib/types'
import { format } from 'date-fns'
import { countryByCode, COUNTRIES } from '@/lib/countries'

interface CobrancaFormProps {
  students: Student[]
  enrollments: Enrollment[]
}

export function CobrancaForm({ students, enrollments }: CobrancaFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const currentPeriod = format(new Date(), 'yyyy-MM')

  const [form, setForm] = useState({
    student_id: '',
    enrollment_id: '',
    amount: '',
    currency: 'BRL' as Currency,
    due_date: today,
    period_reference: currentPeriod,
    payment_method: '' as string,
    notes: '',
  })

  const studentEnrollments = enrollments.filter(
    e => e.student_id === form.student_id && e.status === 'ativo'
  )

  const selectedStudent = students.find(s => s.id === form.student_id)

  const handleStudentChange = (studentId: string | null) => {
    if (!studentId) return
    const student = students.find(s => s.id === studentId)
    setForm(f => ({
      ...f,
      student_id: studentId,
      enrollment_id: '',
      currency: (countryByCode[student?.country ?? 'BR']?.currency ?? 'BRL') as Currency,
    }))
  }

  const handleEnrollmentChange = (enrollmentId: string | null) => {
    if (!enrollmentId) return
    const enrollment = enrollments.find(e => e.id === enrollmentId)
    setForm(f => ({
      ...f,
      enrollment_id: enrollmentId,
      amount: enrollment?.plan ? String((enrollment.plan as any).price) : f.amount,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      student_id: form.student_id,
      enrollment_id: form.enrollment_id || null,
      amount: parseFloat(form.amount),
      currency: form.currency,
      due_date: form.due_date,
      period_reference: form.period_reference,
      status: 'pendente',
      payment_method: form.payment_method || null,
      notes: form.notes || null,
    }

    const { error } = await supabase.from('charges').insert(payload)
    setLoading(false)

    if (error) {
      toast.error('Erro ao criar cobrança: ' + error.message)
      return
    }

    toast.success('Cobrança criada!')
    router.push('/financeiro/cobrancas')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Nova Cobrança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Aluno *</Label>
            <Select value={form.student_id} onValueChange={handleStudentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {countryByCode[s.country]?.flag ?? ''} {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.student_id && studentEnrollments.length > 0 && (
            <div className="space-y-2">
              <Label>Matrícula / Plano</Label>
              <Select value={form.enrollment_id} onValueChange={handleEnrollmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matrícula (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem matrícula (avulso)</SelectItem>
                  {studentEnrollments.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {(e.plan as any)?.name ?? 'Plano'} — {(e.plan as any)?.currency === 'EUR' ? '€' : 'R$'} {(e.plan as any)?.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Select
                value={form.currency}
                onValueChange={v => { if (v) setForm(f => ({ ...f, currency: v as Currency })) }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(COUNTRIES.map(c => c.currency))).map(cur => {
                    const c = COUNTRIES.find(x => x.currency === cur)!
                    return <SelectItem key={cur} value={cur}>{cur} ({c.currencySymbol})</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_reference">Referência (mês)</Label>
              <Input
                id="period_reference"
                type="month"
                value={form.period_reference}
                onChange={e => setForm(f => ({ ...f, period_reference: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <Select
              value={form.payment_method}
              onValueChange={v => { if (v) setForm(f => ({ ...f, payment_method: v })) }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="iban">IBAN</SelectItem>
                <SelectItem value="wise">Wise</SelectItem>
                <SelectItem value="cora">Cora</SelectItem>
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
              {loading ? 'Salvando...' : 'Criar Cobrança'}
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
