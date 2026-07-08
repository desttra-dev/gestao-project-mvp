import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function POST(request: Request) {
  const { aulaId } = await request.json() as { aulaId: string }
  if (!aulaId) return Response.json({ error: 'aulaId obrigatório' }, { status: 400 })

  const supabase = await createClient()

  const { data: aula, error } = await supabase
    .from('classes')
    .select('*, student:students(name), professor:professors(name, email)')
    .eq('id', aulaId)
    .single()

  if (error || !aula) return Response.json({ error: 'Aula não encontrada' }, { status: 404 })

  await supabase.from('classes').update({ status: 'cancelada' }).eq('id', aulaId)

  const professor = aula.professor as { name: string; email: string | null } | null
  if (professor?.email) {
    const studentName = (aula.student as { name: string } | null)?.name ?? 'Aluno'
    const dateStr = format(new Date(aula.scheduled_at as string), "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

    await sendEmail({
      to: professor.email,
      subject: `Aula cancelada — ${studentName} em ${format(new Date(aula.scheduled_at as string), 'dd/MM/yyyy')}`,
      html: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f7f5;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
           style="background:white;border-radius:12px;overflow:hidden;border:1px solid #fcd4d4;">
      <tr><td style="background:#b91c1c;padding:24px 32px;">
        <p style="margin:0;color:white;font-size:20px;font-weight:700;">Desttra Educação</p>
        <p style="margin:4px 0 0;color:#fca5a5;font-size:13px;">Cancelamento de aula</p>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <p style="margin:0 0 6px;color:#6b8c6b;font-size:13px;">Olá, <strong style="color:#0d2e1e;">${professor.name}</strong></p>
        <p style="margin:0 0 24px;color:#0d2e1e;font-size:15px;line-height:1.5;">
          A aula com o aluno <strong>${studentName}</strong> foi <strong style="color:#b91c1c;">cancelada</strong>.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#fff5f5;border-radius:8px;padding:16px;border:1px solid #fcd4d4;">
          <tr>
            <td style="padding:4px 0;color:#6b8c6b;font-size:13px;width:100px;">Aluno</td>
            <td style="padding:4px 0;color:#0d2e1e;font-size:13px;font-weight:600;">${studentName}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6b8c6b;font-size:13px;">Data</td>
            <td style="padding:4px 0;color:#b91c1c;font-size:13px;font-weight:600;text-transform:capitalize;">${dateStr}</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid #e8f0e8;background:#fafcfa;">
        <p style="margin:0;color:#9dbfa9;font-size:11px;">Email automático da plataforma Desttra. Dúvidas: gestao@desttra.com</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`,
    }).catch(() => {})
  }

  return Response.json({ ok: true })
}
