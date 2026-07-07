import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: 'Desttra Educação <noreply@desttra.com>',
    to,
    subject,
    html,
  })
}
