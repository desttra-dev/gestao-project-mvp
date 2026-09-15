import { Sidebar } from '@/components/layout/sidebar'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      {/* lg:ml-60 empurra o conteúdo para além da sidebar fixa no desktop */}
      <main className="flex-1 lg:ml-60 p-4 md:p-6 lg:p-8 overflow-auto pt-16 lg:pt-8">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
