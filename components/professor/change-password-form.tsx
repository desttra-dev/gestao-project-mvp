'use client'

import { useState } from 'react'

export function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess(false)
    if (next !== confirm) { setError('As senhas não conferem'); return }
    if (next.length < 6) { setError('Nova senha deve ter pelo menos 6 caracteres'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/professor/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao alterar senha'); setLoading(false); return }
      setSuccess(true)
      setCurrent(''); setNext(''); setConfirm('')
    } catch {
      setError('Erro de conexão')
    }
    setLoading(false)
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #d4e8d4',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#0d2e1e',
    marginTop: '6px',
  }
  const labelStyle: React.CSSProperties = { fontSize: '13px', color: '#6b8c6b', fontWeight: 600 }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'white', borderRadius: '16px', padding: '24px',
      border: '1px solid #e8f0e8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {success && (
        <div style={{ background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', fontSize:'13px', color:'#166534', fontWeight:600 }}>
          ✓ Senha alterada com sucesso!
        </div>
      )}

      <div style={{ marginBottom:'14px' }}>
        <label style={labelStyle}>Senha atual</label>
        <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required style={fieldStyle} />
      </div>
      <div style={{ marginBottom:'14px' }}>
        <label style={labelStyle}>Nova senha</label>
        <input type="password" value={next} onChange={e => setNext(e.target.value)} required style={fieldStyle} />
      </div>
      <div style={{ marginBottom:'20px' }}>
        <label style={labelStyle}>Confirmar nova senha</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={fieldStyle} />
      </div>

      {error && (
        <div style={{ background:'#fee2e2', border:'1px solid #fecaca', borderRadius:'8px', padding:'10px 12px', marginBottom:'14px', fontSize:'13px', color:'#b91c1c' }}>
          {error}
        </div>
      )}

      <button
        type="submit" disabled={loading}
        style={{
          width:'100%', padding:'11px', background: loading ? '#9dbfa9' : '#1e6b40',
          color:'white', border:'none', borderRadius:'10px', fontSize:'14px',
          fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Salvando...' : 'Alterar senha'}
      </button>
    </form>
  )
}
