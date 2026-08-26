import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? ''
  const q      = searchParams.get('q') ?? ''

  const supabase = await createClient()
  let query = supabase.from('students').select('*').order('name')
  if (status && status !== 'todos') query = query.eq('status', status)
  if (q.trim()) query = query.ilike('name', `%${q.trim()}%`)

  const { data: students } = await query

  const BOM = '﻿'
  const header = 'Nome,Email,Telefone,País,Status,Responsável,Email Responsável,Telefone Responsável,CPF Responsável,CEP,Endereço,Observações\r\n'
  const rows = (students ?? []).map(s => [
    s.name,
    s.email ?? '',
    s.phone ?? '',
    s.country ?? '',
    s.status ?? '',
    s.responsible_name ?? '',
    s.responsible_email ?? '',
    s.responsible_phone ?? '',
    s.responsible_cpf ?? '',
    s.cep ?? '',
    s.address ?? '',
    s.notes ?? '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')

  return new Response(BOM + header + rows, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="alunos.csv"`,
    },
  })
}
