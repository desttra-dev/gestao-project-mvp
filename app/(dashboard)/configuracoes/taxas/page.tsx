export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { TaxasManager } from './taxas-manager'

const levelLabels: Record<string, string> = {
  fundamental: '🏫 Ensino Fundamental',
  medio: '📚 Ensino Médio',
  superior: '🎓 Ensino Superior',
  internacional: '🌍 Internacional',
}

export default async function TaxasPage() {
  const supabase = await createClient()
  const { data: rates } = await supabase
    .from('teacher_rates')
    .select('*')
    .order('level')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Taxas de Repasse</h1>
        <p className="text-sm text-slate-500 mt-1">Valor pago ao professor por aula realizada</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {(rates ?? []).map((rate) => (
          <TaxasManager key={rate.id} rate={rate} levelLabel={levelLabels[rate.level] ?? rate.level} />
        ))}
      </div>
    </div>
  )
}
