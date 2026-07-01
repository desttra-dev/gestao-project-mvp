export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'

export default async function AlunosPage() {
  const supabase = await createClient()
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alunos</h1>
          <p className="text-sm text-slate-500 mt-1">{students?.length ?? 0} cadastrados</p>
        </div>
        <Link href="/alunos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(students ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                    Nenhum aluno cadastrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                (students ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-slate-500">{s.email ?? '—'}</TableCell>
                    <TableCell className="text-slate-500">{s.phone ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={s.country === 'BR' ? 'default' : 'secondary'}>
                        {s.country === 'BR' ? '🇧🇷 Brasil' : '🇪🇺 Europa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.active ? 'default' : 'outline'}>
                        {s.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/alunos/${s.id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
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
