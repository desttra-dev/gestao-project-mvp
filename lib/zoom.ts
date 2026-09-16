async function getZoomToken(): Promise<{ token: string } | { error: string }> {
  const accountId    = process.env.ZOOM_ACCOUNT_ID
  const clientId     = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET
  if (!accountId || !clientId || !clientSecret) {
    return { error: 'Credenciais Zoom não configuradas (ZOOM_ACCOUNT_ID/CLIENT_ID/CLIENT_SECRET)' }
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    { method: 'POST', headers: { Authorization: `Basic ${credentials}` } }
  )

  if (!res.ok) {
    const body = await res.text()
    const msg = `Zoom token HTTP ${res.status}: ${body}`
    console.error('[zoom] getZoomToken falhou:', msg)
    return { error: msg }
  }

  const data = await res.json()
  if (!data.access_token) {
    const msg = `Zoom token sem access_token: ${JSON.stringify(data)}`
    console.error('[zoom] getZoomToken:', msg)
    return { error: msg }
  }

  return { token: data.access_token }
}

// Brazil is permanently UTC-3 (no DST since 2019)
function toBRT(utcIso: string): Date {
  return new Date(new Date(utcIso).getTime() - 3 * 60 * 60 * 1000)
}

function formatForZoom(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00`
}

export async function createZoomMeeting({
  topic,
  scheduledAt,
  durationMinutes = 60,
  repeatMode = 'none',
  repeatUntil,
}: {
  topic: string
  scheduledAt: string
  durationMinutes?: number
  repeatMode?: 'none' | 'daily' | 'weekly'
  repeatUntil?: string
}): Promise<{ meetingId: string; joinUrl: string } | null> {
  const tokenResult = await getZoomToken()
  if ('error' in tokenResult) {
    console.error('[zoom] createZoomMeeting abortado:', tokenResult.error)
    return null
  }
  const token = tokenResult.token

  const brtDate   = toBRT(scheduledAt)
  const startTime = formatForZoom(brtDate)
  // Zoom: 1=Sun 2=Mon 3=Tue 4=Wed 5=Thu 6=Fri 7=Sat
  const weeklyDay = String(brtDate.getUTCDay() + 1)

  const body: Record<string, unknown> = {
    topic,
    type: repeatMode === 'none' ? 2 : 8,
    start_time: startTime,
    duration: durationMinutes,
    timezone: 'America/Sao_Paulo',
    settings: {
      auto_recording: 'cloud',
      join_before_host: true,
      waiting_room: false,
    },
  }

  if (repeatMode !== 'none' && repeatUntil) {
    body.recurrence = {
      type: repeatMode === 'daily' ? 1 : 2,
      repeat_interval: 1,
      ...(repeatMode === 'weekly' ? { weekly_days: weeklyDay } : {}),
      end_date_time: `${repeatUntil}T23:59:59Z`,
    }
  }

  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.text()
    console.error('[zoom] createZoomMeeting HTTP', res.status, errBody)
    return null
  }

  const data = await res.json()
  if (!data.id || !data.join_url) {
    console.error('[zoom] createZoomMeeting resposta sem id/join_url:', JSON.stringify(data))
    return null
  }

  return { meetingId: String(data.id), joinUrl: data.join_url }
}

export async function getZoomRecording(meetingId: string): Promise<{ shareUrl: string } | null> {
  const tokenResult = await getZoomToken()
  if ('error' in tokenResult) return null
  const token = tokenResult.token

  const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data.share_url) return null
  return { shareUrl: data.share_url as string }
}

// Exportado para usar em diagnóstico
export async function testZoomCredentials(): Promise<{ ok: boolean; error?: string; accountInfo?: unknown }> {
  const tokenResult = await getZoomToken()
  if ('error' in tokenResult) return { ok: false, error: tokenResult.error }

  // Testa se consegue chamar a API
  const res = await fetch('https://api.zoom.us/v2/users/me', {
    headers: { Authorization: `Bearer ${tokenResult.token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    return { ok: false, error: `users/me HTTP ${res.status}: ${body}` }
  }

  const info = await res.json()
  return {
    ok: true,
    accountInfo: {
      email: info.email,
      account_id: info.account_id,
      type: info.type, // 1=Basic, 2=Pro, 3=Business
      plan_name: info.type === 1 ? 'Basic (gratuito)' : info.type === 2 ? 'Pro' : 'Business+',
    },
  }
}
