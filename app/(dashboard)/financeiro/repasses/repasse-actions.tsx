'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, CheckCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

export function RepasseActions({ payoutId, status }: { payoutId: string; status: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    const payload: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'pago') payload.paid_at = new Date().toISOString()
    else payload.paid_at = null

    const { error } = await supabase.from('teacher_payouts').update(payload).eq('id', payoutId)
    setLoading(false)

    if (error) { toast.error('Erro ao atualizar repasse'); return }
    toast.success('Repasse atualizado!')
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" disabled={loading} />}>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === 'pendente' ? (
          <DropdownMenuItem onClick={() => updateStatus('pago')}>
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Marcar como Pago
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => updateStatus('pendente')}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reverter para Pendente
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
