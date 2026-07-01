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
import type { Student } from '@/lib/types'

interface AlunoFormProps {
  student?: Student
}

export function AlunoForm({ student }: AlunoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: student?.name ?? '',
    email: student?.email ?? '',
    phone: student?.phone ?? '',
    country: student?.country ?? 'BR',
    notes: student?.notes ?? '',
    active: student?.active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      country: form.country,
      notes: form.notes || null,
      active: form.active,
    }

    let error
    if (student) {
      ({ error } = await supabase.from('students').update(payload).eq('id', student.id))
    } else {
      ({ error } = await supabase.from('students').insert(payload))
    }

    setLoading(false)

    if (error) {
      toast.error('Erro ao salvar aluno: ' + error.message)
      return
    }

    toast.success(student ? 'Aluno atualizado!' : 'Aluno cadastrado!')
    router.push('/alunos')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{student ? 'Editar Aluno' : 'Novo Aluno'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>País</Label>
            <Select
              value={form.country}
              onValueChange={v => { if (v) setForm(f => ({ ...f, country: v as 'BR' | 'EU' })) }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BR">🇧🇷 Brasil</SelectItem>
                <SelectItem value="EU">🇪🇺 Europa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {student && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.active ? 'true' : 'false'}
                onValueChange={v => { if (v) setForm(f => ({ ...f, active: v === 'true' })) }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
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
