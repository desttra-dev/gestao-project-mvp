'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  DollarSign, Settings, LogOut,
  ChevronDown, BookCheck, Menu, X, Banknote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const navItems = [
  { label: 'Dashboard',   href: '/',                          icon: LayoutDashboard },
  { label: 'Alunos',      href: '/alunos',                    icon: Users           },
  { label: 'Professores', href: '/professores',               icon: GraduationCap   },
  { label: 'Aulas',       href: '/aulas',                     icon: BookOpen        },
  {
    label: 'Financeiro',
    icon: Banknote,
    children: [
      { label: 'Repasses',  href: '/financeiro/repasses',  icon: DollarSign },
    ],
  },
  {
    label: 'Configurações',
    icon: Settings,
    children: [
      { label: 'Planos',          href: '/configuracoes/planos', icon: BookCheck   },
      { label: 'Taxas de Repasse', href: '/configuracoes/taxas', icon: DollarSign  },
    ],
  },
]

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [openGroups, setOpenGroups] = useState<string[]>(['Configurações', 'Financeiro'])

  const toggleGroup = (label: string) => {
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.children) {
            const isOpen   = openGroups.includes(item.label)
            const isActive = item.children.some(c => pathname.startsWith(c.href))
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-semibold transition-colors"
                  style={{ color: isActive ? '#4ade80' : '#9dbfa9' }}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-3" style={{ borderColor: '#1a4a2e' }}>
                    {item.children.map((child) => {
                      const active = pathname.startsWith(child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavigate}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
                          style={{
                            backgroundColor: active ? '#1e6b40' : 'transparent',
                            color: active ? '#e8faf0' : '#9dbfa9',
                            fontWeight: active ? 600 : 400,
                          }}
                        >
                          <child.icon className="h-3.5 w-3.5" />
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href!)
          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={onNavigate}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-semibold transition-colors"
              style={{
                backgroundColor: active ? '#1e6b40' : 'transparent',
                color: active ? '#e8faf0' : '#9dbfa9',
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: '#1a4a2e' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
          style={{ color: '#9dbfa9' }}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Fecha o menu mobile ao navegar
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const logoBlock = (
    <div className="px-6 py-5 border-b flex-shrink-0" style={{ borderColor: '#1a4a2e' }}>
      <h1 className="text-base font-extrabold" style={{ color: '#e8faf0' }}>Desttra Educação</h1>
      <p className="text-xs mt-0.5" style={{ color: '#6b9e7a' }}>Gestão de Aulas</p>
    </div>
  )

  return (
    <>
      {/* ── Barra mobile (topo fixo) ────────────────────────────────── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-4 border-b"
        style={{ backgroundColor: '#0d2e1e', borderColor: '#1a4a2e' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-md"
          style={{ color: '#9dbfa9' }}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="ml-3 text-base font-extrabold" style={{ color: '#e8faf0' }}>
          Desttra Educação
        </span>
      </div>

      {/* ── Sidebar desktop (fixa, sempre visível) ──────────────────── */}
      <aside
        className="hidden lg:flex w-60 min-h-screen flex-col fixed left-0 top-0 bottom-0 z-30"
        style={{ backgroundColor: '#0d2e1e' }}
      >
        {logoBlock}
        <NavContent />
      </aside>

      {/* ── Overlay mobile ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Drawer mobile ───────────────────────────────────────────── */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ backgroundColor: '#0d2e1e' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: '#1a4a2e' }}
        >
          <div>
            <h1 className="text-base font-extrabold" style={{ color: '#e8faf0' }}>Desttra Educação</h1>
            <p className="text-xs mt-0.5" style={{ color: '#6b9e7a' }}>Gestão de Aulas</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md"
            style={{ color: '#9dbfa9' }}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  )
}
