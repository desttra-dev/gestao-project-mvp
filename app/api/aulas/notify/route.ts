import { sendEmail } from '@/lib/email'
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

export async function POST(request: Request) {
  const body = await request.json() as {
    professorEmail: string
    professorName: string
    studentName: string
    level: string
    subject?: string | null
    notes?: string | null
    dates: { scheduledAt: string; endsAt: string | null }[]
  }

  const { professorEmail, professorName, studentName, level, subject, notes, dates } = body
  if (!professorEmail || !dates?.length) {
    return Response.json({ error: 'dados insuficientes' }, { status: 400 })
  }

  const isSeries    = dates.length > 1
  const levelLabel  = levelLabels[level]  ?? level
  const subjectLabel = subject ? (subjectLabels[subject] ?? subject) : null

  const dateRows = dates.map((d, i) => {
    const start   = new Date(d.scheduledAt)
    const dateStr = format(start, "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    const endStr  = d.endsAt ? format(new Date(d.endsAt), 'HH:mm') : null
    const time    = endStr ? `${format(start, 'HH:mm')} – ${endStr}` : format(start, 'HH:mm')
    return `
      <tr style="border-bottom:1px solid #e8f0e8;">
        <td style="padding:8px 12px;color:#4a5a4a;font-size:13px;">${i + 1}.</td>
        <td style="padding:8px 12px;color:#0d2e1e;font-size:13px;text-transform:capitalize;">${dateStr}</td>
        <td style="padding:8px 12px;color:#1e6b40;font-size:13px;font-weight:600;">${time}</td>
      </tr>`
  }).join('')

  const html = `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f7f5;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
           style="background:white;border-radius:12px;overflow:hidden;border:1px solid #d4e8d4;">
      <tr>
        <td style="background:#1e6b40;padding:24px 32px;">
          <p style="margin:0;color:white;font-size:20px;font-weight:700;">Desttra Educação</p>
          <p style="margin:4px 0 0;color:#a7d4b8;font-size:13px;">Agendamento de aulas</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 6px;color:#6b8c6b;font-size:13px;">
            Olá, <strong style="color:#0d2e1e;">${professorName}</strong>
          </p>
          <p style="margin:0 0 24px;color:#0d2e1e;font-size:15px;line-height:1.5;">
            ${isSeries
              ? `Uma série de <strong>${dates.length} aulas</strong> foi agendada com o aluno <strong>${studentName}</strong>.`
              : `Uma nova aula foi agendada com o aluno <strong>${studentName}</strong>.`}
          </p>

          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f5f7f5;border-radius:8px;padding:16px;margin-bottom:24px;">
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

          <p style="margin:0 0 10px;color:#0d2e1e;font-size:14px;font-weight:600;">
            ${isSeries ? 'Datas agendadas' : 'Data e horário'}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #d4e8d4;border-radius:8px;overflow:hidden;">
            ${dateRows}
          </table>
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

  await sendEmail({
    to: professorEmail,
    subject: isSeries
      ? `${dates.length} aulas agendadas com ${studentName}`
      : `Nova aula agendada com ${studentName}`,
    html,
  })

  return Response.json({ ok: true })
}
