'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

const NAV = [
  { href: '/professor',               label: 'Início' },
  { href: '/professor/historico',     label: 'Histórico' },
  { href: '/professor/pagamentos',    label: 'Pagamentos' },
  { href: '/professor/configuracoes', label: 'Configurações' },
  { href: '/professor/ajuda',         label: 'Ajuda' },
]

export function ProfessorHeader({ professorName }: { professorName: string }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [open, setOpen]         = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const logout = async () => {
    setLoggingOut(true)
    await fetch('/api/professor/logout', { method: 'POST' })
    router.push('/professor/login')
  }

  const isActive = (href: string) =>
    href === '/professor' ? pathname === '/professor' : pathname.startsWith(href)

  const linkStyle = (href: string): React.CSSProperties => ({
    color: isActive(href) ? 'white' : 'rgba(255,255,255,0.75)',
    fontSize: '13px', textDecoration: 'none',
    padding: '4px 10px', borderRadius: '6px',
    fontWeight: isActive(href) ? 700 : 400,
    background: isActive(href) ? 'rgba(255,255,255,0.15)' : 'transparent',
  })

  return (
    <>
      <style>{`
        @media (min-width: 600px) { .prof-hamburger { display: none !important; } }
        @media (max-width: 599px) { .prof-desktop-nav { display: none !important; } }
      `}</style>

      <header style={{
        background: 'linear-gradient(135deg,#1e6b40,#2da862)',
        padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: '680px', margin: '0 auto', height: '56px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <p style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: 800, flexShrink: 0 }}>
            Desttra
          </p>

          {/* Desktop nav */}
          <nav className="prof-desktop-nav" style={{ display: 'flex', gap: '4px', margin: '0 12px' }}>
            {NAV.map(n => (
              <Link key={n.href} href={n.href} style={linkStyle(n.href)}>{n.label}</Link>
            ))}
          </nav>

          {/* Desktop: name + logout */}
          <div className="prof-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              {professorName.split(' ')[0]}
            </p>
            <button onClick={logout} disabled={loggingOut} style={{
              padding: '5px 12px', background: 'rgba(255,255,255,0.15)', color: 'white',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px',
              fontSize: '12px', cursor: 'pointer',
            }}>
              Sair
            </button>
          </div>

          {/* Mobile: name + hamburger */}
          <div className="prof-hamburger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              {professorName.split(' ')[0]}
            </p>
            <button
              onClick={() => setOpen(v => !v)}
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: '4px',
              }}
            >
              <span style={{ display: 'block', width: '18px', height: '2px', background: 'white', borderRadius: '2px',
                transition: 'all 0.2s', transform: open ? 'translateY(6px) rotate(45deg)' : 'none' }} />
              <span style={{ display: 'block', width: '18px', height: '2px', background: 'white', borderRadius: '2px',
                opacity: open ? 0 : 1, transition: 'opacity 0.2s' }} />
              <span style={{ display: 'block', width: '18px', height: '2px', background: 'white', borderRadius: '2px',
                transition: 'all 0.2s', transform: open ? 'translateY(-6px) rotate(-45deg)' : 'none' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown */}
      {open && (
        <div className="prof-hamburger" style={{
          position: 'fixed', top: '56px', left: 0, right: 0, zIndex: 49,
          background: '#1a5c36', borderBottom: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        }}>
          {NAV.map(n => (
            <Link
              key={n.href} href={n.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block', padding: '14px 20px',
                color: isActive(n.href) ? 'white' : 'rgba(255,255,255,0.8)',
                textDecoration: 'none', fontSize: '15px',
                fontWeight: isActive(n.href) ? 700 : 400,
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: isActive(n.href) ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
            >
              {n.label}
            </Link>
          ))}
          <button onClick={logout} disabled={loggingOut} style={{
            display: 'block', width: '100%', padding: '14px 20px', textAlign: 'left',
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
            fontSize: '15px', cursor: 'pointer',
          }}>
            Sair
          </button>
        </div>
      )}
    </>
  )
}
