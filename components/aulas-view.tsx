'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, List } from 'lucide-react'
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
  status: string
  level: string
  subject?: string | null
  notes?: string | null
  student: { name: string } | null
  professor: { name: string } | null
}

export function AulasView({ classes }: { classes: ClassItem[] }) {
  const [view, setView] = useState<'lista' | 'calendario'>('lista')

  return (
    <div className="space-y-4">
      {/* Toggle */}
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

      {view === 'calendario' ? (
        <AulasCalendar classes={classes} />
      ) : (
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
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12" style={{ color: '#9dbfa9' }}>
                      Nenhuma aula registrada ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium whitespace-nowrap" style={{ color: '#0d2e1e' }}>
                        {format(new Date(c.scheduled_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
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
      )}
    </div>
  )
}
