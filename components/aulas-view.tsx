'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AulasCalendar } from '@/components/aulas-calendar'
import { AulaActions } from '@/app/(dashboard)/aulas/aula-actions'

const levelLabels: Record<string, string> = {
  fundamental: 'Fundamental', medio: 'Médio', superior: 'Superior', internacional: 'Internacional',
}
const subjectLabels: Record<string, string> = {
  matematica: 'Matemática', fisica: 'Física', quimica: 'Química', portugues: 'Português',
  historia: 'História', geografia: 'Geografia', filosofia: 'Filosofia',
  redacao: 'Redação', sociologia: 'Sociologia',
}
const statusBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  agendada: 'default', realizada: 'secondary', cancelada: 'destructive',
}

interface ClassItem {
  id: string
  scheduled_at: string
  ends_at?: string | null
  status: string
  level: string
  subject?: string | null
  notes?: string | null
  student: { name: string } | null
  professor: { name: string } | null
}

interface AulasViewProps {
  classes: ClassItem[]      // página atual (lista)
  allClasses: ClassItem[]   // todas (calendário)
  page: number
  totalPages: number
  total: number
  periodo: string
}

const PERIODOS = [
  { key: 'proximas', label: 'Próximas' },
  { key: 'passadas', label: 'Passadas' },
  { key: 'tudo',     label: 'Tudo'     },
]

export function AulasView({ classes, allClasses, page, totalPages, total, periodo }: AulasViewProps) {
  const [view, setView] = useState<'lista' | 'calendario'>('lista')
  const router = useRouter()

  const prevHref = `?periodo=${periodo}&page=${page - 1}`
  const nextHref = `?periodo=${periodo}&page=${page + 1}`

  return (
    <div className="space-y-4">
      {/* Toggle lista / calendário + filtro de período */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: '#f5f7f5', border: '1px solid #d4e8d4' }}>
          <button
            onClick={() => setView('lista')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: view === 'lista' ? 'white' : 'transparent',
              color: view === 'lista' ? '#1e6b40' : '#6b8c6b',
              boxShadow: view === 'lista' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <List className="h-4 w-4" />
            Lista
          </button>
          <button
            onClick={() => setView('calendario')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: view === 'calendario' ? 'white' : 'transparent',
              color: view === 'calendario' ? '#1e6b40' : '#6b8c6b',
              boxShadow: view === 'calendario' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <CalendarDays className="h-4 w-4" />
            Calendário
          </button>
        </div>

        {view === 'lista' && (
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: '#f5f7f5', border: '1px solid #d4e8d4' }}>
            {PERIODOS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => router.push(`?periodo=${key}&page=1`)}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{
                  backgroundColor: periodo === key ? 'white' : 'transparent',
                  color:           periodo === key ? '#1e6b40' : '#6b8c6b',
                  boxShadow:       periodo === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === 'calendario' ? (
        <AulasCalendar classes={allClasses} />
      ) : (
        <>
          {/* Info + paginação topo */}
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: '#6b8c6b' }}>
              {PERIODOS.find(p => p.key === periodo)?.label ?? periodo} · {total} aula{total !== 1 ? 's' : ''}
              {totalPages > 1 && ` · página ${page} de ${totalPages}`}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {page > 1 ? (
                  <Link href={prevHref}>
                    <Button variant="ghost" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="ghost" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <span className="text-sm px-2" style={{ color: '#4a5a4a' }}>
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Link href={nextHref}>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="ghost" size="sm" disabled>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Matéria</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12" style={{ color: '#9dbfa9' }}>
                        Nenhuma aula neste período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    classes.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium whitespace-nowrap" style={{ color: '#0d2e1e' }}>
                          {format(new Date(c.scheduled_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          {c.ends_at && (
                            <span className="text-xs ml-1" style={{ color: '#6b8c6b' }}>
                              – {format(new Date(c.ends_at), 'HH:mm')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell style={{ color: '#0d2e1e' }}>{c.student?.name ?? '—'}</TableCell>
                        <TableCell style={{ color: '#6b8c6b' }}>{c.professor?.name ?? '—'}</TableCell>
                        <TableCell style={{ color: '#4a5a4a' }}>
                          {c.subject ? subjectLabels[c.subject] ?? c.subject : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{levelLabels[c.level] ?? c.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge[c.status] ?? 'outline'}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AulaActions aulaId={c.id} status={c.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Paginação rodapé */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {page > 1 ? (
                <Link href={prevHref}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
              )}

              <span className="text-sm" style={{ color: '#6b8c6b' }}>
                Página {page} de {totalPages}
              </span>

              {page < totalPages ? (
                <Link href={nextHref}>
                  <Button variant="outline" size="sm">
                    Próxima <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Próxima <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
