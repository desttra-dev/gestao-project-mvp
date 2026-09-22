export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { AulasView } from '@/components/aulas-view'
import Link from 'next/link'
import { Plus, Download } from 'lucide-react'
import { format } from 'date-fns'

export default async function AulasPage({
  searchParams,
}: {
  searchParams: Promise<{ professor_id?: string }>
}) {
  const { professor_id } = await searchParams
  const supabase = await createClient()
  const hoje = format(new Date(), "yyyy-MM-dd'T'00:00:00")

  // Janela: 60 dias atrás até o futuro (sem limite superior)
  // Garante que aulas recentes e todas as futuras apareçam no calendário
  const since = new Date()
  since.setDate(since.getDate() - 60)
  const sinceIso = since.toISOString().slice(0, 10) + 'T00:00:00'

  let query = supabase
    .from('classes')
    .select('*, student:students(name), professor:professors(name)')
    .gte('scheduled_at', sinceIso)
    .order('scheduled_at', { ascending: true })

  if (professor_id) query = query.eq('teacher_id', professor_id)

  const [{ data: classes }, { data: professors }, { data: stats }] = await Promise.all([
    query,
    supabase.from('professors').select('id, name').eq('active', true).order('name'),
    supabase.from('classes').select('id, status, scheduled_at'),
  ])

  const agendadas = stats?.filter(c => c.status === 'agendada' && c.scheduled_at >= hoje).length ?? 0
  const total     = stats?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1">Aulas</h1>
          <p className="text-body mt-1">
            <span style={{ color: '#1e6b40', fontWeight: 600 }}>{agendadas} agendadas</span>
            {' · '}
            <span style={{ color: '#6b8c6b' }}>{total} no total</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <Link href="/aulas/exportar">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </Link>
          <Link href="/aulas/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Button>
          </Link>
        </div>
      </div>

      <AulasView
        classes={classes ?? []}
        professors={professors ?? []}
        professorId={professor_id ?? ''}
      />
    </div>
  )
}
