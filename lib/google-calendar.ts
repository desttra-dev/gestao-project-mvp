async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) return null

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    console.error('[GoogleCalendar] token error:', await res.text())
    return null
  }
  const data = await res.json()
  return data.access_token ?? null
}

export async function createCalendarEvent({
  title,
  description,
  startDateTime,
  endDateTime,
  timeZone = 'America/Sao_Paulo',
}: {
  title: string
  description?: string
  startDateTime: string
  endDateTime: string
  timeZone?: string
}): Promise<{ id: string } | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) return null

  const token = await getAccessToken()
  if (!token) return null

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: title,
        description,
        start: { dateTime: startDateTime, timeZone },
        end: { dateTime: endDateTime, timeZone },
      }),
    }
  )

  if (!res.ok) {
    console.error('[GoogleCalendar] create error:', await res.text())
    return null
  }
  return res.json()
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) return false

  const token = await getAccessToken()
  if (!token) return false

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
  )
  return res.status === 204
}
