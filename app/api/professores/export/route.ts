import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: professors } = await supabase
    .from('professors')
    .select('*')
    .order('name')

  const BOM = '﻿'
  const header = 'Nome,Email,Telefone,Dados Bancários,Status\r\n'
  const rows = (professors ?? []).map(p => [
    p.name,
    p.email ?? '',
    p.phone ?? '',
    p.bank_info ?? '',
    p.active ? 'Ativo' : 'Inativo',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')

  return new Response(BOM + header + rows, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="professores.csv"`,
    },
  })
}
