'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Calculator } from 'lucide-react'
import { toast } from 'sonner'

interface GerarRepassesButtonProps {
  month: number
  year: number
}

export function GerarRepassesButton({ month, year }: GerarRepassesButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleGerar = async () => {
    setLoading(true)

    // Busca aulas realizadas no mês/ano atual
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: classes, error } = await supabase
      .from('classes')
      .select('teacher_id, level')
      .eq('status', 'realizada')
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate)

    if (error) { toast.error('Erro ao buscar aulas'); setLoading(false); return }

    // Busca taxas de repasse
    const { data: rates } = await supabase.from('teacher_rates').select('*')
    const rateMap: Record<string, number> = {}
    ;(rates ?? []).forEach(r => { rateMap[r.level] = r.rate_brl })

    // Agrupa por professor
    const grouped: Record<string, { total_classes: number; amount_brl: number }> = {}
    ;(classes ?? []).forEach(c => {
      if (!grouped[c.teacher_id]) grouped[c.teacher_id] = { total_classes: 0, amount_brl: 0 }
      grouped[c.teacher_id].total_classes += 1
      grouped[c.teacher_id].amount_brl += rateMap[c.level] ?? 0
    })

    if (Object.keys(grouped).length === 0) {
      toast.info('Nenhuma aula realizada encontrada neste mês.')
      setLoading(false)
      return
    }

    // Remove repasses existentes para este período e recria
    await supabase
      .from('teacher_payouts')
      .delete()
      .eq('period_month', month)
      .eq('period_year', year)
      .eq('status', 'pendente')

    const inserts = Object.entries(grouped).map(([teacher_id, data]) => ({
      teacher_id,
      period_month: month,
      period_year: year,
      total_classes: data.total_classes,
      amount_brl: data.amount_brl,
      status: 'pendente',
    }))

    const { error: insertError } = await supabase.from('teacher_payouts').insert(inserts)

    setLoading(false)

    if (insertError) { toast.error('Erro ao gerar repasses'); return }

    toast.success(`Repasses gerados para ${inserts.length} professor(es)!`)
    router.refresh()
  }

  return (
    <Button onClick={handleGerar} disabled={loading} variant="outline">
      <Calculator className="h-4 w-4 mr-2" />
      {loading ? 'Calculando...' : 'Gerar Repasses do Mês'}
    </Button>
  )
}
