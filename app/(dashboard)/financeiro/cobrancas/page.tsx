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
import { CobrancaActions } from './cobranca-actions'

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendente: 'outline',
  pago: 'default',
  atrasado: 'destructive',
  cancelado: 'secondary',
}

const methodLabels: Record<string, string> = {
  pix: 'PIX',
  iban: 'IBAN',
  wise: 'Wise',
  cora: 'Cora',
}

export default async function CobrancasPage() {
  const supabase = await createClient()
  const { data: charges } = await supabase
    .from('charges')
    .select('*, student:students(name)')
    .order('due_date', { ascending: false })
    .limit(150)

  const totalPendenteBRL = (charges ?? []).filter(c => c.status === 'pendente' && c.currency === 'BRL').reduce((s, c) => s + c.amount, 0)
  const totalPendenteEUR = (charges ?? []).filter(c => c.status === 'pendente' && c.currency === 'EUR').reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cobranças</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pendente: <strong className="text-orange-600">R$ {totalPendenteBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            {totalPendenteEUR > 0 && <> · <strong className="text-orange-600">€ {totalPendenteEUR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></>}
          </p>
        </div>
        <Link href="/financeiro/cobrancas/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Cobrança
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(charges ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-12">
                    Nenhuma cobrança registrada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                (charges ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{(c.student as any)?.name ?? '—'}</TableCell>
                    <TableCell className="font-semibold">
                      {c.currency === 'BRL'
                        ? `R$ ${c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : `€ ${c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      }
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500">
                      {format(new Date(c.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-slate-500">{c.period_reference}</TableCell>
                    <TableCell>
                      {c.payment_method ? (
                        <Badge variant="outline">{methodLabels[c.payment_method]}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[c.status] ?? 'outline'}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <CobrancaActions chargeId={c.id} status={c.status} />
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
