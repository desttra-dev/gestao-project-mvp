'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AvisoForm } from './aviso-form'

export function NovoAvisoButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      {open && <AvisoForm onClose={() => setOpen(false)} />}
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Novo aviso
      </Button>
    </>
  )
}
