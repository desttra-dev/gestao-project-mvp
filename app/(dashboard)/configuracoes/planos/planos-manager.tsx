'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Plan } from '@/lib/types'

export function PlanosManager({ plans }: { plans: Plan[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    country: 'BR' as 'BR' | 'EU',
    currency: 'BRL' as 'BRL' | 'EUR',
    type: 'avulsa' as string,
    price: '',
    classes_per_month: '',
    description: '',
  })

  const handleCountryChange = (v: 'BR' | 'EU' | null) => {
    if (!v) return
    setForm(f => ({ ...f, country: v, currency: v === 'EU' ? 'EUR' : 'BRL' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name: form.name,
      country: form.country,
      currency: form.currency,
      type: form.type,
      price: parseFloat(form.price),
      classes_per_month: form.classes_per_month ? parseInt(form.classes_per_month) : null,
      description: form.description || null,
      active: true,
    }

    const { error } = await supabase.from('plans').insert(payload)
    setLoading(false)

    if (error) { toast.error('Erro ao criar plano: ' + error.message); return }
    toast.success('Plano criado!')
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Novo Plano
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Plano</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Pacote 1x/semana Brasil"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>País</Label>
              <Select value={form.country} onValueChange={handleCountryChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR">🇧🇷 Brasil</SelectItem>
                  <SelectItem value="EU">🇪🇺 Europa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => { if (v) setForm(f => ({ ...f, type: v })) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="avulsa">Avulsa</SelectItem>
                  <SelectItem value="weekly_1x">1x/semana</SelectItem>
                  <SelectItem value="weekly_2x">2x/semana</SelectItem>
                  <SelectItem value="weekly_3x">3x/semana</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor ({form.currency === 'BRL' ? 'R$' : '€'}) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Aulas/mês</Label>
              <Input
                type="number"
                min="0"
                value={form.classes_per_month}
                onChange={e => setForm(f => ({ ...f, classes_per_month: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar Plano'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
