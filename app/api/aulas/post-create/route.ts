export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { createZoomMeeting } from '@/lib/zoom'
import { sendEmail } from '@/lib/email'
import { toBRT } from '@/lib/date-utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const levelLabels: Record<string, string> = {
  fundamental: 'Fundamental', medio: 'Médio',
  superior: 'Superior', internacional: 'Internacional',
}
const subjectLabels: Record<string, string> = {
  matematica: 'Matemática', fisica: 'Física', quimica: 'Química',
  portugues: 'Português', historia: 'História', geografia: 'Geografia',
  filosofia: 'Filosofia', redacao: 'Redação', sociologia: 'Sociologia',
}

function buildEmail({
  greeting, intro, detailsRows, dateRows, zoomUrl, isSeries,
}: {
  greeting: string
  intro: string
  detailsRows: string
  dateRows: string
  zoomUrl: string | null
  isSeries: boolean
}) {
  const zoomBlock = zoomUrl ? `
    <div style="text-align:center;padding:24px 0 16px;">
      <a href="${zoomUrl}" target="_blank"
         style="display:inline-block;background:#2D8CFF;color:white;text-decoration:none;
                padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
        Entrar no Zoom
      </a>
      <p style="margin:14px 0 4px;color:#6b8c6b;font-size:12px;">ou acesse pelo link:</p>
      <p style="margin:0;font-size:11px;word-break:break-all;">
        <a href="${zoomUrl}" style="color:#2D8CFF;text-decoration:underline;">${zoomUrl}</a>
      </p>
      <p style="margin:10px 0 0;color:#9dbfa9;font-size:11px;">
        Link permanente — válido para ${isSeries ? 'todas as aulas desta série' : 'esta aula'}
      </p>
    </div>` : ''

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
           style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#1e6b40,#2da862);padding:28px 40px;text-align:center;">
          <p style="margin:0;color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Desttra Educação</p>
          <p style="margin:6px 0 0;color:#a7d4b8;font-size:13px;">Confirmação de agendamento</p>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px;">
          <p style="margin:0 0 6px;color:#6b8c6b;font-size:13px;">${greeting}</p>
          <p style="margin:0 0 28px;color:#0d2e1e;font-size:15px;line-height:1.6;">${intro}</p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f8fdf9;border-radius:10px;padding:18px 20px;margin-bottom:28px;border:1px solid #e0f0e6;">
            ${detailsRows}
          </table>
          <p style="margin:0 0 12px;color:#0d2e1e;font-size:14px;font-weight:700;">
            ${isSeries ? 'Datas agendadas' : 'Data e horário'}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #d4e8d4;border-radius:10px;overflow:hidden;margin-bottom:8px;">
            ${dateRows}
          </table>
          ${zoomBlock}
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
}

