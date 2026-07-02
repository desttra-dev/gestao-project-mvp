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
import { COUNTRIES, countryByCode, detectCountryFromPhone } from '@/lib/countries'
import type { Student } from '@/lib/types'

const followUpOptions = [
  { value: 'none',      label: 'Sem retorno agendado' },
  { value: 'next_week', label: 'Semana que vem' },
  { value: 'jan', label: 'Janeiro' },  { value: 'fev', label: 'Fevereiro' },
  { value: 'mar', label: 'Março' },    { value: 'abr', label: 'Abril' },
  { value: 'mai', label: 'Maio' },     { value: 'jun', label: 'Junho' },
  { value: 'jul', label: 'Julho' },    { value: 'ago', label: 'Agosto' },
  { value: 'set', label: 'Setembro' }, { value: 'out', label: 'Outubro' },
  { value: 'nov', label: 'Novembro' }, { value: 'dez', label: 'Dezembro' },
]

export function AlunoForm({ student }: { student?: Student }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)

  const [form, setForm] = useState({
    name:               student?.name ?? '',
    email:              student?.email ?? '',
    phone:              student?.phone ?? '',
    country:            student?.country ?? 'BR',
    status:             student?.status ?? 'ativo',
    notes:              student?.notes ?? '',
    responsible_name:   student?.responsible_name ?? '',
    responsible_phone:  student?.responsible_phone ?? '',
    responsible_email:  student?.responsible_email ?? '',
    follow_up:          student?.follow_up ?? 'none',
    follow_up_notes:    student?.follow_up_notes ?? '',
  })

  const selectedCountry = countryByCode[form.country]

  const handlePhoneChange = (phone: string) => {
    setForm(f => ({ ...f, phone }))
    const detected = detectCountryFromPhone(phone)
    if (detected) {
      setDetectedCountry(detected)
    } else {
      setDetectedCountry(null)
    }
  }

  const applyDetectedCountry = () => {
    if (detectedCountry) {
      setForm(f => ({ ...f, country: detectedCountry as import('@/lib/types').Country }))
      setDetectedCountry(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name:               form.name,
      email:              form.email || null,
      phone:              form.phone || null,
      country:            form.country,
      status:             form.status,
      active:             form.status === 'ativo',
      notes:              form.notes || null,
      responsible_name:   form.responsible_name || null,
      responsible_phone:  form.responsible_phone || null,
      responsible_email:  form.responsible_email || null,
      follow_up:          form.follow_up,
      follow_up_notes:    form.follow_up_notes || null,
    }

    let error
    if (student) {
      ({ error } = await supabase.from('students').update(payload).eq('id', student.id))
    } else {
      ({ error } = await supabase.from('students').insert(payload))
    }

    setLoading(false)
    if (error) { toast.error('Erro ao salvar aluno: ' + error.message); return }
    toast.success(student ? 'Aluno atualizado!' : 'Aluno cadastrado!')
    router.push('/alunos')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-h2">{student ? 'Editar Aluno' : 'Novo Aluno'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Dados principais */}
          <div className="space-y-4">
            <p className="text-label uppercase tracking-wider" style={{ color: '#1e6b40' }}>Dados do Aluno</p>

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <div className="space-y-1">
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    placeholder="+55 11 99999-9999"
                  />
                  {detectedCountry && detectedCountry !== form.country && (
                    <button
                      type="button"
                      onClick={applyDetectedCountry}
                      className="text-xs px-2 py-1 rounded-md transition-colors"
                      style={{ backgroundColor: '#e8faf0', color: '#1e6b40' }}
                    >
                      {countryByCode[detectedCountry]?.flag} Detectado: {countryByCode[detectedCountry]?.name} — aplicar?
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>País</Label>
                <Select value={form.country} onValueChange={v => { if (v) setForm(f => ({ ...f, country: v })) }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCountry && (
                  <p className="text-xs" style={{ color: '#6b8c6b' }}>
                    Moeda: {selectedCountry.currencySymbol} {selectedCountry.currency}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => { if (v) setForm(f => ({ ...f, status: v as any })) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">✅ Ativo</SelectItem>
                    <SelectItem value="suspenso">⏸️ Suspenso</SelectItem>
                    <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                    <SelectItem value="experimento">🔍 Experimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>

          <Separator />

          {/* Responsável */}
          <div className="space-y-4">
            <p className="text-label uppercase tracking-wider" style={{ color: '#1e6b40' }}>Responsável</p>
            <div className="space-y-2">
              <Label htmlFor="responsible_name">Nome do Responsável</Label>
              <Input id="responsible_name" value={form.responsible_name}
                onChange={e => setForm(f => ({ ...f, responsible_name: e.target.value }))}
                placeholder="Deixe em branco se o aluno é o próprio responsável" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsible_phone">WhatsApp do Responsável</Label>
                <Input id="responsible_phone" value={form.responsible_phone}
                  onChange={e => setForm(f => ({ ...f, responsible_phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsible_email">E-mail do Responsável</Label>
                <Input id="responsible_email" type="email" value={form.responsible_email}
                  onChange={e => setForm(f => ({ ...f, responsible_email: e.target.value }))} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Retorno */}
          <div className="space-y-4">
            <p className="text-label uppercase tracking-wider" style={{ color: '#1e6b40' }}>Voltar a Entrar em Contato</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quando retornar</Label>
                <Select value={form.follow_up} onValueChange={v => { if (v) setForm(f => ({ ...f, follow_up: v as any })) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {followUpOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="follow_up_notes">Motivo / Observação</Label>
                <Input id="follow_up_notes" value={form.follow_up_notes}
                  onChange={e => setForm(f => ({ ...f, follow_up_notes: e.target.value }))}
                  placeholder="Ex: viagem, aguardando retorno..." />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
