'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ResetForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') ?? ''

  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  useEffect(() => {
    if (!token) setError('Link inválido. Solicite um novo.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('As senhas não conferem'); return }
    if (password.length < 6)  { setError('Senha deve ter pelo menos 6 caracteres'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/professor/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao redefinir senha'); return }
      setSuccess(true)
      setTimeout(() => router.push('/professor/login'), 3000)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding:'32px' }}>
      {success ? (
        <div style={{ textAlign:'center' }}>
          <p style={{ fontSize:'36px', margin:'0 0 12px' }}>✅</p>
          <p style={{ margin:'0 0 8px', fontSize:'16px', fontWeight:800, color:'#0d2e1e' }}>Senha redefinida!</p>
          <p style={{ margin:0, fontSize:'13px', color:'#6b8c6b' }}>
            Redirecionando para o login...
          </p>
        </div>
      ) : (
        <>
          <p style={{ margin:'0 0 6px', fontSize:'16px', fontWeight:800, color:'#0d2e1e' }}>Nova senha</p>
          <p style={{ margin:'0 0 24px', fontSize:'13px', color:'#6b8c6b', lineHeight:1.6 }}>
            Escolha uma senha com pelo menos 6 caracteres.
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'13px', color:'#6b8c6b', fontWeight:600, marginBottom:'6px' }}>
                Nova senha
              </label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)} required
                  style={{
                    width:'100%', padding:'10px 40px 10px 12px', border:'1.5px solid #d4e8d4',
                    borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#0d2e1e',
                  }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'#9dbfa9', fontSize:'16px',
                }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'13px', color:'#6b8c6b', fontWeight:600, marginBottom:'6px' }}>
                Confirmar nova senha
              </label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                style={{
                  width:'100%', padding:'10px 12px', border:'1.5px solid #d4e8d4',
                  borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box', color:'#0d2e1e',
                }}
              />
            </div>
            {error && (
              <div style={{ background:'#fee2e2', border:'1px solid #fecaca', borderRadius:'8px', padding:'10px 12px', marginBottom:'14px', fontSize:'13px', color:'#b91c1c' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading || !token} style={{
              width:'100%', padding:'12px', background: (loading || !token) ? '#9dbfa9' : '#1e6b40',
              color:'white', border:'none', borderRadius:'10px', fontSize:'15px',
              fontWeight:700, cursor: (loading || !token) ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
          {!token && (
            <p style={{ margin:'16px 0 0', textAlign:'center', fontSize:'13px' }}>
              <Link href="/professor/esqueci-senha" style={{ color:'#1e6b40', fontWeight:600, textDecoration:'none' }}>
                Solicitar novo link
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <div style={{
      minHeight:'100vh', background:'linear-gradient(135deg,#0d2e1e,#1e6b40)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'16px',
    }}>
      <div style={{
        width:'100%', maxWidth:'380px', background:'white',
        borderRadius:'20px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ background:'linear-gradient(135deg,#1e6b40,#2da862)', padding:'28px', textAlign:'center' }}>
          <p style={{ margin:0, color:'white', fontSize:'20px', fontWeight:800 }}>Desttra Educação</p>
          <p style={{ margin:'6px 0 0', color:'#a7d4b8', fontSize:'13px' }}>Portal do Professor</p>
        </div>
        <Suspense fallback={<div style={{ padding:'32px', textAlign:'center', color:'#9dbfa9' }}>Carregando...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
