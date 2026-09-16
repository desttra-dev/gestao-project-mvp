'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Search, Pencil, GraduationCap, Mail, Phone, CreditCard } from 'lucide-react'

interface Professor {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  bank_info?: string | null
  active?: boolean
}

export function ProfessoresView({ professors }: { professors: Professor[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return professors
    return professors.filter(p => p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q))
  }, [professors, search])

  const ativos   = professors.filter(p => p.active !== false).length
  const inativos = professors.filter(p => p.active === false).length

  return (
    <div className="space-y-5">
      {/* Stats */}
      <p className="text-sm" style={{ color: '#6b8c6b' }}>
        <span style={{ color: '#1e6b40', fontWeight: 600 }}>{ativos} ativo{ativos !== 1 ? 's' : ''}</span>
        {inativos > 0 && <> · <span style={{ color: '#b45309', fontWeight: 600 }}>{inativos} inativo{inativos !== 1 ? 's' : ''}</span></>}
      </p>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9dbfa9' }} />
        <Input
          placeholder="Buscar professor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: '#9dbfa9' }}>
          Nenhum professor encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#e8faf0' }}>
                      <GraduationCap className="h-5 w-5" style={{ color: '#1e6b40' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight" style={{ color: '#0d2e1e' }}>{p.name}</p>
                      <span
                        className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: p.active !== false ? '#e8faf0' : '#f3f4f6',
                          color:           p.active !== false ? '#1e6b40' : '#6b7280',
                        }}
                      >
                        {p.active !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  <Link href={`/professores/${p.id}`}>
                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="space-y-1.5">
                  {p.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#9dbfa9' }} />
                      <p className="text-xs truncate" style={{ color: '#4a5a4a' }}>{p.email}</p>
                    </div>
                  )}
                  {p.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#9dbfa9' }} />
                      <p className="text-xs" style={{ color: '#4a5a4a' }}>{p.phone}</p>
                    </div>
                  )}
                  {p.bank_info && (
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: '#9dbfa9' }} />
                      <p className="text-xs line-clamp-2" style={{ color: '#4a5a4a' }}>{p.bank_info}</p>
                    </div>
                  )}
                  {!p.email && !p.phone && !p.bank_info && (
                    <p className="text-xs" style={{ color: '#9dbfa9' }}>Sem informações de contato</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
