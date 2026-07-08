export async function GET() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return Response.json({ error: 'RESEND_API_KEY não encontrada' }, { status: 500 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Desttra Educação <noreply@desttra.com>',
      to: 'gestao@desttra.com',
      subject: 'Teste de email — Desttra',
      html: '<p>Se você está lendo isso, o fetch direto está funcionando.</p>',
    }),
  })

  const data = await res.json()
  return Response.json({ status: res.status, data })
}
