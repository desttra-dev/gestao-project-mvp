export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyProfessorToken } from '@/lib/professor-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { ClassConfirmation } from '@/components/professor/class-confirmation'
import { ProfessorHeader } from '@/components/professor/professor-header'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const LEVEL_LABELS: Record<string, string> = {
  fundamental: 'Fundamental', medio: 'Médio',
  superior: 'Superior', internacional: 'Internacional',
}
const SUBJECT_LABELS: Record<string, string> = {
  matematica: 'Matemática', fisica: 'Física', quimica: 'Química', portugues: 'Português',
  historia: 'História', geografia: 'Geografia', filosofia: 'Filosofia',
  redacao: 'Redação', sociologia: 'Sociologia',
}
const LEVEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  fundamental:   { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe' },
  medio:         { bg:'#f5f3ff', color:'#6d28d9', border:'#ddd6fe' },
  superior:      { bg:'#ecfdf5', color:'#065f46', border:'#a7f3d0' },
  internacional: { bg:'#fff7ed', color:'#c2410c', border:'#fed7aa' },
}

function brtNow() {
  const now = new Date()
  return new Date(now.getTime() - 3 * 60 * 60 * 1000)
}

function dayUtcRange(brtDate: Date) {
  const y = brtDate.getUTCFullYear(), m = brtDate.getUTCMonth(), d = brtDate.getUTCDate()
  const start = new Date(Date.UTC(y, m, d, 3, 0, 0)).toISOString()
  const end   = new Date(Date.UTC(y, m, d + 1, 3, 0, 0)).toISOString()
  return { start, end }
}

