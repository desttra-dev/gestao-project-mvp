'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CobrancaActionsProps {
  chargeId: string
  status: string
}

export function CobrancaActions({ chargeId, status }: CobrancaActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    const payload: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'pago') payload.paid_at = new Date().toISOString()

    const { error } = await supabase
      .from('charges')
      .update(payload)
      .eq('id', chargeId)

    setLoading(false)
    if (error) {
      toast.error('Erro ao atualizar cobrança')
      return
    }
    toast.success('Cobrança atualizada!')
    router.refresh()
  }

  if (status === 'cancelado') return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" disabled={loading} />}>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status !== 'pago' && (
          <DropdownMenuItem onClick={() => updateStatus('pago')}>
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Marcar como Pago
          </DropdownMenuItem>
        )}
        {status !== 'atrasado' && status !== 'pago' && (
          <DropdownMenuItem onClick={() => updateStatus('atrasado')}>
            <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
            Marcar como Atrasado
          </DropdownMenuItem>
        )}
        {status === 'pago' && (
          <DropdownMenuItem onClick={() => updateStatus('pendente')}>
            <AlertCircle className="h-4 w-4 mr-2 text-slate-500" />
            Reverter para Pendente
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => updateStatus('cancelado')} className="text-red-600">
          <XCircle className="h-4 w-4 mr-2" />
          Cancelar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
