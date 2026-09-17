export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email'
import { randomBytes, createHash } from 'crypto'
import { headers } from 'next/headers'

// Rate limit: máx 3 pedidos por IP em 15 min
const attempts = new Map<string, { count: number; windowStart: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const rec = attempts.get(ip)
  if (!rec || now - rec.windowStart > 15 * 60 * 1000) {
    attempts.set(ip, { count: 1, windowStart: now })
    return false
  }
  rec.count++
  return rec.count > 3
}

export async function POST(request: Request) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return Response.json({ ok: true }) // silencioso — não revelar que limitamos
  }

  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return Response.json({ error: 'Email obrigatório' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: professor } = await supabase
    .from('professors')
    .select('id, name, portal_email')
    .eq('portal_email', email.trim().toLowerCase())
    .maybeSingle()

  // Sempre retorna ok para não revelar se o email existe
  if (!professor) return Response.json({ ok: true })

  const rawToken  = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiry    = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hora

  await supabase.from('professors').update({
    reset_token_hash: tokenHash,
    reset_token_exp:  expiry,
  }).eq('id', professor.id)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gestao.desttra.com'
  const resetLink = `${baseUrl}/professor/redefinir-senha?token=${rawToken}`

  await sendEmail({
    to: professor.portal_email!,
    subject: 'Redefinição de senha — Portal Desttra',
    html: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 16px;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0"
           style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#1e6b40,#2da862);padding:28px 40px;text-align:center;">
          <p style="margin:0;color:white;font-size:20px;font-weight:800;">Desttra Educação</p>
          <p style="margin:6px 0 0;color:#a7d4b8;font-size:13px;">Redefinição de senha</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="margin:0 0 8px;color:#6b8c6b;font-size:13px;">Olá, <strong style="color:#0d2e1e;">${professor.name}</strong></p>
          <p style="margin:0 0 24px;color:#0d2e1e;font-size:15px;line-height:1.6;">
            Recebemos uma solicitação para redefinir a senha do seu acesso ao Portal do Professor.
          </p>
          <div style="text-align:center;padding:8px 0 24px;">
            <a href="${resetLink}"
               style="display:inline-block;background:#1e6b40;color:white;text-decoration:none;
                      padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;">
              Redefinir minha senha
            </a>
          </div>
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">
            <p style="margin:0;color:#78350f;font-size:13px;line-height:1.5;">
              ⚠️ Este link é válido por <strong>1 hora</strong>. Se não foi você quem solicitou, ignore este email — sua senha não será alterada.
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 40px;border-top:1px solid #e8f0e8;background:#fafcfa;text-align:center;">
          <p style="margin:0;color:#9dbfa9;font-size:11px;">Email automático · Desttra Educação · gestao@desttra.com</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  })

  return Response.json({ ok: true })
}
