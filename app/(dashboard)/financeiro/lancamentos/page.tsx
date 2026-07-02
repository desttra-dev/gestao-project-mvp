export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const categoryLabels: Record<string, string> = {
  mensalidade: 'Mensalidade', avulsa: 'Aula Avulsa', repasse: 'Repasse',
  material: 'Material', software: 'Software', taxa: 'Taxa', outros: 'Outros',
}

export default async function LancamentosPage() {
  const supabase = await createClient()
  const { data: transactions } = await supabase
    .from('financial_transactions')
    .select('*, student:students(name), professor:professors(name)')
    .order('transaction_date', { ascending: false })
    .limit(200)

  const entradasBRL = (transactions ?? []).filter(t => t.type === 'entrada' && t.currency === 'BRL').reduce((s, t) => s + t.amount, 0)
  const entradasEUR = (transactions ?? []).filter(t => t.type === 'entrada' && t.currency === 'EUR').reduce((s, t) => s + t.amount, 0)
  const saidasBRL   = (transactions ?? []).filter(t => t.type === 'saida'   && t.currency === 'BRL').reduce((s, t) => s + t.amount, 0)

  const fmt = (v: number, c: string) => c === 'EUR'
    ? `€ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Lançamentos</h1>
          <p className="text-body mt-1">Entradas e saídas financeiras</p>
        </div>
        <Link href="/financeiro/lancamentos/novo">
          <Button><Plus className="h-4 w-4 mr-2" />Novo Lançamento</Button>
        </Link>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" style={{ color: '#1e6b40' }} />
              <span className="text-label" style={{ color: '#4a5a4a' }}>Entradas BRL</span>
            </div>
            <p className="text-h2" style={{ color: '#1e6b40' }}>{fmt(entradasBRL, 'BRL')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" style={{ color: '#2da862' }} />
              <span className="text-label" style={{ color: '#4a5a4a' }}>Entradas EUR</span>
            </div>
            <p className="text-h2" style={{ color: '#2da862' }}>{fmt(entradasEUR, 'EUR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4" style={{ color: '#b91c1c' }} />
              <span className="text-label" style={{ color: '#4a5a4a' }}>Saídas BRL</span>
            </div>
            <p className="text-h2" style={{ color: '#b91c1c' }}>{fmt(saidasBRL, 'BRL')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Aluno / Responsável</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transactions ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12" style={{ color: '#9dbfa9' }}>
                    Nenhum lançamento registrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                (transactions ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap" style={{ color: '#4a5a4a' }}>
                      {format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {t.type === 'entrada' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#e8faf0', color: '#1e6b40' }}>
                          <TrendingUp className="h-3 w-3" /> Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                          <TrendingDown className="h-3 w-3" /> Saída
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium" style={{ color: '#0d2e1e' }}>{t.description}</p>
                      {t.notes && <p className="text-xs" style={{ color: '#6b8c6b' }}>{t.notes}</p>}
                    </TableCell>
                    <TableCell style={{ color: '#4a5a4a' }}>
                      <p>{(t.student as any)?.name ?? (t.professor as any)?.name ?? '—'}</p>
                      {t.responsible_name && <p className="text-xs" style={{ color: '#6b8c6b' }}>Resp: {t.responsible_name}</p>}
                    </TableCell>
                    <TableCell>
                      {t.category ? <Badge variant="outline">{categoryLabels[t.category] ?? t.category}</Badge> : '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: t.type === 'entrada' ? '#1e6b40' : '#b91c1c' }}>
                      {t.type === 'saida' ? '-' : ''}{fmt(t.amount, t.currency)}
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
