'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfessorLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/professor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      let data: { error?: string } = {}
      try { data = await res.json() } catch { /* resposta não era JSON */ }
      if (!res.ok) { setError(data.error ?? `Erro ${res.status}`); setLoading(false); return }
      router.push('/professor')
      router.refresh()
    } catch {
      setError('Sem conexão com o servidor. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg,#0d2e1e,#1e6b40)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: '380px', background: 'white',
        borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ background: 'linear-gradient(135deg,#1e6b40,#2da862)', padding: '32px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'white', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Desttra Educação
          </p>
          <p style={{ margin: '6px 0 0', color: '#a7d4b8', fontSize: '13px' }}>Portal do Professor</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b8c6b', marginBottom: '6px', fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="seu@email.com"
              style={{
                width: '100%', padding: '10px 12px', border: '1.5px solid #d4e8d4',
                borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                color: '#0d2e1e',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', color: '#6b8c6b', fontWeight: 600 }}>Senha</label>
              <Link href="/professor/esqueci-senha" style={{ fontSize: '12px', color: '#1e6b40', textDecoration: 'none', fontWeight: 600 }}>
                Esqueci minha senha
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '10px 40px 10px 12px', border: '1.5px solid #d4e8d4',
                  borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  color: '#0d2e1e',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                  color: '#9dbfa9', fontSize: '16px', lineHeight: 1,
                }}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '10px 12px', marginBottom: '16px', fontSize: '13px', color: '#b91c1c',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? '#9dbfa9' : '#1e6b40',
              color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px',
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
