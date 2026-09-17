'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetForm() {
  const supabase = createClient()
  const router   = useRouter()

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [ready, setReady]         = useState(false)

  useEffect(() => {
    // Supabase envia o recovery token no hash fragment
    // O cliente SSR processa automaticamente ao detectar type=recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('As senhas não conferem'); return }
    if (password.length < 6)  { setError('Senha deve ter pelo menos 6 caracteres'); return }
    setLoading(true)
    const { error: supaErr } = await supabase.auth.updateUser({ password })
    if (supaErr) {
      setError(supaErr.message ?? 'Erro ao redefinir senha')
      setLoading(false)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/'), 3000)
  }

  return (
    <CardContent>
      {success ? (
        <div className="space-y-4 text-center">
          <p className="text-4xl">✅</p>
          <p className="text-slate-700 font-semibold">Senha redefinida com sucesso!</p>
          <p className="text-sm text-slate-500">Redirecionando para o painel...</p>
        </div>
      ) : !ready ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-500 leading-relaxed">
            Aguardando validação do link... Se nada acontecer em alguns segundos, o link pode ter expirado.
          </p>
          <Link href="/esqueci-senha">
            <Button variant="outline" className="w-full">Solicitar novo link</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative">
              <Input
                id="password" type={showPw ? 'text' : 'password'}
                placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required className="pr-10"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar nova senha</Label>
            <Input
              id="confirm" type="password" placeholder="••••••••"
              value={confirm} onChange={e => setConfirm(e.target.value)} required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      )}
    </CardContent>
  )
}

export default function RedefinirSenhaAdminPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-900 text-white p-3 rounded-xl mb-4">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Desttra Educação</h1>
          <p className="text-sm text-slate-500 mt-1">Sistema de Gestão</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Redefinir senha</CardTitle>
            <CardDescription>Escolha uma nova senha para sua conta</CardDescription>
          </CardHeader>
          <Suspense fallback={<CardContent><p className="text-sm text-slate-400 text-center">Carregando...</p></CardContent>}>
            <ResetForm />
          </Suspense>
        </Card>
      </div>
    </div>
  )
}
