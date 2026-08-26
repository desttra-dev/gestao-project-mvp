import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { aulaId, scheduledAt, endsAt } = await request.json() as {
    aulaId: string
    scheduledAt: string
    endsAt: string | null
  }
  if (!aulaId || !scheduledAt) return Response.json({ error: 'dados insuficientes' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('classes')
    .update({ scheduled_at: scheduledAt, ends_at: endsAt ?? null })
    .eq('id', aulaId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
