'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, CheckCircle, XCircle, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface AulaActionsProps {
  aulaId: string
  status: string
}

export function AulaActions({ aulaId, status }: AulaActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('classes')
      .update({ status: newStatus })
      .eq('id', aulaId)

    setLoading(false)
    if (error) {
      toast.error('Erro ao atualizar status')
      return
    }
    toast.success('Status atualizado!')
    router.refresh()
  }

  if (status === 'cancelada') return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" disabled={loading} />}>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/aulas/${aulaId}`)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </DropdownMenuItem>
        {status !== 'realizada' && (
          <DropdownMenuItem onClick={() => updateStatus('realizada')}>
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Marcar como Realizada
          </DropdownMenuItem>
        )}
        {status !== 'cancelada' && (
          <DropdownMenuItem onClick={() => updateStatus('cancelada')} className="text-red-600">
            <XCircle className="h-4 w-4 mr-2" />
            Cancelar Aula
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
