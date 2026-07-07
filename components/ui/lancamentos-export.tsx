'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

function defaultDe() {
  const d = new Date()
  d.setDate(1)
  return format(d, 'yyyy-MM-dd')
}

function defaultAte() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function LancamentosExport() {
  const [open, setOpen] = useState(false)
  const [de,   setDe]   = useState(defaultDe)
  const [ate,  setAte]  = useState(defaultAte)

  const href = `/api/lancamentos/export?de=${de}&ate=${ate}`

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen(o => !o)}>
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-xl p-4 shadow-lg"
          style={{ backgroundColor: 'white', border: '1px solid #d4e8d4', minWidth: '280px' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: '#0d2e1e' }}>Período de exportação</span>
            <button onClick={() => setOpen(false)} style={{ color: '#6b8c6b' }}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium mb-1 block" style={{ color: '#4a5a4a' }}>De</span>
              <input
                type="date"
                value={de}
                onChange={e => setDe(e.target.value)}
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                style={{ borderColor: '#d4e8d4', color: '#0d2e1e', outline: 'none' }}
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium mb-1 block" style={{ color: '#4a5a4a' }}>Até</span>
              <input
                type="date"
                value={ate}
                onChange={e => setAte(e.target.value)}
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                style={{ borderColor: '#d4e8d4', color: '#0d2e1e', outline: 'none' }}
              />
            </label>

            <a
              href={href}
              download
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full rounded-md px-3 py-2 text-sm font-semibold transition-colors"
              style={{ backgroundColor: '#1e6b40', color: 'white' }}
            >
              <Download className="h-4 w-4" />
              Baixar CSV
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
