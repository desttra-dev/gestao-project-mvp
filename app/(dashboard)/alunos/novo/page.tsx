export const dynamic = 'force-dynamic'

import { AlunoForm } from '@/components/forms/aluno-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NovoAlunoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/alunos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Novo Aluno</h1>
      </div>
      <AlunoForm />
    </div>
  )
}
