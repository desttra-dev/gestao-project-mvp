'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

const RL_KEY = 'admin_login_rl'
const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000

function isAdminRateLimited(): boolean {
  try {
    const raw = localStorage.getItem(RL_KEY)
    if (!raw) return false
    const { count, windowStart } = JSON.parse(raw)
    if (Date.now() - windowStart > WINDOW_MS) { localStorage.removeItem(RL_KEY); return false }
    return count >= MAX_ATTEMPTS
  } catch { return false }
}
function recordAdminAttempt() {
  try {
    const raw = localStorage.getItem(RL_KEY)
    const now = Date.now()
    if (!raw) { localStorage.setItem(RL_KEY, JSON.stringify({ count: 1, windowStart: now })); return }
    const { count, windowStart } = JSON.parse(raw)
    if (now - windowStart > WINDOW_MS) {
      localStorage.setItem(RL_KEY, JSON.stringify({ count: 1, windowStart: now }))
    } else {
      localStorage.setItem(RL_KEY, JSON.stringify({ count: count + 1, windowStart }))
    }
  } catch {}
}
function clearAdminAttempts() {
  try { localStorage.removeItem(RL_KEY) } catch {}
}

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isAdminRateLimited()) {
      setError('Muitas tentativas. Aguarde 15 minutos e tente novamente.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      recordAdminAttempt()
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    clearAdminAttempts()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
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
            <CardTitle className="text-lg">Entrar</CardTitle>
            <CardDescription>Acesse o painel de controle</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="/esqueci-senha" className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
