'use client'

import { useState } from 'react'

interface Props {
  initialEmail: string
  initialPhone: string
}

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #d4e8d4',
  borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  color: '#0d2e1e', marginTop: '6px',
}
const labelStyle: React.CSSProperties = { fontSize: '13px', color: '#6b8c6b', fontWeight: 600 }
const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '16px', padding: '24px',
  border: '1px solid #e8f0e8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '16px',
}
const btnStyle = (loading: boolean): React.CSSProperties => ({
  width: '100%', padding: '11px', background: loading ? '#9dbfa9' : '#1e6b40',
  color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px',
  fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px',
})

export function SettingsForm({ initialEmail, initialPhone }: Props) {
  // ── Profile section
  const [email, setEmail]   = useState(initialEmail)
  const [phone, setPhone]   = useState(initialPhone)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError]     = useState('')
  const [profileOk, setProfileOk]           = useState(false)

  // ── Password section
  const [current, setCurrent]   = useState('')
  const [next, setNext]         = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext]       = useState(false)
  const [pwLoading, setPwLoading]     = useState(false)
  const [pwError, setPwError]         = useState('')
  const [pwOk, setPwOk]               = useState(false)

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(''); setProfileOk(false)
    setProfileLoading(true)
    try {
      const res = await fetch('/api/professor/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalEmail: email, phone }),
      })
      const data = await res.json()
      if (!res.ok) { setProfileError(data.error ?? 'Erro ao salvar'); return }
      setProfileOk(true)
    } catch {
      setProfileError('Erro de conexão')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(''); setPwOk(false)
    if (next !== confirm) { setPwError('As senhas não conferem'); return }
    if (next.length < 6)  { setPwError('Nova senha deve ter pelo menos 6 caracteres'); return }
    setPwLoading(true)
    try {
      const res = await fetch('/api/professor/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json()
      if (!res.ok) { setPwError(data.error ?? 'Erro ao alterar senha'); return }
      setPwOk(true)
      setCurrent(''); setNext(''); setConfirm('')
    } catch {
      setPwError('Erro de conexão')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <>
      {/* Profile card */}
      <div style={cardStyle}>
        <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#0d2e1e' }}>
          Dados de acesso
        </p>
        {profileOk && (
          <div style={{ background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'13px', color:'#166534', fontWeight:600 }}>
            ✓ Dados atualizados com sucesso!
          </div>
        )}
        <form onSubmit={handleProfile}>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Email de login</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="seu@email.com" style={fieldStyle}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Telefone / WhatsApp</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="(11) 99999-9999" style={fieldStyle}
            />
          </div>
          {profileError && (
            <div style={{ background:'#fee2e2', border:'1px solid #fecaca', borderRadius:'8px', padding:'10px 12px', marginBottom:'14px', fontSize:'13px', color:'#b91c1c' }}>
              {profileError}
            </div>
          )}
          <button type="submit" disabled={profileLoading} style={btnStyle(profileLoading)}>
            {profileLoading ? 'Salvando...' : 'Salvar dados'}
          </button>
        </form>
      </div>

      {/* Password card */}
      <div style={cardStyle}>
        <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#0d2e1e' }}>
          Alterar senha
        </p>
        {pwOk && (
          <div style={{ background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'13px', color:'#166534', fontWeight:600 }}>
            ✓ Senha alterada com sucesso!
          </div>
        )}
        <form onSubmit={handlePassword}>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Senha atual</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={current} onChange={e => setCurrent(e.target.value)}
                required style={{ ...fieldStyle, paddingRight: '40px' }}
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)} style={{
                position:'absolute', right:'10px', top:'50%', transform:'translateY(-25%)',
                background:'none', border:'none', cursor:'pointer', color:'#9dbfa9', fontSize:'16px',
              }}>{showCurrent ? '🙈' : '👁'}</button>
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Nova senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNext ? 'text' : 'password'}
                value={next} onChange={e => setNext(e.target.value)}
                required style={{ ...fieldStyle, paddingRight: '40px' }}
              />
              <button type="button" onClick={() => setShowNext(v => !v)} style={{
                position:'absolute', right:'10px', top:'50%', transform:'translateY(-25%)',
                background:'none', border:'none', cursor:'pointer', color:'#9dbfa9', fontSize:'16px',
              }}>{showNext ? '🙈' : '👁'}</button>
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Confirmar nova senha</label>
            <input
              type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              required style={fieldStyle}
            />
          </div>
          {pwError && (
            <div style={{ background:'#fee2e2', border:'1px solid #fecaca', borderRadius:'8px', padding:'10px 12px', marginBottom:'14px', fontSize:'13px', color:'#b91c1c' }}>
              {pwError}
            </div>
          )}
          <button type="submit" disabled={pwLoading} style={btnStyle(pwLoading)}>
            {pwLoading ? 'Salvando...' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </>
  )
}
