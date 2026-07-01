export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { RepasseActions } from './repasse-actions'
import { GerarRepassesButton } from './gerar-repasses-button'

export default async function RepassesPage() {
  const supabase = await createClient()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { data: payouts } = await supabase
    .from('teacher_payouts')
    .select('*, professor:professors(name)')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
    .order('created_at', { ascending: false })

  const pendingTotal = (payouts ?? [])
    .filter(p => p.status === 'pendente')
    .reduce((s, p) => s + p.amount_brl, 0)

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Repasses</h1>
          <p className="text-sm text-slate-500 mt-1">
            Total pendente: <strong className="text-orange-600">R$ {pendingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
        <GerarRepassesButton month={month} year={year} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Repasses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Aulas</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payouts ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                    Nenhum repasse gerado ainda. Clique em "Gerar Repasses" para calcular o mês atual.
                  </TableCell>
                </TableRow>
              ) : (
                (payouts ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{(p.professor as any)?.name ?? '—'}</TableCell>
                    <TableCell className="text-slate-500">
                      {monthNames[(p.period_month ?? 1) - 1]}/{p.period_year}
                    </TableCell>
                    <TableCell>{p.total_classes} aula(s)</TableCell>
                    <TableCell className="font-semibold">
                      R$ {p.amount_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'pago' ? 'default' : 'outline'}>
                        {p.status === 'pago' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <RepasseActions payoutId={p.id} status={p.status} />
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
