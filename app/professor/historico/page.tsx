export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyProfessorToken } from '@/lib/professor-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { ProfessorHeader } from '@/components/professor/professor-header'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const LEVEL_LABELS: Record<string, string> = {
  fundamental:'Fundamental', medio:'Médio', superior:'Superior', internacional:'Internacional',
}
const SUBJECT_LABELS: Record<string, string> = {
  matematica:'Matemática', fisica:'Física', quimica:'Química', portugues:'Português',
  historia:'História', geografia:'Geografia', filosofia:'Filosofia', redacao:'Redação', sociologia:'Sociologia',
}
const REASON_LABELS: Record<string, string> = {
  aluno_faltou:'Aluno faltou', professor_faltou:'Professor faltou',
  nao_devia_existir:'Não devia existir', outros:'Outro motivo',
}

function brtNow() {
  const now = new Date()
  return new Date(now.getTime() - 3 * 60 * 60 * 1000)
}

export default async function HistoricoPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('professor_token')?.value
  if (!token) redirect('/professor/login')
  const professorId = verifyProfessorToken(token)
  if (!professorId) redirect('/professor/login')

  const supabase = createServiceClient()
  const { data: professor } = await supabase
    .from('professors').select('id,name').eq('id', professorId).single()
  if (!professor) redirect('/professor/login')

  const brt = brtNow()
  const sp  = await searchParams
  const selectedMonth = sp.mes ?? `${brt.getUTCFullYear()}-${String(brt.getUTCMonth() + 1).padStart(2, '0')}`
  const [y, m] = selectedMonth.split('-').map(Number)

  const monthStart = new Date(Date.UTC(y, m - 1, 1, 3, 0, 0)).toISOString()
  const monthEnd   = new Date(Date.UTC(y, m, 1, 3, 0, 0)).toISOString()
  const nowUtc     = new Date().toISOString()

  const { data: classes } = await supabase
    .from('classes')
    .select('id,scheduled_at,ends_at,level,subject,status,confirmation_status,no_show_reason,no_show_notes,zoom_join_url,student:students(name,responsible_name)')
    .eq('teacher_id', professorId)
    .gte('scheduled_at', monthStart)
    .lt('scheduled_at', monthEnd)
    .lt('scheduled_at', nowUtc)
    .not('status', 'in', '("cancelada","remarcada")')
    .order('scheduled_at', { ascending: false })

  // Build last 6 months options
  const monthOptions: { value: string; label: string }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth() - i, 1))
    const val = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const label = format(d, 'MMMM yyyy', { locale: ptBR })
    monthOptions.push({ value: val, label })
  }

  const totalRealizadas = (classes ?? []).filter(c => c.confirmation_status === 'realizada').length
  const totalNaoHouve   = (classes ?? []).filter(c => c.confirmation_status === 'nao_houve').length
  const totalPendentes  = (classes ?? []).filter(c => !c.confirmation_status).length

  return (
    <div>
      <ProfessorHeader professorName={professor.name} />

      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'16px 16px 48px' }}>

        {/* Month selector */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
          <p style={{ margin:0, fontSize:'11px', fontWeight:700, color:'#9dbfa9', textTransform:'uppercase', letterSpacing:'1px' }}>
            Histórico
          </p>
          <form method="GET" action="/professor/historico" style={{ marginLeft:'auto' }}>
            <select
              name="mes"
              defaultValue={selectedMonth}
              onChange={e => (e.target.form as HTMLFormElement).submit()}
              style={{
                padding:'6px 10px', border:'1.5px solid #d4e8d4', borderRadius:'8px',
                fontSize:'13px', color:'#0d2e1e', background:'white', cursor:'pointer', outline:'none',
              }}
            >
              {monthOptions.map(o => (
                <option key={o.value} value={o.value} style={{ textTransform:'capitalize' }}>
                  {o.label.charAt(0).toUpperCase() + o.label.slice(1)}
                </option>
              ))}
            </select>
          </form>
        </div>

        {/* Summary chips */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px' }}>
          <span style={{ background:'#dcfce7', color:'#166534', borderRadius:'20px', padding:'5px 14px', fontSize:'12px', fontWeight:700 }}>
            ✓ {totalRealizadas} confirmada{totalRealizadas !== 1 ? 's' : ''}
          </span>
          {totalNaoHouve > 0 && (
            <span style={{ background:'#fee2e2', color:'#991b1b', borderRadius:'20px', padding:'5px 14px', fontSize:'12px', fontWeight:700 }}>
              ✗ {totalNaoHouve} não realizada{totalNaoHouve !== 1 ? 's' : ''}
            </span>
          )}
          {totalPendentes > 0 && (
            <span style={{ background:'#fef3c7', color:'#92400e', borderRadius:'20px', padding:'5px 14px', fontSize:'12px', fontWeight:700 }}>
              ⏳ {totalPendentes} pendente{totalPendentes !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Classes list */}
        {(classes ?? []).length === 0 ? (
          <div style={{ background:'white', borderRadius:'12px', padding:'32px', textAlign:'center', border:'1px solid #e8f0e8' }}>
            <p style={{ margin:0, color:'#9dbfa9', fontSize:'14px' }}>Nenhuma aula neste período</p>
          </div>
        ) : (classes ?? []).map((cls: any) => {
          const student = cls.student as { name: string; responsible_name?: string | null } | null
          const startBrt = new Date(new Date(cls.scheduled_at).getTime() - 3 * 60 * 60 * 1000)
          const endBrt   = cls.ends_at ? new Date(new Date(cls.ends_at).getTime() - 3 * 60 * 60 * 1000) : null
          const dateStr  = format(startBrt, "EEE, dd/MM", { locale: ptBR })
          const timeStr  = endBrt ? `${format(startBrt,'HH:mm')} – ${format(endBrt,'HH:mm')}` : format(startBrt,'HH:mm')

          const isRealizada = cls.confirmation_status === 'realizada'
          const isNaoHouve  = cls.confirmation_status === 'nao_houve'

          return (
            <div key={cls.id} style={{
              background:'white', borderRadius:'12px', padding:'14px 16px',
              marginBottom:'8px', border:'1px solid #e8f0e8',
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                <div style={{ textAlign:'center', minWidth:'40px' }}>
                  <p style={{ margin:0, fontSize:'10px', color:'#9dbfa9', textTransform:'capitalize' }}>
                    {format(startBrt,'EEE',{locale:ptBR})}
                  </p>
                  <p style={{ margin:0, fontSize:'20px', fontWeight:800, color:'#0d2e1e', lineHeight:1 }}>
                    {format(startBrt,'dd')}
                  </p>
                </div>
                <div style={{ width:'1px', alignSelf:'stretch', background:'#e8f0e8' }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', flexWrap:'wrap' }}>
                    <div>
                      <p style={{ margin:'0 0 1px', fontSize:'14px', fontWeight:700, color:'#0d2e1e' }}>
                        {student?.name ?? '—'}
                      </p>
                      <p style={{ margin:0, fontSize:'12px', color:'#6b8c6b' }}>
                        {timeStr} · {LEVEL_LABELS[cls.level] ?? cls.level}
                        {cls.subject ? ` · ${SUBJECT_LABELS[cls.subject] ?? cls.subject}` : ''}
                      </p>
                      {student?.responsible_name && (
                        <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#9dbfa9' }}>
                          Resp: {student.responsible_name}
                        </p>
                      )}
                    </div>
                    <div>
                      {isRealizada && (
                        <span style={{ background:'#dcfce7', color:'#166534', borderRadius:'20px', padding:'3px 10px', fontSize:'11px', fontWeight:700 }}>
                          ✓ Confirmada
                        </span>
                      )}
                      {isNaoHouve && (
                        <span style={{ background:'#fee2e2', color:'#991b1b', borderRadius:'20px', padding:'3px 10px', fontSize:'11px', fontWeight:700 }}>
                          ✗ {cls.no_show_reason ? (REASON_LABELS[cls.no_show_reason] ?? cls.no_show_reason) : 'Não houve'}
                        </span>
                      )}
                      {!cls.confirmation_status && (
                        <span style={{ background:'#fef3c7', color:'#92400e', borderRadius:'20px', padding:'3px 10px', fontSize:'11px', fontWeight:700 }}>
                          ⏳ Pendente
                        </span>
                      )}
                    </div>
                  </div>
                  {isNaoHouve && cls.no_show_notes && (
                    <p style={{ margin:'6px 0 0', fontSize:'12px', color:'#6b8c6b', fontStyle:'italic' }}>
                      {cls.no_show_notes}
                    </p>
                  )}
                  {cls.zoom_join_url && (
                    <a href={cls.zoom_join_url} target="_blank" rel="noreferrer" style={{ display:'inline-block', marginTop:'6px', color:'#2D8CFF', fontSize:'12px', textDecoration:'underline' }}>
                      Link da aula
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
