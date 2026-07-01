export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AlunoForm } from '@/components/forms/aluno-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function EditarAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: student } = await supabase.from('students').select('*').eq('id', id).single()

  if (!student) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/alunos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar Aluno</h1>
      </div>
      <AlunoForm student={student} />
    </div>
  )
}
