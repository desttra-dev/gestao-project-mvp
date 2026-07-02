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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { Student, Professor, FinancialTransaction, Currency } from '@/lib/types'
import { COUNTRIES } from '@/lib/countries'

interface Props {
  students: Student[]
  professors: Professor[]
  transaction?: FinancialTransaction
}

export function TransacaoForm({ students, professors, transaction }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    type:             (transaction?.type ?? 'entrada') as 'entrada' | 'saida',
    amount:           transaction ? String(transaction.amount) : '',
    currency:         (transaction?.currency ?? 'BRL') as Currency,
    transaction_date: transaction?.transaction_date ?? format(new Date(), 'yyyy-MM-dd'),
    description:      transaction?.description ?? '',
    student_id:       transaction?.student_id ?? '',
    responsible_name: transaction?.responsible_name ?? '',
    professor_id:     transaction?.professor_id ?? '',
    category:         transaction?.category ?? '',
    notes:            transaction?.notes ?? '',
  })

  const isEntrada = form.type === 'entrada'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      type:             form.type,
      amount:           parseFloat(form.amount),
      currency:         form.currency,
      transaction_date: form.transaction_date,
      description:      form.description,
      student_id:       form.student_id || null,
      responsible_name: form.responsible_name || null,
      professor_id:     form.professor_id || null,
      category:         form.category || null,
      notes:            form.notes || null,
    }

    let error
    if (transaction) {
      ({ error } = await supabase.from('financial_transactions').update(payload).eq('id', transaction.id))
    } else {
      ({ error } = await supabase.from('financial_transactions').insert(payload))
    }

    setLoading(false)
    if (error) { toast.error('Erro ao salvar lançamento: ' + error.message); return }
    toast.success(transaction ? 'Lançamento atualizado!' : 'Lançamento registrado!')
    router.push('/financeiro/lancamentos')
    router.refresh()
  }

  const currencies = Array.from(new Set(COUNTRIES.map(c => c.currency))).map(cur => {
    const c = COUNTRIES.find(x => x.currency === cur)!
    return { value: cur, label: `${cur} (${c.currencySymbol})` }
  })

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-h2">{transaction ? 'Editar Lançamento' : 'Novo Lançamento'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Tipo e valor */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, type: 'entrada' }))}
                className="py-3 rounded-lg border-2 text-sm font-semibold transition-all"
                style={{
                  borderColor: isEntrada ? '#1e6b40' : '#d4e8d4',
                  backgroundColor: isEntrada ? '#e8faf0' : 'transparent',
                  color: isEntrada ? '#1e6b40' : '#4a5a4a',
                }}
              >
                ↑ Entrada
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, type: 'saida' }))}
                className="py-3 rounded-lg border-2 text-sm font-semibold transition-all"
                style={{
                  borderColor: !isEntrada ? '#b91c1c' : '#d4e8d4',
                  backgroundColor: !isEntrada ? '#fee2e2' : 'transparent',
                  color: !isEntrada ? '#b91c1c' : '#4a5a4a',
                }}
              >
                ↓ Saída
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Valor *</Label>
                <Input type="number" step="0.01" min="0" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select value={form.currency} onValueChange={v => { if (v) setForm(f => ({ ...f, currency: v as Currency })) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" value={form.transaction_date}
                  onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => { if (v) setForm(f => ({ ...f, category: v })) }}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensalidade">Mensalidade</SelectItem>
                    <SelectItem value="avulsa">Aula Avulsa</SelectItem>
                    <SelectItem value="repasse">Repasse Professor</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="software">Software / Ferramenta</SelectItem>
                    <SelectItem value="taxa">Taxa / Imposto</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={isEntrada ? 'Ex: Mensalidade julho — Ana Silva' : 'Ex: Repasse Prof. Carlos — julho'}
                required />
            </div>
          </div>

          <Separator />

          {/* Vínculos */}
          <div className="space-y-4">
            <p className="text-label uppercase tracking-wider" style={{ color: '#1e6b40' }}>
              {isEntrada ? 'Aluno / Responsável' : 'Professor (opcional)'}
            </p>

            {isEntrada ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aluno</Label>
                  <Select value={form.student_id} onValueChange={v => { if (v) setForm(f => ({ ...f, student_id: v })) }}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nome do Responsável pelo Pagamento</Label>
                  <Input value={form.responsible_name}
                    onChange={e => setForm(f => ({ ...f, responsible_name: e.target.value }))}
                    placeholder="Se diferente do aluno..." />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Professor</Label>
                <Select value={form.professor_id} onValueChange={v => { if (v) setForm(f => ({ ...f, professor_id: v })) }}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)..." /></SelectTrigger>
                  <SelectContent>
                    {professors.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : transaction ? 'Salvar Alterações' : 'Registrar Lançamento'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
