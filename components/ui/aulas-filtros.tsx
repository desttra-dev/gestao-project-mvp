'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useTransition } from 'react'

const PERIODOS = [
  { key: 'proximas', label: 'Próximas' },
  { key: 'passadas', label: 'Passadas' },
  { key: 'tudo',     label: 'Tudo'     },
]

export function AulasFiltros() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [, startT]   = useTransition()

  const current = searchParams.get('periodo') ?? 'proximas'

  const set = (periodo: string) => {
    startT(() => {
      const p = new URLSearchParams(searchParams.toString())
      p.set('periodo', periodo)
      p.delete('page') // reset to page 1
      router.push(`?${p.toString()}`)
    })
  }

  return (
    <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: '#f5f7f5', border: '1px solid #d4e8d4' }}>
      {PERIODOS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => set(key)}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: current === key ? 'white' : 'transparent',
            color:           current === key ? '#1e6b40' : '#6b8c6b',
            boxShadow:       current === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
