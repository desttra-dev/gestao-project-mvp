export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { ExportForm } from './export-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ExportarAulasPage() {
  const supabase = await createClient()
  const { data: professors } = await supabase
    .from('professors')
    .select('id, name')
    .eq('active', true)
    .order('name')

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/aulas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exportar aulas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Filtre e baixe as aulas em formato CSV (Excel)</p>
        </div>
      </div>

      <ExportForm professors={professors ?? []} />
    </div>
  )
}
