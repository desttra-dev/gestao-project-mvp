export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
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

function esc(s: string | null | undefined): string {
  return (s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function toBRT(iso: string) {
  return new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000)
}

function reminderEmail({
  greeting, intro, studentName, professorName, levelLabel, subjectLabel, dateStr, timeStr, zoomUrl,
}: {
  greeting: string; intro: string; studentName: string; professorName: string
  levelLabel: string; subjectLabel: string | null; dateStr: string; timeStr: string; zoomUrl: string | null
}) {
  const zoomBlock = zoomUrl ? `
    <div style="text-align:center;padding:20px 0 8px;">
      <a href="${esc(zoomUrl)}" target="_blank"
         style="display:inline-block;background:#2D8CFF;color:white;text-decoration:none;
                padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;">
        Entrar no Zoom
      </a>
      <p style="margin:12px 0 0;font-size:11px;word-break:break-all;">
        <a href="${esc(zoomUrl)}" style="color:#2D8CFF;text-decoration:underline;">${esc(zoomUrl)}</a>
      </p>
    </div>` : `
    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px 16px;margin-top:16px;">
      <p style="margin:0;color:#7a5800;font-size:13px;">
        ⚠️ Link do Zoom ainda não disponível. Entre em contato com a gestão.
      </p>
    </div>`

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#1e6b40,#2da862);padding:24px 36px;text-align:center;">
          <p style="margin:0;color:white;font-size:20px;font-weight:800;">Desttra Educação</p>
          <p style="margin:6px 0 0;color:#a7d4b8;font-size:13px;">🔔 Lembrete de aula</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 36px;">
          <p style="margin:0 0 6px;color:#6b8c6b;font-size:13px;">${greeting}</p>
          <p style="margin:0 0 20px;color:#0d2e1e;font-size:16px;font-weight:700;line-height:1.4;">
            ${intro}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f8fdf9;border-radius:10px;padding:16px 20px;margin-bottom:20px;border:1px solid #e0f0e6;">
            <tr>
              <td style="padding:4px 0;color:#6b8c6b;font-size:13px;width:90px;">Aluno</td>
              <td style="padding:4px 0;color:#0d2e1e;font-size:13px;font-weight:600;">${esc(studentName)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Professor</td>
              <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${esc(professorName)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Nível</td>
              <td style="padding:4px 0;color:#0d2e1e;font-size:13px;">${esc(levelLabel)}${subjectLabel ? ` · ${esc(subjectLabel)}` : ''}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Data</td>
              <td style="padding:4px 0;color:#0d2e1e;font-size:13px;text-transform:capitalize;">${esc(dateStr)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Horário</td>
              <td style="padding:4px 0;color:#1e6b40;font-size:15px;font-weight:800;">${esc(timeStr)}</td>
            </tr>
          </table>
          ${zoomBlock}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 36px;border-top:1px solid #e8f0e8;background:#fafcfa;text-align:center;">
          <p style="margin:0;color:#9dbfa9;font-size:11px;">
            Lembrete automático · Desttra Educação · gestao@desttra.com
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

export async function GET(request: Request) {
  // Verificar secret do cron
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/reminders] CRON_SECRET não configurado')
    return Response.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  const urlSecret  = new URL(request.url).searchParams.get('secret')
  const provided   = authHeader?.replace('Bearer ', '') ?? urlSecret ?? ''

  if (provided !== secret) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now      = new Date()

  // Janela: aulas que começam entre 1h45 e 2h15 a partir de agora (em UTC)
  const windowStart = new Date(now.getTime() + 105 * 60 * 1000).toISOString() // +1h45
  const windowEnd   = new Date(now.getTime() + 135 * 60 * 1000).toISOString() // +2h15

  const { data: classes, error } = await supabase
    .from('classes')
    .select(`
      id, scheduled_at, ends_at, level, subject, zoom_join_url,
      student:students(name, email, responsible_name, responsible_email),
      professor:professors(name, email)
    `)
    .gte('scheduled_at', windowStart)
    .lte('scheduled_at', windowEnd)
    .is('reminder_sent_at', null)
    .not('status', 'in', '("cancelada","remarcada")')

  if (error) {
    console.error('[cron/reminders] erro ao buscar aulas:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!classes?.length) {
    console.log('[cron/reminders] nenhuma aula para lembrete neste ciclo')
    return Response.json({ ok: true, sent: 0 })
  }

  console.log(`[cron/reminders] ${classes.length} aula(s) para lembrete`)

  let sent = 0
  const errors: string[] = []

  for (const cls of classes) {
    try {
      const student   = cls.student as { name: string; email: string | null; responsible_name: string | null; responsible_email: string | null } | null
      const professor = cls.professor as { name: string; email: string | null } | null

      const startBRT = toBRT(cls.scheduled_at as string)
      const endBRT   = cls.ends_at ? toBRT(cls.ends_at as string) : null
      const dateStr  = format(startBRT, "EEEE, dd 'de' MMMM", { locale: ptBR })
      const timeStr  = endBRT
        ? `${format(startBRT, 'HH:mm')} – ${format(endBRT, 'HH:mm')}`
        : format(startBRT, 'HH:mm')

      const levelLabel   = levelLabels[(cls.level as string)] ?? (cls.level as string)
      const subjectLabel = cls.subject ? (subjectLabels[cls.subject as string] ?? (cls.subject as string)) : null
      const zoomUrl      = cls.zoom_join_url as string | null

      const emailJobs: Promise<unknown>[] = []

      // Email para o aluno ou responsável
      const recipientEmail = student?.responsible_email || student?.email
      const recipientName  = student?.responsible_email
        ? (student.responsible_name ?? student?.name ?? 'Responsável')
        : (student?.name ?? 'Aluno')

      if (recipientEmail) {
        emailJobs.push(sendEmail({
          to: recipientEmail,
          subject: `🔔 Lembrete: aula em 2 horas — ${format(startBRT, 'HH:mm')}`,
          html: reminderEmail({
            greeting: `Olá, <strong style="color:#0d2e1e;">${esc(recipientName)}</strong>`,
            intro: `Sua aula começa em aproximadamente 2 horas!`,
            studentName:  student?.name ?? '—',
            professorName: professor?.name ?? '—',
            levelLabel, subjectLabel, dateStr, timeStr, zoomUrl,
          }),
        }))
      }

      // Email para o professor
      if (professor?.email) {
        emailJobs.push(sendEmail({
          to: professor.email,
          subject: `🔔 Lembrete: aula com ${student?.name ?? 'aluno'} em 2 horas — ${format(startBRT, 'HH:mm')}`,
          html: reminderEmail({
            greeting: `Olá, <strong style="color:#0d2e1e;">${esc(professor.name)}</strong>`,
            intro: `Você tem uma aula com <strong>${esc(student?.name ?? '—')}</strong> em aproximadamente 2 horas.`,
            studentName:  student?.name ?? '—',
            professorName: professor.name,
            levelLabel, subjectLabel, dateStr, timeStr, zoomUrl,
          }),
        }))
      }

      await Promise.allSettled(emailJobs)

      // Marcar lembrete como enviado
      await supabase.from('classes')
        .update({ reminder_sent_at: now.toISOString() })
        .eq('id', cls.id)

      sent++
      console.log(`[cron/reminders] lembrete enviado para aula ${cls.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`aula ${cls.id}: ${msg}`)
      console.error(`[cron/reminders] erro na aula ${cls.id}:`, msg)
    }
  }

  return Response.json({ ok: true, sent, errors: errors.length ? errors : undefined })
}
