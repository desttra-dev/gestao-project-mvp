export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { verifyPassword, signProfessorToken } from '@/lib/professor-auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  if (!email || !password) {
    return Response.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: professor } = await supabase
    .from('professors')
    .select('id, name, portal_email, portal_password_hash')
    .eq('portal_email', email.trim().toLowerCase())
    .single()

  if (!professor || !professor.portal_password_hash) {
    return Response.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  if (!verifyPassword(password, professor.portal_password_hash)) {
    return Response.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const token = signProfessorToken(professor.id)
  const cookieStore = await cookies()
  cookieStore.set('professor_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })

  return Response.json({ ok: true, name: professor.name })
}
