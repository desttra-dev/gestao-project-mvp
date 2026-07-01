export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'

export default async function ProfessoresPage() {
  const supabase = await createClient()
  const { data: professors } = await supabase
    .from('professors')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Professores</h1>
          <p className="text-sm text-slate-500 mt-1">{professors?.length ?? 0} cadastrados</p>
        </div>
        <Link href="/professores/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Professor
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
                <TableHead>Dados Bancários</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(professors ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                    Nenhum professor cadastrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                (professors ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-slate-500">{p.email ?? '—'}</TableCell>
                    <TableCell className="text-slate-500">{p.phone ?? '—'}</TableCell>
                    <TableCell className="text-slate-500 max-w-48 truncate">{p.bank_info ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={p.active ? 'default' : 'outline'}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/professores/${p.id}`}>
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
