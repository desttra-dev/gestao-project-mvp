export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { CobrancaForm } from '@/components/forms/cobranca-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NovaCobrancaPage() {
  const supabase = await createClient()

  const [{ data: students }, { data: enrollments }] = await Promise.all([
    supabase.from('students').select('*').eq('active', true).order('name'),
    supabase.from('enrollments').select('*, plan:plans(name, price, currency)').eq('status', 'ativo'),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/financeiro/cobrancas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nova Cobrança</h1>
      </div>
      <CobrancaForm students={students ?? []} enrollments={enrollments ?? []} />
    </div>
  )
}
