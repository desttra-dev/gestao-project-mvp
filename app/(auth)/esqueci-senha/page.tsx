'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EsqueciSenhaAdminPage() {
  const supabase = createClient()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gestao.desttra.com'
    const { error: supaErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${baseUrl}/redefinir-senha`,
    })
    if (supaErr) {
      setError('Erro ao enviar email. Tente novamente.')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

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
            <CardTitle className="text-lg">Recuperar acesso</CardTitle>
            <CardDescription>
              {sent
                ? 'Verifique seu email'
                : 'Informe seu email para receber o link de redefinição'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-4xl">📧</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Se o email estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a caixa de spam.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full">Voltar ao login</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email" type="email" placeholder="seu@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link'}
                </Button>
                <p className="text-center text-sm text-slate-500">
                  <Link href="/login" className="text-slate-700 font-medium hover:underline">
                    ← Voltar ao login
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
