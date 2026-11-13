'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { toBRT } from '@/lib/date-utils'

const statusStyle: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  agendada:  { bg: '#e8faf0', text: '#1e6b40', dot: '#1e6b40', label: 'Agendada'  },
  realizada: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af', label: 'Realizada' },
  cancelada: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444', label: 'Cancelada' },
}

interface TodayClass {
  id: string
  scheduled_at: string
  ends_at?: string | null
  status: string
  zoom_join_url?: string | null
  student: { name: string } | null
  professor: { name: string } | null
}

export function TodayClassRow({ aula, nowIso }: { aula: TodayClass; nowIso: string }) {
  const router = useRouter()
  const st       = statusStyle[aula.status] ?? statusStyle.agendada
  const startBRT = toBRT(aula.scheduled_at)
  const endBRT   = aula.ends_at ? toBRT(aula.ends_at) : null
  const isPast   = aula.scheduled_at < nowIso

  const copiarLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!aula.zoom_join_url) return
    try {
      await navigator.clipboard.writeText(aula.zoom_join_url)
      toast.success('Link do Zoom copiado!')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  return (
    <div
      onClick={() => router.push(`/aulas/${aula.id}`)}
      className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm cursor-pointer"
      style={{
        borderColor: '#e4f0e4',
        backgroundColor: isPast && aula.status === 'agendada' ? '#fefce8' : 'white',
        opacity: aula.status === 'cancelada' ? 0.6 : 1,
      }}
    >
      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: st.dot }} />
      <div className="flex-shrink-0 text-center" style={{ minWidth: 50 }}>
        <p className="text-sm font-bold" style={{ color: '#0d2e1e' }}>
          {format(startBRT, 'HH:mm')}
        </p>
        {endBRT && (
          <p className="text-xs" style={{ color: '#9dbfa9' }}>{format(endBRT, 'HH:mm')}</p>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#0d2e1e' }}>
          {aula.student?.name ?? '—'}
        </p>
        <p className="text-xs truncate" style={{ color: '#6b8c6b' }}>
          Prof. {aula.professor?.name ?? '—'}
        </p>
      </div>
      {aula.zoom_join_url && (
        <button
          type="button"
          onClick={copiarLink}
          title="Copiar link do Zoom"
          className="flex-shrink-0 p-1.5 rounded-md transition-colors hover:bg-gray-100"
          style={{ border: '1px solid #d4e8d4' }}
        >
          <Copy className="h-3.5 w-3.5" style={{ color: '#1e6b40' }} />
          <span className="sr-only">Copiar link do Zoom</span>
        </button>
      )}
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: st.bg, color: st.text }}>
        {st.label}
      </span>
    </div>
  )
}
