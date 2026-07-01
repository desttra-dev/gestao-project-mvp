export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { ProfessorForm } from '@/components/forms/professor-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function EditarProfessorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: professor } = await supabase.from('professors').select('*').eq('id', id).single()

  if (!professor) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/professores">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar Professor</h1>
      </div>
      <ProfessorForm professor={professor} />
    </div>
  )
}
