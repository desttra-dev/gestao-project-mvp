export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyProfessorToken } from '@/lib/professor-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { ProfessorHeader } from '@/components/professor/professor-header'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function brtNow() {
  const now = new Date()
  return new Date(now.getTime() - 3 * 60 * 60 * 1000)
}

export default async function PagamentosPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('professor_token')?.value
  if (!token) redirect('/professor/login')
  const professorId = verifyProfessorToken(token)
  if (!professorId) redirect('/professor/login')

  const supabase = createServiceClient()
  const { data: professor } = await supabase
    .from('professors').select('id,name').eq('id', professorId).single()
  if (!professor) redirect('/professor/login')

  const brt  = brtNow()
  const year = brt.getUTCFullYear()
  const month = brt.getUTCMonth() + 1

  const monthStart = new Date(Date.UTC(year, month - 1, 1, 3, 0, 0)).toISOString()
  const monthEnd   = new Date(Date.UTC(year, month, 1, 3, 0, 0)).toISOString()

  // Aulas duplamente confirmadas no mês atual ainda sem repasse
  const [
    { data: pendingClasses },
    { data: rates },
    { data: payouts },
    { data: currentPayout },
  ] = await Promise.all([
    supabase.from('classes')
      .select('id, level, scheduled_at')
      .eq('teacher_id', professorId)
      .eq('status', 'realizada')
      .eq('confirmation_status', 'realizada')
      .gte('scheduled_at', monthStart)
      .lt('scheduled_at', monthEnd),

    supabase.from('teacher_rates').select('level, rate_brl'),

    supabase.from('teacher_payouts')
      .select('id, period_month, period_year, total_classes, amount_brl, status, paid_at')
      .eq('teacher_id', professorId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false }),

    supabase.from('teacher_payouts')
      .select('id, total_classes, amount_brl, status, paid_at')
      .eq('teacher_id', professorId)
      .eq('period_month', month)
      .eq('period_year', year)
      .maybeSingle(),
  ])

  const rateMap: Record<string, number> = {}
  for (const r of rates ?? []) rateMap[r.level] = r.rate_brl

  // Se já há repasse gerado p/ o mês, usa o valor dele; senão calcula das aulas pendentes
  const currentClasses = currentPayout?.total_classes ?? (pendingClasses?.length ?? 0)
  const currentAmount  = currentPayout?.amount_brl
    ?? (pendingClasses ?? []).reduce((sum, c) => sum + (rateMap[c.level] ?? 0), 0)
  const currentStatus  = currentPayout?.status ?? 'a_calcular'

  const statusLabel: Record<string, { text: string; bg: string; color: string }> = {
    pago:        { text: 'Pago',      bg: '#dcfce7', color: '#166534' },
    pendente:    { text: 'Pendente',  bg: '#fef3c7', color: '#92400e' },
    a_calcular:  { text: 'A calcular', bg: '#f1f5f9', color: '#475569' },
  }

  const historyPayouts = (payouts ?? []).filter(
    p => !(p.period_month === month && p.period_year === year)
  )

  return (
    <div>
      <ProfessorHeader professorName={professor.name} />

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '16px 16px 48px' }}>

        <p style={{ margin: '0 0 20px', fontSize: '11px', fontWeight: 700, color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Pagamentos
        </p>

        {/* Mês atual */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8f0e8', marginBottom: '24px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f7f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0d2e1e', textTransform: 'capitalize' }}>
              {format(new Date(monthStart), 'MMMM yyyy', { locale: ptBR })}
            </p>
            {(() => {
              const s = statusLabel[currentStatus]
              return (
                <span style={{ background: s.bg, color: s.color, borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: 700 }}>
                  {s.text}
                </span>
              )
            })()}
          </div>
          <div style={{ padding: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aulas confirmadas</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#0d2e1e', lineHeight: 1 }}>{currentClasses}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {currentStatus === 'pago' ? 'Valor pago' : 'Valor estimado'}
              </p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#1e6b40', lineHeight: 1 }}>
                R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {currentPayout?.paid_at && (
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pago em</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0d2e1e' }}>
                  {format(new Date(currentPayout.paid_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
          {currentStatus === 'a_calcular' && currentClasses === 0 && (
            <div style={{ padding: '0 20px 16px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#9dbfa9' }}>
                Nenhuma aula duplamente confirmada neste mês ainda.
              </p>
            </div>
          )}
          {currentStatus === 'a_calcular' && currentClasses > 0 && (
            <div style={{ padding: '0 20px 16px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#92400e' }}>
                Aulas confirmadas aguardando fechamento pela gestão.
              </p>
            </div>
          )}
        </div>

        {/* Histórico */}
        {historyPayouts.length > 0 && (
          <>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Histórico
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {historyPayouts.map(p => {
                const s = statusLabel[p.status] ?? statusLabel.pendente
                return (
                  <div key={p.id} style={{
                    background: 'white', borderRadius: '12px', border: '1px solid #e8f0e8',
                    padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                  }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#0d2e1e' }}>
                        {MONTH_NAMES[(p.period_month ?? 1) - 1]} {p.period_year}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b8c6b' }}>
                        {p.total_classes} aula{p.total_classes !== 1 ? 's' : ''}
                        {p.paid_at ? ` · pago em ${format(new Date(p.paid_at), 'dd/MM/yyyy')}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e6b40' }}>
                        R$ {p.amount_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span style={{ background: s.bg, color: s.color, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700 }}>
                        {s.text}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {historyPayouts.length === 0 && currentClasses === 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1px solid #e8f0e8' }}>
            <p style={{ margin: 0, color: '#9dbfa9', fontSize: '14px' }}>Nenhum pagamento registrado ainda</p>
          </div>
        )}

      </div>
    </div>
  )
}
