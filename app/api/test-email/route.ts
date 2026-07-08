import { Resend } from 'resend'

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return Response.json({ error: 'RESEND_API_KEY não encontrada no ambiente' }, { status: 500 })
  }

  const resend = new Resend(apiKey)

  const result = await resend.emails.send({
    from: 'Desttra Educação <noreply@desttra.com>',
    to: 'gestao@desttra.com',
    subject: 'Teste de email — Desttra',
    html: '<p>Se você está lendo isso, o Resend está funcionando corretamente.</p>',
  })

  return Response.json(result)
}
