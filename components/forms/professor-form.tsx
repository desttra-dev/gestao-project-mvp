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
import type { Professor } from '@/lib/types'

interface ProfessorFormProps {
  professor?: Professor
}

export function ProfessorForm({ professor }: ProfessorFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: professor?.name ?? '',
    email: professor?.email ?? '',
    phone: professor?.phone ?? '',
    bank_info: professor?.bank_info ?? '',
    active: professor?.active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      bank_info: form.bank_info || null,
      active: form.active,
    }

    let error
    if (professor) {
      ({ error } = await supabase.from('professors').update(payload).eq('id', professor.id))
    } else {
      ({ error } = await supabase.from('professors').insert(payload))
    }

    setLoading(false)

    if (error) {
      toast.error('Erro ao salvar professor: ' + error.message)
      return
    }

    toast.success(professor ? 'Professor atualizado!' : 'Professor cadastrado!')
    router.push('/professores')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{professor ? 'Editar Professor' : 'Novo Professor'}</CardTitle>
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
            <Label htmlFor="bank_info">Dados Bancários (PIX / Conta)</Label>
            <Textarea
              id="bank_info"
              value={form.bank_info}
              onChange={e => setForm(f => ({ ...f, bank_info: e.target.value }))}
              placeholder="Ex: PIX: 11999999999 | Banco: Nubank"
              rows={3}
            />
          </div>

          {professor && (
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
