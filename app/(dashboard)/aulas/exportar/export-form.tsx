'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Loader2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const STATUS_OPTIONS = [
  { value: 'agendada',  label: 'Agendada' },
  { value: 'realizada', label: 'Realizada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'remarcada', label: 'Remarcada' },
]

interface Prof { id: string; name: string }

export function ExportForm({ professors }: { professors: Prof[] }) {
  const today = new Date()
  const [de,          setDe]          = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [ate,         setAte]         = useState(format(endOfMonth(today),   'yyyy-MM-dd'))
  const [professorId, setProfessorId] = useState('')
  const [aluno,       setAluno]       = useState('')
  const [statuses,    setStatuses]    = useState<string[]>(['realizada', 'agendada'])
  const [loading,     setLoading]     = useState(false)

  const toggleStatus = (v: string) =>
    setStatuses(prev => prev.includes(v) ? prev.filter(s => s !== v) : [...prev, v])

  const handleExport = async () => {
    if (!de || !ate) return
    setLoading(true)

    const params = new URLSearchParams()
    params.set('de',  de)
    params.set('ate', ate)
    if (professorId) params.set('professor_id', professorId)
    if (aluno.trim()) params.set('aluno', aluno.trim())
    if (statuses.length > 0) params.set('status', statuses.join(','))

    try {
      const res = await fetch(`/api/aulas/export?${params}`)
      if (!res.ok) { alert('Erro ao gerar exportação.'); return }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `aulas_${de}_${ate}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  const label = (text: string) => (
    <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{text}</p>
  )

  return (
    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '28px' }}>

      {/* Período */}
      <div style={{ marginBottom: '24px' }}>
        {label('Período')}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8' }}>De</p>
            <Input type="date" value={de}  onChange={e => setDe(e.target.value)}  />
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8' }}>Até</p>
            <Input type="date" value={ate} onChange={e => setAte(e.target.value)} />
          </div>
        </div>
        {/* Atalhos de período */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
          {[
            { label: 'Este mês',    de: format(startOfMonth(today), 'yyyy-MM-dd'), ate: format(endOfMonth(today), 'yyyy-MM-dd') },
            { label: 'Mês passado', de: format(startOfMonth(new Date(today.getFullYear(), today.getMonth()-1)), 'yyyy-MM-dd'), ate: format(endOfMonth(new Date(today.getFullYear(), today.getMonth()-1)), 'yyyy-MM-dd') },
            { label: 'Este ano',    de: `${today.getFullYear()}-01-01`, ate: `${today.getFullYear()}-12-31` },
          ].map(op => (
            <button
              key={op.label}
              onClick={() => { setDe(op.de); setAte(op.ate) }}
              style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                border: '1px solid #e2e8f0', background: de === op.de && ate === op.ate ? '#1e6b40' : 'white',
                color:  de === op.de && ate === op.ate ? 'white' : '#475569',
                fontWeight: 500,
              }}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div style={{ marginBottom: '24px' }}>
        {label('Status da aula')}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(opt => {
            const active = statuses.includes(opt.value)
            const colors: Record<string, { bg: string; border: string; color: string }> = {
              agendada:  { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
              realizada: { bg: '#dcfce7', border: '#86efac', color: '#166534' },
              cancelada: { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b' },
              remarcada: { bg: '#fef3c7', border: '#fcd34d', color: '#92400e' },
            }
            const c = colors[opt.value]
            return (
              <button
                key={opt.value}
                onClick={() => toggleStatus(opt.value)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                  border: `1.5px solid ${active ? c.border : '#e2e8f0'}`,
                  background: active ? c.bg : 'white',
                  color: active ? c.color : '#94a3b8',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
        {statuses.length === 0 && (
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#f59e0b' }}>
            ⚠️ Nenhum status selecionado — serão exportadas todas as aulas independente do status.
          </p>
        )}
      </div>

      {/* Professor */}
      <div style={{ marginBottom: '24px' }}>
        {label('Professor')}
        <select
          value={professorId}
          onChange={e => setProfessorId(e.target.value)}
          style={{
            width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
            padding: '9px 12px', fontSize: '14px', color: '#0d2e1e',
            background: 'white', outline: 'none',
          }}
        >
          <option value="">Todos os professores</option>
          {professors.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Aluno */}
      <div style={{ marginBottom: '32px' }}>
        {label('Aluno (busca por nome)')}
        <Input
          placeholder="Ex: João Silva"
          value={aluno}
          onChange={e => setAluno(e.target.value)}
        />
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
          Deixe em branco para incluir todos os alunos.
        </p>
      </div>

      {/* Resumo + botão */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: '#0d2e1e' }}>
            Pronto para exportar
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            Período: {de} a {ate}
            {professorId && professors.find(p => p.id === professorId) && (
              <> · {professors.find(p => p.id === professorId)?.name}</>
            )}
            {aluno && <> · Aluno: "{aluno}"</>}
          </p>
        </div>
        <Button onClick={handleExport} disabled={loading || !de || !ate}>
          {loading
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</>
            : <><Download className="h-4 w-4 mr-2" />Baixar CSV</>
          }
        </Button>
      </div>
    </div>
  )
}
