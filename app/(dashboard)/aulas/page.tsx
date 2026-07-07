export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { AulasView } from '@/components/aulas-view'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

const PAGE_SIZE = 50

export default async function AulasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; periodo?: string; professor_id?: string }>
}) {
  const { page = '1', periodo = 'proximas', professor_id } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const from    = (pageNum - 1) * PAGE_SIZE
  const to      = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const hoje     = format(new Date(), "yyyy-MM-dd'T'00:00:00")

  // ── Query paginada (para a lista) ─────────────────────────────────────────
  let listQuery = supabase
    .from('classes')
    .select('*, student:students(name), professor:professors(name)', { count: 'exact' })

  if (professor_id) listQuery = listQuery.eq('teacher_id', professor_id)

  if (periodo === 'proximas') {
    listQuery = listQuery.gte('scheduled_at', hoje).order('scheduled_at', { ascending: true })
  } else if (periodo === 'passadas') {
    listQuery = listQuery.lt('scheduled_at', hoje).order('scheduled_at', { ascending: false })
  } else {
    listQuery = listQuery.order('scheduled_at', { ascending: true })
  }

  listQuery = listQuery.range(from, to)

  // ── Query sem paginação (para o calendário) ───────────────────────────────
  let calQuery = supabase
    .from('classes')
    .select('*, student:students(name), professor:professors(name)')
    .order('scheduled_at', { ascending: true })
    .limit(500)

  if (professor_id) calQuery = calQuery.eq('teacher_id', professor_id)

  const [{ data: classes, count }, { data: allClasses }, { data: professors }] = await Promise.all([
    listQuery,
    calQuery,
    supabase.from('professors').select('id, name').eq('active', true).order('name'),
  ])

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Contadores globais (sobre todos, não filtrado)
  const { data: stats } = await supabase
    .from('classes')
    .select('id, status, scheduled_at')

  const agendadas = stats?.filter(c => c.status === 'agendada' && c.scheduled_at >= hoje).length ?? 0
  const total     = stats?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Aulas</h1>
          <p className="text-body mt-1">
            <span style={{ color: '#1e6b40', fontWeight: 600 }}>{agendadas} agendadas</span>
            {' · '}
            <span style={{ color: '#6b8c6b' }}>{total} no total</span>
          </p>
        </div>
        <Link href="/aulas/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Aula
          </Button>
        </Link>
      </div>

      <AulasView
        classes={classes ?? []}
        allClasses={allClasses ?? []}
        page={pageNum}
        totalPages={totalPages}
        total={count ?? 0}
        periodo={periodo}
        professors={professors ?? []}
        professorId={professor_id ?? ''}
      />
    </div>
  )
}
