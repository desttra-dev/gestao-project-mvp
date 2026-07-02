'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const periodos = [
  { label: 'Hoje',    value: '1' },
  { label: '7 dias',  value: '7' },
  { label: '15 dias', value: '15' },
  { label: '30 dias', value: '30' },
  { label: '60 dias', value: '60' },
  { label: '90 dias', value: '90' },
  { label: 'Tudo',    value: 'todos' },
]

export function LancamentosFiltros() {
  const router = useRouter()
  const params = useSearchParams()
  const atual = params.get('dias') ?? '30'

  const set = (dias: string) => {
    const p = new URLSearchParams(params.toString())
    p.set('dias', dias)
    router.push(`?${p.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-label mr-2" style={{ color: '#4a5a4a' }}>Período:</span>
      {periodos.map(p => (
        <button
          key={p.value}
          onClick={() => set(p.value)}
          className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
          style={{
            backgroundColor: atual === p.value ? '#1e6b40' : '#e8faf0',
            color: atual === p.value ? '#ffffff' : '#1e6b40',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
