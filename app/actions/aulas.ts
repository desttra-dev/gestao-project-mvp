'use server'

import { createCalendarEvent } from '@/lib/google-calendar'
import { sendEmail } from '@/lib/email'
import { createZoomMeeting } from '@/lib/zoom'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const levelLabels: Record<string, string> = {
  fundamental: 'Fundamental',
  medio: 'Médio',
  superior: 'Superior',
  internacional: 'Internacional',
}

const subjectLabels: Record<string, string> = {
  matematica: 'Matemática', fisica: 'Física', quimica: 'Química', portugues: 'Português',
  historia: 'História', geografia: 'Geografia', filosofia: 'Filosofia',
  redacao: 'Redação', sociologia: 'Sociologia',
}

export async function notifyProfessorNewAulas({
  professorEmail,
  professorName,
  studentName,
  level,
  subject,
  notes,
  dates,
}: {
  professorEmail: string
  professorName: string
  studentName: string
  level: string
  subject?: string | null
  notes?: string | null
  dates: { scheduledAt: string; endsAt: string | null }[]
}) {
  console.log('[notifyProfessorNewAulas] enviando para:', professorEmail)
  const isSeries = dates.length > 1
  const levelLabel   = levelLabels[level]   ?? level
  const subjectLabel = subject ? (subjectLabels[subject] ?? subject) : null

  const dateRows = dates
    .map((d, i) => {
      const start = new Date(d.scheduledAt)
      const startStr = format(start, "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
      const endStr   = d.endsAt ? format(new Date(d.endsAt), 'HH:mm') : null
      const time     = endStr ? `${format(start, 'HH:mm')} – ${endStr}` : format(start, 'HH:mm')
      return `
        <tr style="border-bottom:1px solid #e8f0e8;">
          <td style="padding:8px 12px;color:#4a5a4a;font-size:13px;">${i + 1}.</td>
          <td style="padding:8px 12px;color:#0d2e1e;font-size:13px;text-transform:capitalize;">${startStr}</td>
          <td style="padding:8px 12px;color:#1e6b40;font-size:13px;font-weight:600;">${time}</td>
        </tr>`
    })
    .join('')

  const subject_line = isSeries
    ? `${dates.length} aulas agendadas com ${studentName}`
    : `Nova aula agendada com ${studentName}`

  const intro = isSeries
    ? `Uma série de <strong>${dates.length} aulas</strong> foi agendada com o aluno <strong>${studentName}</strong>.`
    : `Uma nova aula foi agendada com o aluno <strong>${studentName}</strong>.`

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f7f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;border:1px solid #d4e8d4;">

        <!-- Header -->
        <tr>
          <td style="background:#1e6b40;padding:24px 32px;">
            <p style="margin:0;color:white;font-size:20px;font-weight:700;">Desttra Educação</p>
            <p style="margin:4px 0 0;color:#a7d4b8;font-size:13px;">Agendamento de aulas</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 6px;color:#6b8c6b;font-size:13px;">Olá, <strong style="color:#0d2e1e;">${professorName}</strong></p>
            <p style="margin:0 0 24px;color:#0d2e1e;font-size:15px;line-height:1.5;">${intro}</p>

            <!-- Detalhes -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f5;border-radius:8px;padding:16px;margin-bottom:24px;">
              <tr>
                <td style="padding:4px 0;color:#6b8c6b;font-size:13px;width:100px;">Aluno</td>
                <td style="padding:4px 0;color:#0d2e1e;font-size:13px;font-weight:600;">${studentName}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Nível</td>
                <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${levelLabel}</td>
              </tr>
              ${subjectLabel ? `
              <tr>
                <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Matéria</td>
                <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${subjectLabel}</td>
              </tr>` : ''}
              ${notes ? `
              <tr>
                <td style="padding:4px 0;color:#6b8c6b;font-size:13px;vertical-align:top;">Obs.</td>
                <td style="padding:4px 0;color:#4a5a4a;font-size:13px;">${notes}</td>
              </tr>` : ''}
            </table>

            <!-- Datas -->
            <p style="margin:0 0 10px;color:#0d2e1e;font-size:14px;font-weight:600;">
              ${isSeries ? 'Datas agendadas' : 'Data e horário'}
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d4e8d4;border-radius:8px;overflow:hidden;">
              ${dateRows}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e8f0e8;background:#fafcfa;">
            <p style="margin:0;color:#9dbfa9;font-size:11px;">Este é um email automático enviado pela plataforma Desttra. Em caso de dúvidas, entre em contato com gestao@desttra.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await sendEmail({ to: professorEmail, subject: subject_line, html })
}

export async function setupAulaZoom({
  classes,
  repeatMode,
  repeatUntil,
  durationMinutes,
  topic,
  professorEmail,
  professorName,
  studentName,
  studentEmail,
  responsibleEmail,
  subject,
  level,
}: {
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
}) {
  const meeting = await createZoomMeeting({
    topic,
    scheduledAt: classes[0].scheduledAt,
    durationMinutes,
    repeatMode,
    repeatUntil,
  })
  if (!meeting) return

  // Persiste zoom_join_url em todas as aulas da série
  const supabase = await createClient()
  await supabase.from('classes').upsert(
    classes.map(c => ({ id: c.id, zoom_meeting_id: meeting.meetingId, zoom_join_url: meeting.joinUrl })),
    { onConflict: 'id' }
  )

  const isSeries    = classes.length > 1
  const levelLabel  = levelLabels[level]  ?? level
  const subjectLabel = subject ? (subjectLabels[subject] ?? subject) : null

  const dateRows = classes.map((c, i) => {
    const start    = new Date(c.scheduledAt)
    const dateStr  = format(start, "EEEE, dd/MM/yyyy", { locale: ptBR })
    const startHr  = format(start, 'HH:mm')
    const endHr    = c.endsAt ? format(new Date(c.endsAt), 'HH:mm') : null
    const timeStr  = endHr ? `${startHr} – ${endHr}` : startHr
    return `
      <tr style="border-bottom:1px solid #e8f0e8;">
        <td style="padding:7px 12px;color:#4a5a4a;font-size:13px;">${i + 1}.</td>
        <td style="padding:7px 12px;color:#0d2e1e;font-size:13px;text-transform:capitalize;">${dateStr}</td>
        <td style="padding:7px 12px;color:#1e6b40;font-size:13px;font-weight:600;">${timeStr}</td>
      </tr>`
  }).join('')

  const zoomButton = `
    <a href="${meeting.joinUrl}" target="_blank"
       style="display:inline-block;background:#2D8CFF;color:white;text-decoration:none;
              padding:12px 28px;border-radius:8px;font-size:15px;font-weight:700;margin:8px 0;">
      Entrar no Zoom
    </a>
    <p style="margin:6px 0 0;color:#9dbfa9;font-size:11px;">
      Link permanente — funciona para ${isSeries ? 'todas as aulas desta série' : 'esta aula'}
    </p>`

  const detailsBlock = `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f5f7f5;border-radius:8px;padding:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;color:#6b8c6b;font-size:13px;width:100px;">Aluno</td>
        <td style="padding:4px 0;color:#0d2e1e;font-size:13px;font-weight:600;">${studentName}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Professor</td>
        <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${professorName}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Nível</td>
        <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${levelLabel}</td>
      </tr>
      ${subjectLabel ? `
      <tr>
        <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Matéria</td>
        <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${subjectLabel}</td>
      </tr>` : ''}
    </table>`

  const datesBlock = `
    <p style="margin:0 0 10px;color:#0d2e1e;font-size:14px;font-weight:600;">
      ${isSeries ? 'Datas agendadas' : 'Data e horário'}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #d4e8d4;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      ${dateRows}
    </table>`

  const footer = `
    <tr>
      <td style="padding:16px 32px;border-top:1px solid #e8f0e8;background:#fafcfa;">
        <p style="margin:0;color:#9dbfa9;font-size:11px;">
          Email automático da plataforma Desttra. Dúvidas: gestao@desttra.com
        </p>
      </td>
    </tr>`

  const buildHtml = (greeting: string, intro: string) => `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f7f5;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
           style="background:white;border-radius:12px;overflow:hidden;border:1px solid #d4e8d4;">
      <tr>
        <td style="background:#1e6b40;padding:24px 32px;">
          <p style="margin:0;color:white;font-size:20px;font-weight:700;">Desttra Educação</p>
          <p style="margin:4px 0 0;color:#a7d4b8;font-size:13px;">Reunião Zoom agendada</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 6px;color:#6b8c6b;font-size:13px;">${greeting}</p>
          <p style="margin:0 0 24px;color:#0d2e1e;font-size:15px;line-height:1.5;">${intro}</p>
          ${detailsBlock}
          ${datesBlock}
          <div style="text-align:center;padding:8px 0 16px;">${zoomButton}</div>
        </td>
      </tr>
      ${footer}
    </table>
  </td></tr>
</table>
</body></html>`

  const emailSubject = isSeries
    ? `Zoom agendado — ${classes.length} aulas com ${studentName}`
    : `Zoom agendado — aula com ${studentName}`

  const promises: Promise<unknown>[] = []

  if (professorEmail) {
    promises.push(sendEmail({
      to: professorEmail,
      subject: emailSubject,
      html: buildHtml(
        `Olá, <strong style="color:#0d2e1e;">${professorName}</strong>`,
        isSeries
          ? `A série de <strong>${classes.length} aulas</strong> com o aluno <strong>${studentName}</strong> foi agendada com reunião Zoom criada automaticamente.`
          : `A aula com o aluno <strong>${studentName}</strong> foi agendada com reunião Zoom criada automaticamente.`,
      ),
    }))
  }

  const recipientEmail = studentEmail || responsibleEmail
  if (recipientEmail) {
    const greeting = responsibleEmail && !studentEmail
      ? `Olá, responsável de <strong style="color:#0d2e1e;">${studentName}</strong>`
      : `Olá, <strong style="color:#0d2e1e;">${studentName}</strong>`

    promises.push(sendEmail({
      to: recipientEmail,
      subject: isSeries
        ? `Zoom agendado — ${classes.length} aulas com ${professorName}`
        : `Zoom agendado — aula com ${professorName}`,
      html: buildHtml(
        greeting,
        isSeries
          ? `Uma série de <strong>${classes.length} aulas</strong> foi agendada com o professor <strong>${professorName}</strong>.`
          : `Sua aula com o professor <strong>${professorName}</strong> foi agendada.`,
      ),
    }))
  }

  await Promise.allSettled(promises)
}

export async function cancelAulaComEmail(aulaId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: aula, error: fetchError } = await supabase
    .from('classes')
    .select('*, student:students(name), professor:professors(name, email)')
    .eq('id', aulaId)
    .single()

  if (fetchError || !aula) return { error: fetchError?.message ?? 'Aula não encontrada' }

  const { error: updateError } = await supabase
    .from('classes')
    .update({ status: 'cancelada' })
    .eq('id', aulaId)

  if (updateError) return { error: updateError.message }

  const professor = aula.professor as { name: string; email: string | null } | null
  if (professor?.email) {
    const studentName = (aula.student as { name: string } | null)?.name ?? 'Aluno'
    const scheduledAt = aula.scheduled_at as string
    const dateStr = format(new Date(scheduledAt), "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f7f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;border:1px solid #fcd4d4;">
        <tr>
          <td style="background:#b91c1c;padding:24px 32px;">
            <p style="margin:0;color:white;font-size:20px;font-weight:700;">Desttra Educação</p>
            <p style="margin:4px 0 0;color:#fca5a5;font-size:13px;">Cancelamento de aula</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 6px;color:#6b8c6b;font-size:13px;">Olá, <strong style="color:#0d2e1e;">${professor.name}</strong></p>
            <p style="margin:0 0 24px;color:#0d2e1e;font-size:15px;line-height:1.5;">
              A aula com o aluno <strong>${studentName}</strong> foi <strong style="color:#b91c1c;">cancelada</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;border-radius:8px;padding:16px;border:1px solid #fcd4d4;">
              <tr>
                <td style="padding:4px 0;color:#6b8c6b;font-size:13px;width:100px;">Aluno</td>
                <td style="padding:4px 0;color:#0d2e1e;font-size:13px;font-weight:600;">${studentName}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Data</td>
                <td style="padding:4px 0;color:#b91c1c;font-size:13px;font-weight:600;text-transform:capitalize;">${dateStr}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e8f0e8;background:#fafcfa;">
            <p style="margin:0;color:#9dbfa9;font-size:11px;">Este é um email automático enviado pela plataforma Desttra. Em caso de dúvidas, entre em contato com gestao@desttra.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    sendEmail({
      to: professor.email,
      subject: `Aula cancelada — ${studentName} em ${format(new Date(scheduledAt), 'dd/MM/yyyy')}`,
      html,
    }).catch(() => {})
  }

  return { error: null }
}

export async function createAulaGoogleEvent({
  studentName,
  professorName,
  scheduledAt,
  level,
  notes,
}: {
  studentName: string
  professorName: string
  scheduledAt: string
  level: string
  notes?: string
}) {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const lines = [
    `Aluno: ${studentName}`,
    `Professor: ${professorName}`,
    notes ? `Obs: ${notes}` : '',
  ].filter(Boolean)

  await createCalendarEvent({
    title: `Aula ${levelLabels[level] ?? level} — ${studentName}`,
    description: lines.join('\n'),
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
  })
}
