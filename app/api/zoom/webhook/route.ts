export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email'
import { toBRT } from '@/lib/date-utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createHmac } from 'crypto'

const subjectLabels: Record<string, string> = {
  matematica: 'Matemática', fisica: 'Física', quimica: 'Química',
  portugues: 'Português', historia: 'História', geografia: 'Geografia',
  filosofia: 'Filosofia', redacao: 'Redação', sociologia: 'Sociologia',
}
const levelLabels: Record<string, string> = {
  fundamental: 'Fundamental', medio: 'Médio', superior: 'Superior', internacional: 'Internacional',
}

function verifyZoomSignature(body: string, timestamp: string, signature: string): boolean {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN
  if (!secret) {
    console.warn('[zoom-webhook] ZOOM_WEBHOOK_SECRET_TOKEN não definido')
    return false
  }
  const message = `v0:${timestamp}:${body}`
  const hash = createHmac('sha256', secret).update(message).digest('hex')
  const expected = `v0=${hash}`
  const ok = expected === signature
  if (!ok) console.warn('[zoom-webhook] Assinatura inválida. expected:', expected, 'got:', signature)
  return ok
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  let data: {
    event: string
    payload?: {
      plainToken?: string
      object?: {
        id?: number | string
        uuid?: string
        share_url?: string
        recording_play_passcode?: string
        host_email?: string
        topic?: string
      }
    }
  }

  try {
    data = JSON.parse(rawBody)
  } catch {
    console.error('[zoom-webhook] Body não é JSON válido:', rawBody.slice(0, 200))
    return Response.json({ error: 'body inválido' }, { status: 400 })
  }

  console.log('[zoom-webhook] evento recebido:', data.event)

  // URL validation handshake — responde ANTES de verificar assinatura
  if (data.event === 'endpoint.url_validation' && data.payload?.plainToken) {
    const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN
    if (!secret) return Response.json({ error: 'ZOOM_WEBHOOK_SECRET_TOKEN não configurado' }, { status: 500 })
    const encryptedToken = createHmac('sha256', secret)
      .update(data.payload.plainToken)
      .digest('hex')
    console.log('[zoom-webhook] URL validation respondida')
    return Response.json({ plainToken: data.payload.plainToken, encryptedToken })
  }

  // Para todos os outros eventos, verifica assinatura
  const timestamp = request.headers.get('x-zm-request-timestamp') ?? ''
  const signature = request.headers.get('x-zm-signature') ?? ''
  if (!verifyZoomSignature(rawBody, timestamp, signature)) {
    return Response.json({ error: 'signature inválida' }, { status: 401 })
  }

  if (data.event !== 'recording.completed') {
    console.log('[zoom-webhook] evento ignorado:', data.event)
    return Response.json({ ok: true, skipped: true })
  }

  const meetingId  = String(data.payload?.object?.id ?? '')
  const shareUrl   = data.payload?.object?.share_url ?? ''
  const passcode   = data.payload?.object?.recording_play_passcode ?? ''

  console.log('[zoom-webhook] recording.completed — meetingId:', meetingId, 'shareUrl:', shareUrl ? 'presente' : 'ausente', 'passcode:', passcode ? 'presente' : 'ausente')

  if (!meetingId || !shareUrl) {
    console.warn('[zoom-webhook] meetingId ou shareUrl ausentes no payload')
    return Response.json({ ok: true, skipped: true })
  }

  // Usa service client para ignorar RLS (webhook não tem sessão de usuário)
  let supabase
  try {
    supabase = createServiceClient()
  } catch (err) {
    console.error('[zoom-webhook] Falha ao criar service client:', err)
    // Fallback: endpoint fica acessível mas não envia email
    return Response.json({ error: 'supabase não configurado' }, { status: 500 })
  }

  const { data: aula, error: dbError } = await supabase
    .from('classes')
    .select(`
      *,
      student:students(name, email, responsible_name, responsible_email),
      professor:professors(name)
    `)
    .eq('zoom_meeting_id', meetingId)
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .single()

  if (dbError) {
    console.warn('[zoom-webhook] Aula não encontrada para meetingId:', meetingId, 'erro:', dbError.message)
  }

  if (!aula) {
    console.warn('[zoom-webhook] Nenhuma aula com zoom_meeting_id =', meetingId)
    return Response.json({ ok: true, skipped: true })
  }

  console.log('[zoom-webhook] Aula encontrada:', aula.id, '— enviando emails...')

  const student   = aula.student as { name: string; email: string | null; responsible_name: string | null; responsible_email: string | null } | null
  const professor = aula.professor as { name: string } | null

  const recipientEmail = student?.responsible_email || student?.email
  const recipientName  = student?.responsible_email
    ? (student.responsible_name ?? student.name)
    : student?.name ?? 'Aluno'

  const start        = toBRT(aula.scheduled_at as string)
  const dateStr      = format(start, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
  const subjectLabel = aula.subject ? (subjectLabels[aula.subject as string] ?? aula.subject) : null
  const levelLabel   = levelLabels[aula.level as string] ?? aula.level

  const recordingHtml = (greeting: string, intro: string) => `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
           style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#1e6b40,#2da862);padding:28px 40px;text-align:center;">
          <p style="margin:0;color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Desttra Educação</p>
          <p style="margin:6px 0 0;color:#a7d4b8;font-size:13px;">Gravação de aula disponível</p>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px;">
          <p style="margin:0 0 6px;color:#6b8c6b;font-size:13px;">${greeting}</p>
          <p style="margin:0 0 28px;color:#0d2e1e;font-size:15px;line-height:1.6;">${intro}</p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f8fdf9;border-radius:10px;padding:18px 20px;margin-bottom:28px;border:1px solid #e0f0e6;">
            <tr>
              <td style="padding:4px 0;color:#6b8c6b;font-size:13px;width:100px;">Aluno</td>
              <td style="padding:4px 0;color:#0d2e1e;font-size:13px;font-weight:600;">${student?.name ?? '—'}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Professor</td>
              <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${professor?.name ?? '—'}</td>
            </tr>
            ${subjectLabel ? `<tr>
              <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Matéria</td>
              <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${subjectLabel}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Nível</td>
              <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${levelLabel}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b8c6b;font-size:13px;vertical-align:top;">Data</td>
              <td style="padding:4px 0;color:#0d2e1e;font-size:13px;text-transform:capitalize;">${dateStr}</td>
            </tr>
          </table>
          <div style="text-align:center;padding:8px 0 16px;">
            <a href="${shareUrl}" target="_blank"
               style="display:inline-block;background:#1e6b40;color:white;text-decoration:none;
                      padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
              ▶ Assistir Gravação
            </a>
            ${passcode ? `
            <div style="margin:16px auto 4px;display:inline-block;background:#f8fdf9;border:1px solid #bbf7d0;border-radius:8px;padding:10px 20px;">
              <p style="margin:0 0 2px;color:#6b8c6b;font-size:11px;">Senha de acesso</p>
              <p style="margin:0;color:#0d2e1e;font-size:20px;font-weight:800;letter-spacing:4px;">${passcode}</p>
            </div>` : ''}
            <p style="margin:14px 0 4px;color:#6b8c6b;font-size:12px;">ou acesse pelo link:</p>
            <p style="margin:0;font-size:11px;word-break:break-all;">
              <a href="${shareUrl}" style="color:#1e6b40;text-decoration:underline;">${shareUrl}</a>
            </p>
          </div>
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:14px 18px;margin-top:8px;">
            <p style="margin:0;color:#7a5800;font-size:13px;line-height:1.5;">
              <strong>⚠️ Atenção:</strong> esta gravação fica disponível por <strong>15 dias</strong>.
              Se quiser guardar a aula, acesse o link acima e faça o download antes que ela expire.
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 40px;border-top:1px solid #e8f0e8;background:#fafcfa;text-align:center;">
          <p style="margin:0;color:#9dbfa9;font-size:11px;">
            Email automático da plataforma Desttra &nbsp;·&nbsp; Dúvidas: gestao@desttra.com
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`

  const emailJobs: Promise<unknown>[] = []

  if (recipientEmail) {
    emailJobs.push(sendEmail({
      to: recipientEmail,
      subject: `Gravação disponível — aula${subjectLabel ? ` de ${subjectLabel}` : ''} com ${professor?.name ?? 'professor'}`,
      html: recordingHtml(
        `Olá, <strong style="color:#0d2e1e;">${recipientName}</strong>`,
        `A gravação da aula de <strong>${student?.name ?? 'seu aluno'}</strong> já está disponível.`,
      ),
    }))
  } else {
    console.warn('[zoom-webhook] Nenhum email de destinatário para aula:', aula.id)
  }

  emailJobs.push(sendEmail({
    to: 'gestao@desttra.com',
    subject: `[Gravação] ${student?.name ?? 'Aluno'} — ${dateStr}`,
    html: recordingHtml(
      `Gestão Desttra`,
      `A gravação da aula de <strong>${student?.name ?? '—'}</strong> com <strong>${professor?.name ?? '—'}</strong> está disponível.`,
    ),
  }))

  await Promise.allSettled(emailJobs)

  console.log('[zoom-webhook] Emails enviados para aula:', aula.id)
  return Response.json({ ok: true })
}

export async function GET() {
  return new Response(null, { status: 405 })
}
