'use client'

import { useState, useMemo } from 'react'
import type { ElementType } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, ChevronDown, ChevronUp, Users, UserCheck, UserX, UserMinus } from 'lucide-react'

interface Student {
  id: string
  name: string
  status: string | null
  email?: string | null
  phone?: string | null
  responsible_name?: string | null
}

type StatusKey = 'ativo' | 'suspenso' | 'cancelado'

const STATUS_CONFIG: Record<StatusKey, {
  label: string
  icon: ElementType
  bg: string
  border: string
  color: string
  countColor: string
}> = {
  ativo: {
    label: 'Ativos',
    icon: UserCheck,
    bg: '#e8faf0',
    border: '#bbf7d0',
    color: '#1e6b40',
    countColor: '#0d2e1e',
  },
  suspenso: {
    label: 'Suspensos',
    icon: UserMinus,
    bg: '#fef3c7',
    border: '#fde68a',
    color: '#b45309',
    countColor: '#7c2d12',
  },
  cancelado: {
    label: 'Cancelados',
    icon: UserX,
    bg: '#fee2e2',
    border: '#fecaca',
    color: '#b91c1c',
    countColor: '#7f1d1d',
  },
}

export function AlunosCards({ students }: { students: Student[] }) {
  const router = useRouter()
  const [activeCard, setActiveCard] = useState<StatusKey | null>(null)
  const [search, setSearch] = useState('')

  const counts: Record<StatusKey, number> = useMemo(() => ({
    ativo:     students.filter(s => s.status === 'ativo').length,
    suspenso:  students.filter(s => s.status === 'suspenso').length,
    cancelado: students.filter(s => s.status === 'cancelado').length,
  }), [students])

  const filteredList = useMemo(() => {
    if (!activeCard) return []
    const q = search.toLowerCase().trim()
    return students
      .filter(s => s.status === activeCard)
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.responsible_name?.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
  }, [students, activeCard, search])

  const handleCardClick = (key: StatusKey) => {
    setActiveCard(prev => prev === key ? null : key)
    setSearch('')
  }

  return (
    <div className="space-y-5">
      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(STATUS_CONFIG) as [StatusKey, typeof STATUS_CONFIG[StatusKey]][]).map(([key, cfg]) => {
          const Icon = cfg.icon
          const isOpen = activeCard === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleCardClick(key)}
              className="text-left transition-all"
            >
              <Card
                style={{
                  border: `2px solid ${isOpen ? cfg.color : cfg.border}`,
                  backgroundColor: isOpen ? cfg.bg : 'white',
                  transition: 'all 0.15s',
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <Icon className="h-5 w-5" style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: cfg.color }}>{cfg.label}</p>
                        <p className="text-3xl font-bold leading-none mt-0.5" style={{ color: cfg.countColor }}>
                          {counts[key]}
                        </p>
                      </div>
                    </div>
                    <div style={{ color: cfg.color }}>
                      {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      {/* Expanded list */}
      {activeCard && (
        <Card style={{ border: `1px solid ${STATUS_CONFIG[activeCard].border}` }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4 gap-3">
              <p className="font-semibold text-sm" style={{ color: STATUS_CONFIG[activeCard].color }}>
                {STATUS_CONFIG[activeCard].label} ({counts[activeCard]})
              </p>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: '#9dbfa9' }} />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>

            {filteredList.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#9dbfa9' }}>
                {search ? 'Nenhum resultado.' : 'Nenhum aluno nesta categoria.'}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredList.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => router.push(`/alunos/${s.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-gray-50"
                    style={{ border: '1px solid transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#e4f0e4')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: STATUS_CONFIG[activeCard].bg }}>
                        <Users className="h-3.5 w-3.5" style={{ color: STATUS_CONFIG[activeCard].color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#0d2e1e' }}>{s.name}</p>
                        {s.responsible_name && (
                          <p className="text-xs" style={{ color: '#9dbfa9' }}>{s.responsible_name}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: STATUS_CONFIG[activeCard].color }}>Ver →</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
