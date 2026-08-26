'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [loading, setLoading] = useState(false)

  const marcarRealizada = async () => {
    setLoading(true)
    const res = await fetch('/api/aulas/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aulaId }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Erro ao atualizar status'); return }
    toast.success('Aula marcada como realizada!')
    router.refresh()
  }

  const cancelar = async () => {
    setLoading(true)
    const res = await fetch('/api/aulas/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aulaId }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Erro ao cancelar aula'); return }
    toast.success('Aula cancelada. Professor notificado por email.')
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
          <DropdownMenuItem onClick={marcarRealizada}>
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Marcar como Realizada
          </DropdownMenuItem>
        )}
        {status !== 'cancelada' && (
          <DropdownMenuItem onClick={cancelar} className="text-red-600">
            <XCircle className="h-4 w-4 mr-2" />
            Cancelar Aula
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
