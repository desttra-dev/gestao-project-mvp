export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { aulaId, scope, seriesId, scheduledAt } = await request.json() as {
    aulaId: string
    scope: 'single' | 'following'
    seriesId?: string | null
    scheduledAt?: string
  }

  if (!aulaId) return Response.json({ error: 'aulaId obrigatório' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Não autorizado', { status: 401 })

  if (scope === 'single') {
    const { error } = await supabase.from('classes').delete().eq('id', aulaId)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else if (scope === 'following' && seriesId && scheduledAt) {
    const { error } = await supabase.from('classes')
      .delete()
      .eq('series_id', seriesId)
      .gte('scheduled_at', scheduledAt)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    return Response.json({ error: 'parâmetros inválidos' }, { status: 400 })
  }

  return Response.json({ ok: true })
}
