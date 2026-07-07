'use server'

import { createCalendarEvent } from '@/lib/google-calendar'

const levelLabels: Record<string, string> = {
  fundamental: 'Fundamental',
  medio: 'Médio',
  superior: 'Superior',
  internacional: 'Internacional',
}

export async function createAulaGoogleEvent({
  studentName,
  professorName,
  scheduledAt,
  level,
  notes,
}: {
  studentName: string
  professorName: string
  scheduledAt: string
  level: string
  notes?: string
}) {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const lines = [
    `Aluno: ${studentName}`,
    `Professor: ${professorName}`,
    notes ? `Obs: ${notes}` : '',
  ].filter(Boolean)

  await createCalendarEvent({
    title: `Aula ${levelLabels[level] ?? level} — ${studentName}`,
    description: lines.join('\n'),
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
  })
}
