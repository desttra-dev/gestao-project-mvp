import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

const levelLabels: Record<string, string> = {
  fundamental: 'Fundamental', medio: 'Médio',
  superior: 'Superior', internacional: 'Internacional',
}
const subjectLabels: Record<string, string> = {
  matematica: 'Matemática', fisica: 'Física', quimica: 'Química',
  portugues: 'Português', historia: 'História', geografia: 'Geografia',
  filosofia: 'Filosofia', redacao: 'Redação', sociologia: 'Sociologia',
}
const statusLabels: Record<string, string> = {
  agendada: 'Agendada', realizada: 'Realizada',
  cancelada: 'Cancelada', remarcada: 'Remarcada',
}
const confirmLabels: Record<string, string> = {
  realizada: 'Confirmada', nao_houve: 'Não houve',
}
const reasonLabels: Record<string, string> = {
  aluno_faltou: 'Aluno faltou', professor_faltou: 'Professor faltou',
  nao_devia_existir: 'Não devia existir', outros: 'Outro motivo',
}

function safeDate(s: string | null, fallback: string) {
  return (s ?? fallback).replace(/[^0-9\-]/g, '').slice(0, 10)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const de         = searchParams.get('de')
  const ate        = searchParams.get('ate')
  const professorId = searchParams.get('professor_id')
  const statusList = searchParams.get('status')   // ex: "realizada,cancelada"
  const aluno      = searchParams.get('aluno')?.trim()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Não autorizado', { status: 401 })

  // Se há filtro por nome de aluno, busca IDs primeiro
  let studentIds: string[] | null = null
  if (aluno) {
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .ilike('name', `%${aluno}%`)
    studentIds = (students ?? []).map(s => s.id)
    if (studentIds.length === 0) {
      return new Response('﻿"Nenhuma aula encontrada para os filtros selecionados."', {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="aulas.csv"',
        },
      })
    }
  }

  let query = supabase
    .from('classes')
    .select(`
      id, scheduled_at, ends_at, level, subject, status,
      confirmation_status, no_show_reason, no_show_notes,
      student:students(name, responsible_name),
      professor:professors(name)
    `)
    .order('scheduled_at', { ascending: true })

  if (de)  query = query.gte('scheduled_at', de + 'T00:00:00')
  if (ate) query = query.lte('scheduled_at', ate + 'T23:59:59')
  if (professorId) query = query.eq('teacher_id', professorId)
  if (statusList) {
    const statuses = statusList.split(',').filter(Boolean)
    if (statuses.length === 1) query = query.eq('status', statuses[0])
    else if (statuses.length > 1) query = query.in('status', statuses)
  }
  if (studentIds) query = query.in('student_id', studentIds)

  const { data, error } = await query

  if (error) return new Response('Erro ao buscar dados', { status: 500 })

  const header = [
    'Data', 'Horário início', 'Horário fim',
    'Aluno', 'Responsável', 'Professor',
    'Nível', 'Matéria',
    'Status', 'Confirmação professor', 'Motivo não realização', 'Observações',
  ]

  const rows = (data ?? []).map(c => {
    const student   = c.student   as unknown as { name: string; responsible_name: string | null } | null
    const professor = c.professor as unknown as { name: string } | null
    const start = new Date(c.scheduled_at as string)
    const end   = c.ends_at ? new Date(c.ends_at as string) : null
    // Convert UTC to BRT (-3h)
    const toBRT = (d: Date) => new Date(d.getTime() - 3 * 60 * 60 * 1000)
    const startBRT = toBRT(start)
    const endBRT   = end ? toBRT(end) : null

    return [
      format(startBRT, 'dd/MM/yyyy'),
      format(startBRT, 'HH:mm'),
      endBRT ? format(endBRT, 'HH:mm') : '',
      student?.name ?? '',
      student?.responsible_name ?? '',
      professor?.name ?? '',
      levelLabels[c.level as string]   ?? (c.level   as string) ?? '',
      subjectLabels[c.subject as string] ?? (c.subject as string) ?? '',
      statusLabels[c.status as string]  ?? (c.status  as string) ?? '',
      confirmLabels[c.confirmation_status as string] ?? (c.confirmation_status ? String(c.confirmation_status) : 'Pendente'),
      reasonLabels[c.no_show_reason as string] ?? (c.no_show_reason as string) ?? '',
      c.no_show_notes as string ?? '',
    ]
  })

  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  const filename = `aulas_${safeDate(de, 'inicio')}_${safeDate(ate, 'fim')}.csv`

  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
