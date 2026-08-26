import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { aulaId } = await request.json() as { aulaId: string }
  if (!aulaId) return Response.json({ error: 'aulaId obrigatório' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('classes')
    .update({ status: 'realizada' })
    .eq('id', aulaId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
