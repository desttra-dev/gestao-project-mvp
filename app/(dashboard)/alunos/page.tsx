export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlunosFiltros } from '@/components/ui/alunos-filtros'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { countryByCode } from '@/lib/countries'
import { Suspense } from 'react'

const statusConfig: Record<string, { label: string; color: string }> = {
  ativo:       { label: 'Ativo',       color: '#1e6b40' },
  suspenso:    { label: 'Suspenso',    color: '#b45309' },
  cancelado:   { label: 'Cancelado',   color: '#b91c1c' },
  experimento: { label: 'Experimento', color: '#6b7280' },
}

const followUpLabels: Record<string, string> = {
  none: '—', next_week: 'Semana que vem',
  jan: 'Jan', fev: 'Fev', mar: 'Mar', abr: 'Abr', mai: 'Mai', jun: 'Jun',
  jul: 'Jul', ago: 'Ago', set: 'Set', out: 'Out', nov: 'Nov', dez: 'Dez',
}

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('students').select('*').order('name')

  if (status && status !== 'todos') {
    query = query.eq('status', status)
  }
  if (q && q.trim()) {
    query = query.ilike('name', `%${q.trim()}%`)
  }

  const { data: students } = await query

  // Contadores sempre sobre todos os alunos (sem filtro)
  const { data: todos } = await supabase.from('students').select('id, status, follow_up')
  const ativos   = todos?.filter(s => s.status === 'ativo').length ?? 0
  const retornos = todos?.filter(s => s.follow_up && s.follow_up !== 'none').length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Alunos</h1>
          <p className="text-body mt-1">
            <span style={{ color: '#1e6b40', fontWeight: 600 }}>{ativos} ativos</span>
            {retornos > 0 && <> · <span style={{ color: '#b45309', fontWeight: 600 }}>{retornos} com retorno agendado</span></>}
          </p>
        </div>
        <Link href="/alunos/novo">
          <Button><Plus className="h-4 w-4 mr-2" />Novo Aluno</Button>
        </Link>
      </div>

      <Suspense>
        <AlunosFiltros />
      </Suspense>

      {(q || (status && status !== 'todos')) && (
        <p className="text-sm" style={{ color: '#6b8c6b' }}>
          {students?.length ?? 0} resultado{(students?.length ?? 0) !== 1 ? 's' : ''}
          {q ? ` para "${q}"` : ''}
          {status && status !== 'todos' ? ` · status: ${statusConfig[status]?.label ?? status}` : ''}
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Retorno</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(students ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12" style={{ color: '#9dbfa9' }}>
                    Nenhum aluno encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                (students ?? []).map((s) => {
                  const st = statusConfig[s.status ?? 'ativo']
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-semibold" style={{ color: '#0d2e1e' }}>{s.name}</p>
                        <p className="text-xs" style={{ color: '#6b8c6b' }}>{s.email ?? s.phone ?? ''}</p>
                      </TableCell>
                      <TableCell style={{ color: '#4a5a4a' }}>{s.responsible_name ?? '—'}</TableCell>
                      <TableCell>
                        {(() => { const c = countryByCode[s.country ?? 'BR']; return c ? `${c.flag} ${c.name}` : s.country })()}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: st?.color ?? '#6b7280' }}>
                          {st?.label ?? s.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {s.follow_up && s.follow_up !== 'none' ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                            {followUpLabels[s.follow_up]}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Link href={`/alunos/${s.id}`}>
                          <Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
