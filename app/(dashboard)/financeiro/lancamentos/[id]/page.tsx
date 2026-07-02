export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { TransacaoForm } from '@/components/forms/transacao-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function EditarLancamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: transaction }, { data: students }, { data: professors }] = await Promise.all([
    supabase.from('financial_transactions').select('*').eq('id', id).single(),
    supabase.from('students').select('*').eq('active', true).order('name'),
    supabase.from('professors').select('*').eq('active', true).order('name'),
  ])

  if (!transaction) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/financeiro/lancamentos">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
        </Link>
        <h1 className="text-h1">Editar Lançamento</h1>
      </div>
      <TransacaoForm
        students={students ?? []}
        professors={professors ?? []}
        transaction={transaction}
      />
    </div>
  )
}
