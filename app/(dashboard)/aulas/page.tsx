export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { AulasView } from '@/components/aulas-view'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function AulasPage() {
  const supabase = await createClient()
  const { data: classes } = await supabase
    .from('classes')
    .select('*, student:students(name), professor:professors(name)')
    .order('scheduled_at', { ascending: false })
    .limit(200)

  const total = classes?.length ?? 0
  const agendadas = classes?.filter(c => c.status === 'agendada').length ?? 0

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

      <AulasView classes={classes ?? []} />
    </div>
  )
}
