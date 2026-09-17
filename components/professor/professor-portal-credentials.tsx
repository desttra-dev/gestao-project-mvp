'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'

interface Props {
  professorId: string
  currentPortalEmail: string
}

export function ProfessorPortalCredentials({ professorId, currentPortalEmail }: Props) {
  const [portalEmail, setPortalEmail] = useState(currentPortalEmail)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!portalEmail && !newPassword) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/professor-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professorId, portalEmail: portalEmail || undefined, newPassword: newPassword || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erro ao salvar'); return }
      toast.success('Credenciais do portal atualizadas!')
      setNewPassword('')
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" style={{ color: '#1e6b40' }} />
          Acesso ao Portal do Professor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm" style={{ color: '#6b8c6b' }}>
          O professor acessa{' '}
          <span style={{ fontWeight: 600, color: '#0d2e1e' }}>gestao.desttra.com/professor/login</span>{' '}
          com estas credenciais.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label style={{ fontSize: '13px' }}>Email do portal</Label>
            <Input
              type="email"
              value={portalEmail}
              onChange={e => setPortalEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="space-y-1">
            <Label style={{ fontSize: '13px' }}>Definir nova senha</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
            />
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading || (!portalEmail && !newPassword)}
          style={{ background: '#1e6b40', color: 'white' }}
        >
          {loading ? 'Salvando...' : 'Salvar credenciais'}
        </Button>
      </CardContent>
    </Card>
  )
}
