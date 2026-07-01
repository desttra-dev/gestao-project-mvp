'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { TeacherRate } from '@/lib/types'

interface TaxasManagerProps {
  rate: TeacherRate
  levelLabel: string
}

export function TaxasManager({ rate, levelLabel }: TaxasManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(rate.rate_brl))
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('teacher_rates')
      .update({ rate_brl: parseFloat(value), updated_at: new Date().toISOString() })
      .eq('id', rate.id)

    setLoading(false)
    if (error) { toast.error('Erro ao atualizar taxa'); return }
    toast.success('Taxa atualizada!')
    setEditing(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{levelLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">R$</span>
            <Input
              type="number"
              step="0.01"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-24 h-8 text-sm"
            />
            <Button size="sm" className="h-8 w-8 p-0" onClick={handleSave} disabled={loading}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setValue(String(rate.rate_brl)); setEditing(false) }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-slate-900">
              R$ {rate.rate_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-1">por aula</p>
      </CardContent>
    </Card>
  )
}
