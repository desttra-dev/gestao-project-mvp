import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

const categoryLabels: Record<string, string> = {
  mensalidade: 'Mensalidade', avulsa: 'Aula Avulsa', repasse: 'Repasse',
  material: 'Material', software: 'Software', taxa: 'Taxa', outros: 'Outros',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const de  = searchParams.get('de')
  const ate = searchParams.get('ate')

  const supabase = await createClient()

  let query = supabase
    .from('financial_transactions')
    .select('*, student:students(name), professor:professors(name)')
    .order('transaction_date', { ascending: true })

  if (de)  query = query.gte('transaction_date', de)
  if (ate) query = query.lte('transaction_date', ate + 'T23:59:59')

  const { data, error } = await query

  if (error) {
    return new Response('Erro ao buscar dados', { status: 500 })
  }

  const rows: string[][] = [
    ['Data', 'Tipo', 'Descrição', 'Aluno / Professor', 'Responsável', 'Categoria', 'Moeda', 'Valor'],
    ...(data ?? []).map(t => [
      format(new Date(t.transaction_date), 'dd/MM/yyyy'),
      t.type === 'entrada' ? 'Entrada' : 'Saída',
      t.description ?? '',
      (t.student as { name: string } | null)?.name ??
        (t.professor as { name: string } | null)?.name ?? '',
      t.responsible_name ?? '',
      categoryLabels[t.category] ?? t.category ?? '',
      t.currency ?? 'BRL',
      (t.amount as number)?.toFixed(2).replace('.', ',') ?? '0,00',
    ]),
  ]

  const csv = rows
    .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  const from = de  ?? 'inicio'
  const to   = ate ?? 'fim'
  const filename = `lancamentos_${from}_${to}.csv`

  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
