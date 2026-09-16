import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Client sem RLS — só para uso em rotas server-to-server (webhooks, crons)
// Nunca expor no browser
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados')
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })
}
