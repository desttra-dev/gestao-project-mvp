'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  DollarSign, CreditCard, Settings, LogOut,
  ChevronDown, BookCheck, ArrowLeftRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Alunos', href: '/alunos', icon: Users },
  { label: 'Professores', href: '/professores', icon: GraduationCap },
  { label: 'Aulas', href: '/aulas', icon: BookOpen },
  {
    label: 'Financeiro',
    icon: DollarSign,
    children: [
      { label: 'Lançamentos', href: '/financeiro/lancamentos', icon: ArrowLeftRight },
      { label: 'Cobranças', href: '/financeiro/cobrancas', icon: CreditCard },
      { label: 'Repasses', href: '/financeiro/repasses', icon: DollarSign },
    ],
  },
  {
    label: 'Configurações',
    icon: Settings,
    children: [
      { label: 'Planos', href: '/configuracoes/planos', icon: BookCheck },
      { label: 'Taxas de Repasse', href: '/configuracoes/taxas', icon: DollarSign },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [openGroups, setOpenGroups] = useState<string[]>(['Financeiro', 'Configurações'])

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
    <aside className="w-60 min-h-screen flex flex-col" style={{ backgroundColor: '#0d2e1e' }}>
      <div className="px-6 py-5 border-b" style={{ borderColor: '#1a4a2e' }}>
        <h1 className="text-base font-extrabold" style={{ color: '#e8faf0' }}>Desttra Educação</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6b9e7a' }}>Gestão de Aulas</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          if (item.children) {
            const isOpen = openGroups.includes(item.label)
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
    </aside>
  )
}
