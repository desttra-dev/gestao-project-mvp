'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function EsqueciSenhaPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await fetch('/api/professor/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

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

        <div style={{ padding:'32px' }}>
          {sent ? (
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:'36px', margin:'0 0 12px' }}>📧</p>
              <p style={{ margin:'0 0 8px', fontSize:'16px', fontWeight:800, color:'#0d2e1e' }}>
                Email enviado!
              </p>
              <p style={{ margin:'0 0 24px', fontSize:'13px', color:'#6b8c6b', lineHeight:1.6 }}>
                Se existe uma conta com esse email, você receberá um link para redefinir sua senha. Verifique também a caixa de spam.
              </p>
              <Link href="/professor/login" style={{
                display:'block', padding:'11px', background:'#1e6b40', color:'white',
                borderRadius:'10px', fontSize:'14px', fontWeight:700, textDecoration:'none', textAlign:'center',
              }}>
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <p style={{ margin:'0 0 6px', fontSize:'16px', fontWeight:800, color:'#0d2e1e' }}>
                Esqueci minha senha
              </p>
              <p style={{ margin:'0 0 24px', fontSize:'13px', color:'#6b8c6b', lineHeight:1.6 }}>
                Informe o email do seu acesso. Se ele estiver cadastrado, enviaremos um link para redefinir a senha.
              </p>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:'20px' }}>
                  <label style={{ display:'block', fontSize:'13px', color:'#6b8c6b', fontWeight:600, marginBottom:'6px' }}>
                    Email de acesso
                  </label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="seu@email.com"
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
                <button type="submit" disabled={loading} style={{
                  width:'100%', padding:'12px', background: loading ? '#9dbfa9' : '#1e6b40',
                  color:'white', border:'none', borderRadius:'10px', fontSize:'15px',
                  fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>
              <p style={{ margin:'20px 0 0', textAlign:'center', fontSize:'13px', color:'#9dbfa9' }}>
                <Link href="/professor/login" style={{ color:'#1e6b40', textDecoration:'none', fontWeight:600 }}>
                  ← Voltar ao login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
