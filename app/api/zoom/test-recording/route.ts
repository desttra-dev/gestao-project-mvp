export const dynamic = 'force-dynamic'

/**
 * Endpoint de diagnóstico para testar o fluxo de email de gravação.
 * GET /api/zoom/test-recording?meeting_id=XXXX
 *   → busca a aula no DB e mostra o que seria enviado (sem mandar email)
 * GET /api/zoom/test-recording?meeting_id=XXXX&send=1
 *   → busca e envia o email de verdade (usa share_url fictício se não tiver)
 * GET /api/zoom/test-recording?class_id=UUID
 *   → busca pelo ID direto da aula
 */

import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email'
import { testZoomCredentials } from '@/lib/zoom'
import { toBRT } from '@/lib/date-utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const subjectLabels: Record<string, string> = {
  matematica: 'Matemática', fisica: 'Física', quimica: 'Química',
  portugues: 'Português', historia: 'História', geografia: 'Geografia',
  filosofia: 'Filosofia', redacao: 'Redação', sociologia: 'Sociologia',
}
const levelLabels: Record<string, string> = {
  fundamental: 'Fundamental', medio: 'Médio', superior: 'Superior', internacional: 'Internacional',
}

export async function GET(request: Request) {
  const url      = new URL(request.url)
  const meetingId = url.searchParams.get('meeting_id')
  const classId   = url.searchParams.get('class_id')
  const send      = url.searchParams.get('send') === '1'

  // ── Verificar env vars ─────────────────────────────────────────────────────
  const envStatus = {
    ZOOM_WEBHOOK_SECRET_TOKEN: !!process.env.ZOOM_WEBHOOK_SECRET_TOKEN,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY:            !!process.env.RESEND_API_KEY,
    ZOOM_ACCOUNT_ID:           !!process.env.ZOOM_ACCOUNT_ID,
    ZOOM_CLIENT_ID:            !!process.env.ZOOM_CLIENT_ID,
    ZOOM_CLIENT_SECRET:        !!process.env.ZOOM_CLIENT_SECRET,
  }

  const list     = url.searchParams.get('list') === '1'
  const zoomTest = url.searchParams.get('zoom_test') === '1'

  // Teste de credenciais Zoom
  if (zoomTest) {
    const result = await testZoomCredentials()
    return Response.json({ env: envStatus, zoom_credentials: result })
  }

  if (!meetingId && !classId) {
    if (!list) {
      return Response.json({
        info: 'Use ?list=1 para ver últimas aulas, ?zoom_test=1 para testar credenciais Zoom, ?meeting_id=XXXX ou ?class_id=UUID para testar. Adicione &send=1 para enviar.',
        env: envStatus,
      })
    }

    // Listar últimas 15 aulas com dados Zoom
    let supabase2: ReturnType<typeof createServiceClient>
    try { supabase2 = createServiceClient() } catch {
      return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }, { status: 500 })
    }

    const { data: aulas } = await supabase2
      .from('classes')
      .select('id, scheduled_at, zoom_meeting_id, zoom_join_url, student:students(name), professor:professors(name)')
      .order('scheduled_at', { ascending: false })
      .limit(15)

    return Response.json({
      env: envStatus,
      aulas: (aulas ?? []).map((a: any) => ({
        class_id: a.id,
        data: a.scheduled_at ? a.scheduled_at.slice(0, 16).replace('T', ' ') : '—',
        aluno: a.student?.name ?? '—',
        professor: a.professor?.name ?? '—',
        zoom_meeting_id: a.zoom_meeting_id ?? '❌ SEM ZOOM',
        zoom_join_url: a.zoom_join_url ?? '—',
      })),
    })
  }

  // ── Criar service client ───────────────────────────────────────────────────
  let supabase: ReturnType<typeof createServiceClient>
  try {
    supabase = createServiceClient()
  } catch (err) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada', env: envStatus }, { status: 500 })
  }

  // ── Buscar aula ────────────────────────────────────────────────────────────
  let query = supabase.from('classes').select(`
    id, scheduled_at, ends_at, level, subject, zoom_meeting_id, zoom_join_url,
    student:students(name, email, responsible_name, responsible_email),
    professor:professors(name, email)
  `)

  if (classId) {
    query = query.eq('id', classId) as typeof query
  } else {
    query = query.eq('zoom_meeting_id', meetingId!) as typeof query
  }

  const { data: aula, error: dbErr } = await (query as any)
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .single()

  if (dbErr || !aula) {
    return Response.json({
      error: classId
        ? `Nenhuma aula com id=${classId}`
        : `Nenhuma aula com zoom_meeting_id=${meetingId}. A reunião Zoom foi criada? Verifique se zoom_meeting_id está salvo.`,
      db_error: dbErr?.message,
      env: envStatus,
    }, { status: 404 })
  }

  const student   = aula.student as any
  const professor = aula.professor as any
  const recipientEmail = student?.responsible_email || student?.email

  const result: Record<string, unknown> = {
    env: envStatus,
    aula_id: aula.id,
    zoom_meeting_id: aula.zoom_meeting_id,
    zoom_join_url: aula.zoom_join_url,
    student_name: student?.name,
    student_email: student?.email,
    responsible_email: student?.responsible_email,
    professor_name: professor?.name,
    recipient_email: recipientEmail,
    would_send_to_student: !!recipientEmail,
    scheduled_at_brt: format(toBRT(aula.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
  }

  if (!send) {
    result.note = 'Diagnóstico sem enviar email. Adicione &send=1 para enviar de verdade.'
    return Response.json(result)
  }

  // ── Enviar email de teste ──────────────────────────────────────────────────
  const shareUrl   = `https://zoom.us/rec/share/TESTE_${aula.id.slice(0, 8)}`
  const dateStr    = format(toBRT(aula.scheduled_at), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
  const subjectLabel = aula.subject ? (subjectLabels[aula.subject] ?? aula.subject) : null
  const levelLabel   = levelLabels[aula.level] ?? aula.level

  const html = (greeting: string, intro: string) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;padding:32px;">
  <h2 style="color:#1e6b40;">Desttra — Teste de gravação</h2>
  <p>${greeting}</p>
  <p>${intro}</p>
  <p><strong>Data:</strong> ${dateStr}</p>
  <p><strong>Nível:</strong> ${levelLabel}${subjectLabel ? ` · ${subjectLabel}` : ''}</p>
  <p><a href="${shareUrl}" style="color:#1e6b40;">Link de teste (fictício)</a></p>
  <p style="color:#999;font-size:12px;">Este é um email de TESTE do diagnóstico.</p>
</body></html>`

  const jobs: Promise<unknown>[] = []

  if (recipientEmail) {
    jobs.push(sendEmail({
      to: recipientEmail,
      subject: `[TESTE] Gravação disponível — ${student?.name}`,
      html: html(`Olá, ${student?.responsible_name ?? student?.name}`, `Este é um teste do sistema de gravação.`),
    }))
  }

  jobs.push(sendEmail({
    to: 'gestao@desttra.com',
    subject: `[TESTE Gravação] ${student?.name ?? 'Aluno'} — ${dateStr}`,
    html: html('Gestão Desttra', `Teste do sistema. Aula: ${aula.id}`),
  }))

  const settled = await Promise.allSettled(jobs)

  result.emails_enviados = settled.map((r, i) => ({
    destinatario: i === 0 && recipientEmail ? recipientEmail : 'gestao@desttra.com',
    status: r.status,
    error: r.status === 'rejected' ? String(r.reason) : undefined,
  }))

  return Response.json(result)
}
