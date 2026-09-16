export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ExportCsvButton } from '@/components/ui/export-csv-button'
import { AlunosCards } from '@/components/alunos-cards'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function AlunosPage() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('students')
    .select('id, name, status, email, phone, responsible_name')
    .order('name')

  const total  = students?.length ?? 0
  const ativos = students?.filter(s => s.status === 'ativo').length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1">Alunos</h1>
          <p className="text-body mt-1">
            <span style={{ color: '#1e6b40', fontWeight: 600 }}>{ativos} ativos</span>
            {' · '}
            <span style={{ color: '#6b8c6b' }}>{total} no total</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ExportCsvButton href="/api/alunos/export" />
          <Link href="/alunos/novo">
            <Button><Plus className="h-4 w-4 mr-2" />Novo Aluno</Button>
          </Link>
        </div>
      </div>

      <AlunosCards students={students ?? []} />
    </div>
  )
}
