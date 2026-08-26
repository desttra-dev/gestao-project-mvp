'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ExportCsvButton({ href, label = 'Exportar CSV' }: { href: string; label?: string }) {
  return (
    <a href={href} download>
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        {label}
      </Button>
    </a>
  )
}
