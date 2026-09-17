'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

export function ProfessorHeader({ professorName }: { professorName: string }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const logout = async () => {
    setLoggingOut(true)
    await fetch('/api/professor/logout', { method: 'POST' })
    router.push('/professor/login')
  }

  return (
    <header style={{
      background: 'linear-gradient(135deg,#1e6b40,#2da862)',
      padding: '0 16px',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: '680px', margin: '0 auto', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <p style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: 800 }}>Desttra</p>
          <nav style={{ display: 'flex', gap: '4px' }}>
            <Link href="/professor" style={{
              color: 'rgba(255,255,255,0.85)', fontSize: '13px', textDecoration: 'none',
              padding: '4px 10px', borderRadius: '6px',
            }}>
              Início
            </Link>
            <Link href="/professor/historico" style={{
              color: 'rgba(255,255,255,0.85)', fontSize: '13px', textDecoration: 'none',
              padding: '4px 10px', borderRadius: '6px',
            }}>
              Histórico
            </Link>
            <Link href="/professor/senha" style={{
              color: 'rgba(255,255,255,0.85)', fontSize: '13px', textDecoration: 'none',
              padding: '4px 10px', borderRadius: '6px',
            }}>
              Senha
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
            {professorName.split(' ')[0]}
          </p>
          <button
            onClick={logout}
            disabled={loggingOut}
            style={{
              padding: '5px 12px', background: 'rgba(255,255,255,0.15)', color: 'white',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px',
              fontSize: '12px', cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
