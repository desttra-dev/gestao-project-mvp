'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useTransition } from 'react'

const statusOpcoes = [
  { label: 'Todos',       value: 'todos' },
  { label: 'Ativo',       value: 'ativo' },
  { label: 'Suspenso',    value: 'suspenso' },
  { label: 'Cancelado',   value: 'cancelado' },
  { label: 'Experimento', value: 'experimento' },
]

const statusColors: Record<string, { ativo: string; inativo: string }> = {
  todos:       { ativo: '#1e6b40', inativo: '#1e6b40' },
  ativo:       { ativo: '#1e6b40', inativo: '#1e6b40' },
  suspenso:    { ativo: '#b45309', inativo: '#b45309' },
  cancelado:   { ativo: '#b91c1c', inativo: '#b91c1c' },
  experimento: { ativo: '#6b7280', inativo: '#6b7280' },
}

const statusBg: Record<string, string> = {
  todos:       '#e8faf0',
  ativo:       '#e8faf0',
  suspenso:    '#fef3c7',
  cancelado:   '#fee2e2',
  experimento: '#f3f4f6',
}

export function AlunosFiltros() {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const statusAtual = params.get('status') ?? 'todos'
  const q = params.get('q') ?? ''

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value === '' || value === 'todos') p.delete(key)
    else p.set(key, value)
    startTransition(() => router.push(`?${p.toString()}`))
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Busca */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9dbfa9' }} />
        <Input
          defaultValue={q}
          placeholder="Buscar aluno..."
          className="pl-9"
          onChange={e => setParam('q', e.target.value)}
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-1 flex-wrap">
        {statusOpcoes.map(s => {
          const isAtivo = statusAtual === s.value
          return (
            <button
              key={s.value}
              onClick={() => setParam('status', s.value)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                backgroundColor: isAtivo ? statusColors[s.value].ativo : '#f5f7f5',
                color: isAtivo ? '#ffffff' : statusColors[s.value].inativo,
                border: `1px solid ${isAtivo ? statusColors[s.value].ativo : '#d4e8d4'}`,
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
