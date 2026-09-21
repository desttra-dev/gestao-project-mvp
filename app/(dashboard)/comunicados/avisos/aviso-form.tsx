'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface AvisoFormProps {
  aviso?: { id: string; title: string; body: string; pinned: boolean }
  onClose: () => void
}

export function AvisoForm({ aviso, onClose }: AvisoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [title,  setTitle]  = useState(aviso?.title  ?? '')
  const [body,   setBody]   = useState(aviso?.body   ?? '')
  const [pinned, setPinned] = useState(aviso?.pinned ?? false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Preencha o título e o texto do aviso.')
      return
    }
    setLoading(true)
    const payload = { title: title.trim(), body: body.trim(), pinned, updated_at: new Date().toISOString() }

    const { error } = aviso
      ? await supabase.from('announcements').update(payload).eq('id', aviso.id)
      : await supabase.from('announcements').insert({ ...payload, active: true })

    setLoading(false)
    if (error) { toast.error('Erro ao salvar aviso'); return }
    toast.success(aviso ? 'Aviso atualizado!' : 'Aviso criado!')
    router.refresh()
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0d2e1e' }}>
            {aviso ? 'Editar aviso' : 'Novo aviso'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b8c6b', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b8c6b', marginBottom: '6px' }}>
              Título
            </label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Aulas no feriado de 07/09"
              maxLength={100}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b8c6b', marginBottom: '6px' }}>
              Texto do aviso
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Escreva a mensagem que os professores vão ver..."
              rows={5}
              maxLength={1000}
              style={{
                width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0',
                padding: '10px 12px', fontSize: '14px', resize: 'vertical',
                fontFamily: 'inherit', color: '#0d2e1e', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9dbfa9', textAlign: 'right' }}>
              {body.length}/1000
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '24px' }}>
            <input
              type="checkbox"
              checked={pinned}
              onChange={e => setPinned(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#1e6b40' }}
            />
            <span style={{ fontSize: '13px', color: '#0d2e1e' }}>
              📌 Fixar este aviso no topo do portal
            </span>
          </label>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : aviso ? 'Salvar alterações' : 'Criar aviso'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
