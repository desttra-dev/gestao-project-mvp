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

  const { portalEmail, phone } = await request.json()

  const updates: Record<string, string> = {}
  if (portalEmail !== undefined) {
    if (portalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(portalEmail)) {
      return Response.json({ error: 'Email inválido' }, { status: 400 })
    }
    updates.portal_email = portalEmail
  }
  if (phone !== undefined) updates.phone = phone

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // If changing portal_email, check uniqueness
  if (updates.portal_email) {
    const { data: existing } = await supabase
      .from('professors')
      .select('id')
      .eq('portal_email', updates.portal_email)
      .neq('id', professorId)
      .maybeSingle()

    if (existing) {
      return Response.json({ error: 'Este email já está em uso por outro professor' }, { status: 409 })
    }
  }

  const { error } = await supabase
    .from('professors')
    .update(updates)
    .eq('id', professorId)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
