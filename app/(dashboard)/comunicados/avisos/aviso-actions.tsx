'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { AvisoForm } from './aviso-form'

interface AvisoActionsProps {
  aviso: { id: string; title: string; body: string; active: boolean; pinned: boolean }
}

export function AvisoActions({ aviso }: AvisoActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading]   = useState(false)
  const [editing, setEditing]   = useState(false)
  const [confirming, setConfirming] = useState(false)

  const toggleActive = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('announcements')
      .update({ active: !aviso.active, updated_at: new Date().toISOString() })
      .eq('id', aviso.id)
    setLoading(false)
    if (error) { toast.error('Erro ao atualizar aviso'); return }
    toast.success(aviso.active ? 'Aviso desativado' : 'Aviso ativado')
    router.refresh()
  }

  const handleDelete = async () => {
    setLoading(true)
    const { error } = await supabase.from('announcements').delete().eq('id', aviso.id)
    setLoading(false)
    if (error) { toast.error('Erro ao excluir aviso'); return }
    toast.success('Aviso excluído')
    router.refresh()
  }

  return (
    <>
      {editing && (
        <AvisoForm aviso={aviso} onClose={() => setEditing(false)} />
      )}

      {confirming && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '14px', padding: '28px 24px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#0d2e1e' }}>Excluir aviso?</p>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b8c6b' }}>"{aviso.title}"<br/>Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button variant="outline" onClick={() => setConfirming(false)}>Cancelar</Button>
              <Button onClick={() => { setConfirming(false); handleDelete() }} style={{ background: '#dc2626', color: 'white' }}>
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" disabled={loading} />}>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleActive}>
            {aviso.active
              ? <><EyeOff className="h-4 w-4 mr-2" />Desativar</>
              : <><Eye    className="h-4 w-4 mr-2" />Ativar</>
            }
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setConfirming(true)} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
