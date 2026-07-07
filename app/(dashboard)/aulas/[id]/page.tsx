export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AulaForm } from '@/components/forms/aula-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function EditarAulaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: aula },
    { data: students },
    { data: professors },
    { data: enrollments },
  ] = await Promise.all([
    supabase.from('classes').select('*').eq('id', id).single(),
    supabase.from('students').select('*').eq('active', true).order('name'),
    supabase.from('professors').select('*').eq('active', true).order('name'),
    supabase.from('enrollments').select('*, plan:plans(name)').eq('status', 'ativo'),
  ])

  if (!aula) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/aulas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-h1">Editar Aula</h1>
      </div>
      <AulaForm
        students={students ?? []}
        professors={professors ?? []}
        enrollments={enrollments ?? []}
        aula={aula}
      />
    </div>
  )
}
