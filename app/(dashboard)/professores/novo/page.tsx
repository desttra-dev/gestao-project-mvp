export const dynamic = 'force-dynamic'

import { ProfessorForm } from '@/components/forms/professor-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NovoProfessorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/professores">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Novo Professor</h1>
      </div>
      <ProfessorForm />
    </div>
  )
}
