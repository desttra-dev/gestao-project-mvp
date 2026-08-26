import { createClient } from '@/lib/supabase/server'
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
  if (!secret) return false
  const message = `v0:${timestamp}:${body}`
  const hash = createHmac('sha256', secret).update(message).digest('hex')
  return `v0=${hash}` === signature
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const timestamp = request.headers.get('x-zm-request-timestamp') ?? ''
  const signature = request.headers.get('x-zm-signature') ?? ''

  if (!verifyZoomSignature(rawBody, timestamp, signature)) {
    return Response.json({ error: 'signature inválida' }, { status: 401 })
  }

  const data = JSON.parse(rawBody) as {
    event: string
    payload?: {
      plainToken?: string
      object?: {
        id?: number | string
        share_url?: string
        host_email?: string
      }
    }
  }

  // URL validation handshake
  if (data.event === 'endpoint.url_validation' && data.payload?.plainToken) {
    const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN!
    const encryptedToken = createHmac('sha256', secret)
      .update(data.payload.plainToken)
      .digest('hex')
    return Response.json({ plainToken: data.payload.plainToken, encryptedToken })
  }

  if (data.event !== 'recording.completed') {
    return Response.json({ ok: true, skipped: true })
  }

  const meetingId   = String(data.payload?.object?.id ?? '')
  const shareUrl    = data.payload?.object?.share_url ?? ''
  if (!meetingId || !shareUrl) return Response.json({ ok: true, skipped: true })

  const supabase = await createClient()

  const { data: aula } = await supabase
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

  if (!aula) return Response.json({ ok: true, skipped: true })

  const student   = aula.student as { name: string; email: string | null; responsible_name: string | null; responsible_email: string | null } | null
  const professor = aula.professor as { name: string } | null

  const recipientEmail = student?.responsible_email || student?.email
  const recipientName  = student?.responsible_email
    ? (student.responsible_name ?? student.name)
    : student?.name ?? 'Aluno'

  const start       = toBRT(aula.scheduled_at as string)
  const dateStr     = format(start, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
  const subjectLabel = aula.subject ? (subjectLabels[aula.subject as string] ?? aula.subject) : null
  const levelLabel   = levelLabels[aula.level as string] ?? aula.level

  const recordingHtml = (greeting: string, intro: string) => `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f7f5;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
           style="background:white;border-radius:12px;overflow:hidden;border:1px solid #d4e8d4;">
      <tr>
        <td style="background:#1e6b40;padding:24px 32px;">
          <p style="margin:0;color:white;font-size:20px;font-weight:700;">Desttra Educação</p>
          <p style="margin:4px 0 0;color:#a7d4b8;font-size:13px;">Gravação de aula disponível</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 6px;color:#6b8c6b;font-size:13px;">${greeting}</p>
          <p style="margin:0 0 24px;color:#0d2e1e;font-size:15px;line-height:1.5;">${intro}</p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f5f7f5;border-radius:8px;padding:16px;margin-bottom:24px;">
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
          <div style="text-align:center;padding:8px 0 8px;">
            <a href="${shareUrl}" target="_blank"
               style="display:inline-block;background:#1e6b40;color:white;text-decoration:none;
                      padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">
              ▶ Assistir Gravação
            </a>
          </div>
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px 16px;margin-top:12px;">
            <p style="margin:0;color:#7a5800;font-size:13px;line-height:1.5;">
              <strong>⚠️ Atenção:</strong> esta gravação fica disponível por <strong>15 dias</strong>.
              Se quiser guardar a aula, acesse o link acima e faça o download no seu computador antes que ela expire.
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px;border-top:1px solid #e8f0e8;background:#fafcfa;">
          <p style="margin:0;color:#9dbfa9;font-size:11px;">
            Email automático da plataforma Desttra. Dúvidas: gestao@desttra.com
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

  return Response.json({ ok: true })
}