export default async function ProfessorDashboard() {
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
  const { start: todayStart, end: todayEnd } = dayUtcRange(brt)
  const weekEnd = new Date(new Date(todayEnd).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()

  // Monthly range in BRT
  const y = brt.getUTCFullYear(), mo = brt.getUTCMonth()
  const monthStart = new Date(Date.UTC(y, mo, 1, 3, 0, 0)).toISOString()
  const monthEnd   = new Date(Date.UTC(y, mo + 1, 1, 3, 0, 0)).toISOString()
  const monthLabel = format(new Date(monthStart), 'MMMM yyyy', { locale: ptBR })

  const [
    { data: todayClasses },
    { data: upcomingClasses },
    { data: monthClasses },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.from('classes')
      .select('id,scheduled_at,ends_at,level,subject,status,confirmation_status,no_show_reason,no_show_notes,zoom_join_url,student:students(name)')
      .eq('teacher_id', professorId)
      .gte('scheduled_at', todayStart).lt('scheduled_at', todayEnd)
      .not('status', 'in', '("cancelada","remarcada")')
      .order('scheduled_at'),

    supabase.from('classes')
      .select('id,scheduled_at,ends_at,level,subject,status,student:students(name)')
      .eq('teacher_id', professorId)
      .gte('scheduled_at', todayEnd).lt('scheduled_at', weekEnd)
      .not('status', 'in', '("cancelada","remarcada")')
      .order('scheduled_at')
      .limit(10),

    supabase.from('classes')
      .select('level')
      .eq('teacher_id', professorId)
      .gte('scheduled_at', monthStart).lt('scheduled_at', monthEnd)
      .not('status', 'in', '("cancelada")')
      .neq('confirmation_status', 'nao_houve'),

    supabase.from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', professorId)
      .lt('scheduled_at', todayStart)
      .is('confirmation_status', null)
      .not('status', 'in', '("cancelada","remarcada")'),
  ])

  const levelCounts: Record<string, number> = {}
  for (const c of monthClasses ?? []) {
    levelCounts[c.level] = (levelCounts[c.level] ?? 0) + 1
  }

  const todayLabel = format(new Date(todayStart), "EEEE, dd 'de' MMMM", { locale: ptBR })

  return (
    <div>
      <ProfessorHeader professorName={professor.name} />

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '16px 16px 48px' }}>

        {/* Pending banner */}
        {(pendingCount ?? 0) > 0 && (
          <div style={{
            background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:'12px',
            padding:'12px 16px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px',
          }}>
            <span style={{ fontSize:'18px' }}>⚠️</span>
            <div>
              <p style={{ margin:0, fontSize:'14px', fontWeight:700, color:'#92400e' }}>
                {pendingCount} aula{(pendingCount ?? 0) > 1 ? 's' : ''} aguardando confirmação
              </p>
              <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#b45309' }}>
                Você tem aulas anteriores que ainda não foram confirmadas.
              </p>
            </div>
          </div>
        )}

        {/* Today's classes */}
        <section style={{ marginBottom:'32px' }}>
          <p style={{ margin:'0 0 12px', fontSize:'11px', fontWeight:700, color:'#9dbfa9', textTransform:'uppercase', letterSpacing:'1px' }}>
            Aulas de hoje · <span style={{ textTransform:'capitalize' }}>{todayLabel}</span>
          </p>
          {(todayClasses ?? []).length === 0 ? (
            <div style={{ background:'white', borderRadius:'12px', padding:'24px', textAlign:'center', border:'1px solid #e8f0e8' }}>
              <p style={{ margin:0, color:'#9dbfa9', fontSize:'14px' }}>Nenhuma aula hoje</p>
            </div>
          ) : (todayClasses ?? []).map((cls: any) => {
            const student = cls.student as { name: string } | null
            const startBrt = new Date(new Date(cls.scheduled_at).getTime() - 3*60*60*1000)
            const endBrt   = cls.ends_at ? new Date(new Date(cls.ends_at).getTime() - 3*60*60*1000) : null
            const timeStr  = endBrt
              ? `${format(startBrt,'HH:mm')} – ${format(endBrt,'HH:mm')}`
              : format(startBrt,'HH:mm')
            const lc = LEVEL_COLORS[cls.level] ?? LEVEL_COLORS.superior
            const subjectLabel = cls.subject ? (SUBJECT_LABELS[cls.subject] ?? cls.subject) : null

            return (
              <div key={cls.id} style={{
                background:'white', borderRadius:'12px', padding:'16px',
                marginBottom:'10px', border:'1px solid #e8f0e8',
                boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:'0 0 2px', fontSize:'18px', fontWeight:800, color:'#0d2e1e' }}>{timeStr}</p>
                    <p style={{ margin:'0 0 8px', fontSize:'15px', fontWeight:600, color:'#1e6b40' }}>
                      {student?.name ?? '—'}
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                      <span style={{ background:lc.bg, color:lc.color, border:`1px solid ${lc.border}`, borderRadius:'20px', padding:'2px 10px', fontSize:'11px', fontWeight:700 }}>
                        {LEVEL_LABELS[cls.level] ?? cls.level}
                      </span>
                      {subjectLabel && (
                        <span style={{ background:'#f8fdf9', color:'#6b8c6b', border:'1px solid #e0f0e6', borderRadius:'20px', padding:'2px 10px', fontSize:'11px' }}>
                          {subjectLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {cls.zoom_join_url && (
                    <a href={cls.zoom_join_url} target="_blank" rel="noreferrer" style={{
                      display:'inline-block', background:'#2D8CFF', color:'white', textDecoration:'none',
                      padding:'8px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:700, whiteSpace:'nowrap', flexShrink:0,
                    }}>
                      Entrar no Zoom
                    </a>
                  )}
                </div>

                <ClassConfirmation
                  classId={cls.id}
                  endsAt={cls.ends_at}
                  scheduledAt={cls.scheduled_at}
                  confirmationStatus={cls.confirmation_status}
                  noShowReason={cls.no_show_reason}
                  noShowNotes={cls.no_show_notes}
                />
              </div>
            )
          })}
        </section>

        {/* Upcoming this week */}
        {(upcomingClasses ?? []).length > 0 && (
          <section style={{ marginBottom:'32px' }}>
            <p style={{ margin:'0 0 12px', fontSize:'11px', fontWeight:700, color:'#9dbfa9', textTransform:'uppercase', letterSpacing:'1px' }}>
              Próximas aulas
            </p>
            {(upcomingClasses ?? []).map((cls: any) => {
              const student = cls.student as { name: string } | null
              const startBrt = new Date(new Date(cls.scheduled_at).getTime() - 3*60*60*1000)
              const endBrt   = cls.ends_at ? new Date(new Date(cls.ends_at).getTime() - 3*60*60*1000) : null
              const dateStr  = format(startBrt, "EEE, dd/MM", { locale: ptBR })
              const timeStr  = endBrt
                ? `${format(startBrt,'HH:mm')} – ${format(endBrt,'HH:mm')}`
                : format(startBrt,'HH:mm')

              return (
                <div key={cls.id} style={{
                  background:'white', borderRadius:'12px', padding:'14px 16px', marginBottom:'8px',
                  border:'1px solid #e8f0e8', display:'flex', alignItems:'center', gap:'14px',
                }}>
                  <div style={{ textAlign:'center', minWidth:'44px' }}>
                    <p style={{ margin:0, fontSize:'11px', color:'#9dbfa9', textTransform:'capitalize' }}>
                      {format(startBrt,'EEE',{locale:ptBR})}
                    </p>
                    <p style={{ margin:0, fontSize:'22px', fontWeight:800, color:'#0d2e1e', lineHeight:1 }}>
                      {format(startBrt,'dd')}
                    </p>
                  </div>
                  <div style={{ width:'1px', alignSelf:'stretch', background:'#e8f0e8' }} />
                  <div style={{ flex:1 }}>
                    <p style={{ margin:'0 0 1px', fontSize:'14px', fontWeight:700, color:'#0d2e1e' }}>
                      {student?.name ?? '—'}
                    </p>
                    <p style={{ margin:0, fontSize:'12px', color:'#6b8c6b' }}>
                      {timeStr} · {LEVEL_LABELS[cls.level] ?? cls.level}
                      {cls.subject ? ` · ${SUBJECT_LABELS[cls.subject] ?? cls.subject}` : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* Monthly stats */}
        <section>
          <p style={{ margin:'0 0 12px', fontSize:'11px', fontWeight:700, color:'#9dbfa9', textTransform:'uppercase', letterSpacing:'1px' }}>
            <span style={{ textTransform:'capitalize' }}>{monthLabel}</span> — aulas por nível
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
            {(['fundamental','medio','superior','internacional'] as const).map(lvl => {
              const lc = LEVEL_COLORS[lvl]
              const count = levelCounts[lvl] ?? 0
              return (
                <div key={lvl} style={{
                  background:'white', border:`1.5px solid ${lc.border}`, borderRadius:'12px',
                  padding:'16px', textAlign:'center',
                }}>
                  <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:700, color:lc.color, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                    {LEVEL_LABELS[lvl]}
                  </p>
                  <p style={{ margin:0, fontSize:'36px', fontWeight:800, color:lc.color, lineHeight:1 }}>{count}</p>
                  <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#9dbfa9' }}>
                    {count === 1 ? 'aula' : 'aulas'}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}
