'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const REASONS = [
  { value: 'aluno_faltou',         label: 'O aluno faltou' },
  { value: 'professor_faltou',     label: 'O professor faltou' },
  { value: 'nao_devia_existir',    label: 'Aula não devia existir' },
  { value: 'outros',               label: 'Outros' },
]

const REASON_LABELS: Record<string, string> = {
  aluno_faltou: 'Aluno faltou', professor_faltou: 'Professor faltou',
  nao_devia_existir: 'Aula não devia existir', outros: 'Outro motivo',
}

interface Props {
  classId: string
  endsAt: string | null
  scheduledAt: string
  confirmationStatus: string | null
  noShowReason: string | null
  noShowNotes: string | null
}

export function ClassConfirmation({ classId, endsAt, scheduledAt, confirmationStatus, noShowReason, noShowNotes }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'no_show_form'>('idle')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const endTime = endsAt
    ? new Date(endsAt)
    : new Date(new Date(scheduledAt).getTime() + 60 * 60 * 1000)
  const hasEnded = endTime <= new Date()

  async function confirm(status: 'realizada' | 'nao_houve', r?: string, n?: string) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/professor/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, status, reason: r, notes: n }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Erro ao confirmar')
        setLoading(false)
        return
      }
      router.refresh()
    } catch {
      setError('Erro de conexão')
      setLoading(false)
    }
  }

  // ── Already confirmed ──────────────────────────────────────────────────────
  if (confirmationStatus === 'realizada') {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'10px' }}>
        <span style={{
          background:'#dcfce7', color:'#166534', borderRadius:'20px',
          padding:'4px 12px', fontSize:'12px', fontWeight:700,
        }}>✓ Aula confirmada</span>
      </div>
    )
  }

  if (confirmationStatus === 'nao_houve') {
    const label = noShowReason ? REASON_LABELS[noShowReason] ?? noShowReason : 'Não houve'
    return (
      <div style={{ marginTop:'10px' }}>
        <span style={{
          background:'#fee2e2', color:'#991b1b', borderRadius:'20px',
          padding:'4px 12px', fontSize:'12px', fontWeight:700,
        }}>✗ {label}</span>
        {noShowNotes && (
          <p style={{ margin:'4px 0 0', fontSize:'12px', color:'#6b8c6b', fontStyle:'italic' }}>
            {noShowNotes}
          </p>
        )}
      </div>
    )
  }

  // ── Not ended yet ──────────────────────────────────────────────────────────
  if (!hasEnded) {
    return (
      <p style={{ margin:'10px 0 0', fontSize:'12px', color:'#9dbfa9' }}>
        Confirmação disponível após o término da aula
      </p>
    )
  }

  // ── Awaiting confirmation ──────────────────────────────────────────────────
  if (mode === 'idle') {
    return (
      <div style={{ marginTop:'10px', display:'flex', gap:'8px', flexWrap:'wrap' }}>
        <button
          onClick={() => confirm('realizada')}
          disabled={loading}
          style={{
            padding:'7px 16px', background:'#1e6b40', color:'white', border:'none',
            borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer',
          }}
        >
          ✓ Confirmar aula
        </button>
        <button
          onClick={() => setMode('no_show_form')}
          disabled={loading}
          style={{
            padding:'7px 16px', background:'white', color:'#b91c1c',
            border:'1.5px solid #fecaca', borderRadius:'8px', fontSize:'13px',
            fontWeight:700, cursor:'pointer',
          }}
        >
          ✗ Não houve a aula
        </button>
        {error && <p style={{ width:'100%', margin:0, fontSize:'12px', color:'#b91c1c' }}>{error}</p>}
      </div>
    )
  }

  // ── No-show form ───────────────────────────────────────────────────────────
  return (
    <div style={{
      marginTop:'12px', background:'#fff8f8', border:'1.5px solid #fecaca',
      borderRadius:'12px', padding:'16px',
    }}>
      <p style={{ margin:'0 0 12px', fontSize:'13px', fontWeight:700, color:'#0d2e1e' }}>
        O que aconteceu com a aula?
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'12px' }}>
        {REASONS.map(r => (
          <label key={r.value} style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}>
            <input
              type="radio" name={`reason-${classId}`} value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
              style={{ accentColor:'#b91c1c' }}
            />
            <span style={{ fontSize:'13px', color:'#0d2e1e' }}>{r.label}</span>
          </label>
        ))}
      </div>

      {reason === 'outros' && (
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Descreva o que aconteceu..."
          rows={3}
          style={{
            width:'100%', padding:'8px 10px', border:'1.5px solid #fecaca', borderRadius:'8px',
            fontSize:'13px', resize:'vertical', boxSizing:'border-box', marginBottom:'12px',
            color:'#0d2e1e', outline:'none',
          }}
        />
      )}

      {error && <p style={{ margin:'0 0 8px', fontSize:'12px', color:'#b91c1c' }}>{error}</p>}

      <div style={{ display:'flex', gap:'8px' }}>
        <button
          onClick={() => { setMode('idle'); setReason(''); setNotes(''); setError('') }}
          disabled={loading}
          style={{
            padding:'7px 14px', background:'white', color:'#6b8c6b',
            border:'1.5px solid #d4e8d4', borderRadius:'8px', fontSize:'13px', cursor:'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={() => reason && confirm('nao_houve', reason, notes || undefined)}
          disabled={loading || !reason}
          style={{
            padding:'7px 16px',
            background: reason && !loading ? '#b91c1c' : '#fca5a5',
            color:'white', border:'none', borderRadius:'8px', fontSize:'13px',
            fontWeight:700, cursor: reason && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Salvando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}
