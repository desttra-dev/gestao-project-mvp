export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('professor_token')
  return Response.json({ ok: true })
}
