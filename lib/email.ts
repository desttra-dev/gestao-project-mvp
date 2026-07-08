import { Resend } from 'resend'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[sendEmail] RESEND_API_KEY não encontrada')
    return
  }
  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from: 'Desttra Educação <noreply@desttra.com>',
    to,
    subject,
    html,
  })
  if (result.error) {
    console.error('[sendEmail] Erro Resend:', JSON.stringify(result.error))
  }
  return result
}