export async function POST(request: Request) {
  const body = await request.json() as {
    classes: { id: string; scheduledAt: string; endsAt: string | null }[]
    repeatMode: 'none' | 'daily' | 'weekly'
    repeatUntil?: string
    durationMinutes: number
    topic: string
    professorEmail?: string | null
    professorName: string
    studentName: string
    studentEmail?: string | null
    responsibleEmail?: string | null
    subject?: string | null
    level: string
    notes?: string | null
  }

  const {
    classes, repeatMode, repeatUntil, durationMinutes, topic,
    professorEmail, professorName, studentName, studentEmail, responsibleEmail,
    subject, level, notes,
  } = body

  if (!classes?.length) return Response.json({ error: 'dados insuficientes' }, { status: 400 })

  console.log('[post-create] iniciando — classes:', classes.length, 'scheduledAt:', classes[0]?.scheduledAt)

  // ── 1. Criar reunião Zoom ─────────────────────────────────────────────────
  let joinUrl: string | null = null

  const meeting = await createZoomMeeting({
    topic,
    scheduledAt: classes[0].scheduledAt,
    durationMinutes,
    repeatMode,
    repeatUntil,
  })

  console.log('[post-create] createZoomMeeting resultado:', meeting ? `meetingId=${meeting.meetingId}` : 'null')

  if (meeting) {
    joinUrl = meeting.joinUrl
    try {
      const supabase = createServiceClient()
      const { error: upsertErr } = await supabase.from('classes').upsert(
        classes.map(c => ({ id: c.id, zoom_meeting_id: meeting.meetingId, zoom_join_url: meeting.joinUrl })),
        { onConflict: 'id' }
      )
      if (upsertErr) console.error('[post-create] upsert zoom falhou:', upsertErr.message)
      else console.log('[post-create] zoom_meeting_id salvo com sucesso:', meeting.meetingId)
    } catch (e) {
      console.error('[post-create] erro ao criar service client:', e)
    }
  }

  // ── 2. Montar blocos comuns do email ──────────────────────────────────────
  const isSeries    = classes.length > 1
  const levelLabel  = levelLabels[level] ?? level
  const subjectLabel = subject ? (subjectLabels[subject] ?? subject) : null

  const detailsRows = [
    `<tr><td style="padding:4px 0;color:#6b8c6b;font-size:13px;width:100px;">Aluno</td>
         <td style="padding:4px 0;color:#0d2e1e;font-size:13px;font-weight:600;">${studentName}</td></tr>`,
    `<tr><td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Professor</td>
         <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${professorName}</td></tr>`,
    `<tr><td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Nível</td>
         <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${levelLabel}</td></tr>`,
    subjectLabel
      ? `<tr><td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Matéria</td>
              <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${subjectLabel}</td></tr>`
      : '',
    notes
      ? `<tr><td style="padding:4px 0;color:#6b8c6b;font-size:13px;vertical-align:top;">Obs.</td>
              <td style="padding:4px 0;color:#4a5a4a;font-size:13px;">${notes}</td></tr>`
      : '',
  ].join('')

  const dateRows = classes.map((c, i) => {
    const start   = toBRT(c.scheduledAt)
    const dateStr = format(start, "EEEE, dd/MM/yyyy", { locale: ptBR })
    const startHr = format(start, 'HH:mm')
    const endHr   = c.endsAt ? format(toBRT(c.endsAt), 'HH:mm') : null
    const time    = endHr ? `${startHr} – ${endHr}` : startHr
    return `
      <tr style="border-bottom:1px solid #e8f0e8;">
        <td style="padding:8px 12px;color:#4a5a4a;font-size:13px;">${i + 1}.</td>
        <td style="padding:8px 12px;color:#0d2e1e;font-size:13px;text-transform:capitalize;">${dateStr}</td>
        <td style="padding:8px 12px;color:#1e6b40;font-size:13px;font-weight:600;">${time}</td>
      </tr>`
  }).join('')

  // ── 3. Enviar emails ──────────────────────────────────────────────────────
  const emailPromises: Promise<unknown>[] = []

  if (professorEmail) {
    emailPromises.push(sendEmail({
      to: professorEmail,
      subject: isSeries
        ? `${classes.length} aulas agendadas com ${studentName}`
        : `Nova aula agendada com ${studentName}`,
      html: buildEmail({
        greeting: `Olá, <strong style="color:#0d2e1e;">${professorName}</strong>`,
        intro: isSeries
          ? `Uma série de <strong>${classes.length} aulas</strong> foi agendada com o aluno <strong>${studentName}</strong>.`
          : `Uma nova aula foi agendada com o aluno <strong>${studentName}</strong>.`,
        detailsRows,
        dateRows,
        zoomUrl: joinUrl,
        isSeries,
      }),
    }))
  }

  const recipientEmail = studentEmail || responsibleEmail
  if (recipientEmail) {
    const isResponsible = !studentEmail && !!responsibleEmail
    emailPromises.push(sendEmail({
      to: recipientEmail,
      subject: isSeries
        ? `${classes.length} aulas agendadas com ${professorName}`
        : `Nova aula agendada com ${professorName}`,
      html: buildEmail({
        greeting: isResponsible
          ? `Olá, responsável de <strong style="color:#0d2e1e;">${studentName}</strong>`
          : `Olá, <strong style="color:#0d2e1e;">${studentName}</strong>`,
        intro: isSeries
          ? `Uma série de <strong>${classes.length} aulas</strong> foi agendada com o professor <strong>${professorName}</strong>.`
          : `Uma aula foi agendada com o professor <strong>${professorName}</strong>.`,
        detailsRows,
        dateRows,
        zoomUrl: joinUrl,
        isSeries,
      }),
    }))
  }

  // Gestão sempre recebe cópia
  emailPromises.push(sendEmail({
    to: 'gestao@desttra.com',
    subject: isSeries
      ? `[Nova Série] ${studentName} — ${classes.length} aulas com ${professorName}`
      : `[Nova Aula] ${studentName} com ${professorName}`,
    html: buildEmail({
      greeting: `Gestão Desttra`,
      intro: isSeries
        ? `Uma série de <strong>${classes.length} aulas</strong> foi agendada. Aluno: <strong>${studentName}</strong> · Prof.: <strong>${professorName}</strong>.`
        : `Uma nova aula foi agendada. Aluno: <strong>${studentName}</strong> · Prof.: <strong>${professorName}</strong>.`,
      detailsRows,
      dateRows,
      zoomUrl: joinUrl,
      isSeries,
    }),
  }))

  await Promise.allSettled(emailPromises)

  return Response.json({ ok: true, joinUrl })
}
