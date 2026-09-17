export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { verifyProfessorToken, verifyPassword, hashPassword } from '@/lib/professor-auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('professor_token')?.value
  if (!token) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const professorId = verifyProfessorToken(token)
  if (!professorId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { currentPassword, newPassword } = await request.json()
  if (!currentPassword || !newPassword) {
    return Response.json({ error: 'Campos obrigatórios' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return Response.json({ error: 'Nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: professor } = await supabase
    .from('professors')
    .select('portal_password_hash')
    .eq('id', professorId)
    .single()

  if (!professor?.portal_password_hash) {
    return Response.json({ error: 'Professor não encontrado' }, { status: 404 })
  }

  if (!verifyPassword(currentPassword, professor.portal_password_hash)) {
    return Response.json({ error: 'Senha atual incorreta' }, { status: 401 })
  }

  const { error } = await supabase
    .from('professors')
    .update({ portal_password_hash: hashPassword(newPassword) })
    .eq('id', professorId)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
