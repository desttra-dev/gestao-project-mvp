export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AulaActions } from './aula-actions'

const levelLabels: Record<string, string> = {
  fundamental: 'Fundamental',
  medio: 'Médio',
  superior: 'Superior',
  internacional: 'Internacional',
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  agendada: 'default',
  realizada: 'secondary',
  cancelada: 'destructive',
}

export default async function AulasPage() {
  const supabase = await createClient()
  const { data: classes } = await supabase
    .from('classes')
    .select('*, student:students(name), professor:professors(name)')
    .order('scheduled_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aulas</h1>
          <p className="text-sm text-slate-500 mt-1">{classes?.length ?? 0} registradas</p>
        </div>
        <Link href="/aulas/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Aula
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data / Hora</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(classes ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                    Nenhuma aula registrada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                (classes ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(c.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{(c.student as any)?.name ?? '—'}</TableCell>
                    <TableCell className="text-slate-500">{(c.professor as any)?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{levelLabels[c.level] ?? c.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[c.status] ?? 'outline'}>
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
    </div>
  )
}
