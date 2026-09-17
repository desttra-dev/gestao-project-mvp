export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { verifyPassword, signProfessorToken } from '@/lib/professor-auth'
import { cookies, headers } from 'next/headers'

// In-memory rate limit: ip → { count, windowStart }
const attempts = new Map<string, { count: number; windowStart: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000 // 15 min

function isRateLimited(ip: string): boolean {
  const now  = Date.now()
  const rec  = attempts.get(ip)
  if (!rec || now - rec.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now })
    return false
  }
  rec.count++
  return rec.count > MAX_ATTEMPTS
}

function clearRateLimit(ip: string) {
  attempts.delete(ip)
}

export async function POST(request: Request) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (isRateLimited(ip)) {
    return Response.json({ error: 'Muitas tentativas. Aguarde 15 minutos.' }, { status: 429 })
  }

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

  clearRateLimit(ip)
  const token = signProfessorToken(professor.id)
  const cookieStore = await cookies()
  cookieStore.set('professor_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })

  return Response.json({ ok: true, name: professor.name })
}
