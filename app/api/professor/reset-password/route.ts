export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { hashPassword } from '@/lib/professor-auth'
import { createHash } from 'crypto'

export async function POST(request: Request) {
  const { token, newPassword } = await request.json()

  if (!token || !newPassword) {
    return Response.json({ error: 'Dados incompletos' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return Response.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(String(token)).digest('hex')
  const supabase  = createServiceClient()

  const { data: professor } = await supabase
    .from('professors')
    .select('id, reset_token_exp')
    .eq('reset_token_hash', tokenHash)
    .maybeSingle()

  if (!professor) {
    return Response.json({ error: 'Link inválido ou já utilizado.' }, { status: 400 })
  }

  if (!professor.reset_token_exp || new Date(professor.reset_token_exp) < new Date()) {
    return Response.json({ error: 'Este link expirou. Solicite um novo.' }, { status: 400 })
  }

  const { error } = await supabase.from('professors').update({
    portal_password_hash: hashPassword(newPassword),
    reset_token_hash:     null,
    reset_token_exp:      null,
  }).eq('id', professor.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
