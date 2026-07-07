async function getZoomToken(): Promise<string | null> {
  const accountId    = process.env.ZOOM_ACCOUNT_ID
  const clientId     = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET
  if (!accountId || !clientId || !clientSecret) return null

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    { method: 'POST', headers: { Authorization: `Basic ${credentials}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
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
  const token = await getZoomToken()
  if (!token) return null

  const brtDate  = toBRT(scheduledAt)
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
  if (!res.ok) return null
  const data = await res.json()
  return { meetingId: String(data.id), joinUrl: data.join_url }
}
