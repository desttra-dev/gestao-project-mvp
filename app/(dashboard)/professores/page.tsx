export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ExportCsvButton } from '@/components/ui/export-csv-button'
import { ProfessoresView } from '@/components/professores-view'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ProfessoresPage() {
  const supabase = await createClient()
  const { data: professors } = await supabase
    .from('professors')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1">Professores</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ExportCsvButton href="/api/professores/export" />
          <Link href="/professores/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Professor
            </Button>
          </Link>
        </div>
      </div>

      <ProfessoresView professors={professors ?? []} />
    </div>
  )
}
