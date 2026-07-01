export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PlanosManager } from './planos-manager'

const typeLabels: Record<string, string> = {
  avulsa: 'Avulsa',
  weekly_1x: '1x/semana',
  weekly_2x: '2x/semana',
  weekly_3x: '3x/semana',
  custom: 'Personalizado',
}

export default async function PlanosPage() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .order('country')
    .order('price')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planos</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie os planos e pacotes disponíveis</p>
        </div>
        <PlanosManager plans={plans ?? []} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Aulas/mês</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(plans ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                    Nenhum plano cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                (plans ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {p.country === 'BR' ? '🇧🇷 Brasil' : '🇪🇺 Europa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{typeLabels[p.type] ?? p.type}</TableCell>
                    <TableCell className="text-slate-500">{p.classes_per_month ?? '—'}</TableCell>
                    <TableCell className="font-semibold">
                      {p.currency === 'BRL'
                        ? `R$ ${p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : `€ ${p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.active ? 'default' : 'outline'}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </Badge>
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
