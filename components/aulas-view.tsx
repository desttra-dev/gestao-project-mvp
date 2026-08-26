'use client'

import { useRouter } from 'next/navigation'
import { AulasCalendar } from '@/components/aulas-calendar'

interface ClassItem {
  id: string
  scheduled_at: string
  ends_at?: string | null
  status: string
  level: string
  subject?: string | null
  student: { name: string } | null
  professor: { name: string } | null
}

interface AulasViewProps {
  classes: ClassItem[]
  professors: { id: string; name: string }[]
  professorId: string
}

export function AulasView({ classes, professors, professorId }: AulasViewProps) {
  const router = useRouter()

  const buildHref = (professorId: string) => {
    const p = new URLSearchParams()
    if (professorId) p.set('professor_id', professorId)
    const s = p.toString()
    return s ? `?${s}` : '?'
  }

  return (
    <div className="space-y-4">
      {/* Filtro de professor */}
      {professors.length > 0 && (
        <div className="flex justify-end">
          <select
            value={professorId}
            onChange={e => router.push(buildHref(e.target.value))}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{
              backgroundColor: '#f5f7f5',
              border: '1px solid #d4e8d4',
              color: professorId ? '#1e6b40' : '#6b8c6b',
              outline: 'none',
            }}
          >
            <option value="">Todos os professores</option>
            {professors.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <AulasCalendar classes={classes} />
    </div>
  )
}
