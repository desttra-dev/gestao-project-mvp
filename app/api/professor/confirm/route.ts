export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { verifyProfessorToken } from '@/lib/professor-auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('professor_token')?.value
  if (!token) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const professorId = verifyProfessorToken(token)
  if (!professorId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { classId, status, reason, notes } = await request.json() as {
    classId: string
    status: 'realizada' | 'nao_houve'
    reason?: string
    notes?: string
  }

  const VALID_STATUS = ['realizada', 'nao_houve'] as const
  const VALID_REASON = ['aluno_faltou', 'professor_faltou', 'nao_devia_existir', 'outros'] as const

  if (!classId || !status) return Response.json({ error: 'Dados incompletos' }, { status: 400 })
  if (!VALID_STATUS.includes(status)) return Response.json({ error: 'Status inválido' }, { status: 400 })
  if (status === 'nao_houve' && !reason) return Response.json({ error: 'Motivo obrigatório' }, { status: 400 })
  if (reason && !VALID_REASON.includes(reason as typeof VALID_REASON[number])) {
    return Response.json({ error: 'Motivo inválido' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify the class belongs to this professor and has ended
  const { data: cls } = await supabase
    .from('classes')
    .select('id, ends_at, scheduled_at, teacher_id, confirmation_status')
    .eq('id', classId)
    .single()

  if (!cls || cls.teacher_id !== professorId) {
    return Response.json({ error: 'Aula não encontrada' }, { status: 404 })
  }

  if (cls.confirmation_status) {
    return Response.json({ error: 'Aula já confirmada' }, { status: 409 })
  }

  // Check the class has ended (ends_at or scheduled_at + 1h)
  const endTime = cls.ends_at
    ? new Date(cls.ends_at)
    : new Date(new Date(cls.scheduled_at).getTime() + 60 * 60 * 1000)

  if (endTime > new Date()) {
    return Response.json({ error: 'A aula ainda não terminou' }, { status: 400 })
  }

  const { error } = await supabase.from('classes').update({
    confirmation_status: status,
    confirmed_at: new Date().toISOString(),
    no_show_reason: status === 'nao_houve' ? reason : null,
    no_show_notes: status === 'nao_houve' && reason === 'outros' ? (notes ?? null) : null,
  }).eq('id', classId)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
