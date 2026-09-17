export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { hashPassword } from '@/lib/professor-auth'

export async function POST(request: Request) {
  // Verify admin session
  const adminClient = await createClient()
  const { data: { user } } = await adminClient.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { professorId, portalEmail, newPassword } = await request.json()
  if (!professorId) return Response.json({ error: 'professorId obrigatório' }, { status: 400 })

  const supabase = createServiceClient()
  const update: Record<string, string> = {}

  if (portalEmail) update.portal_email = portalEmail.trim().toLowerCase()
  if (newPassword) {
    if (newPassword.length < 6) return Response.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    update.portal_password_hash = hashPassword(newPassword)
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'Nada para atualizar' }, { status: 400 })
  }

  const { error } = await supabase.from('professors').update(update).eq('id', professorId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
