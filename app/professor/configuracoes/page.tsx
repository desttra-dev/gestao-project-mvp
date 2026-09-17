export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyProfessorToken } from '@/lib/professor-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { ProfessorHeader } from '@/components/professor/professor-header'
import { SettingsForm } from '@/components/professor/settings-form'

export default async function ConfiguracoesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('professor_token')?.value
  if (!token) redirect('/professor/login')
  const professorId = verifyProfessorToken(token)
  if (!professorId) redirect('/professor/login')

  const supabase = createServiceClient()
  const { data: professor } = await supabase
    .from('professors')
    .select('id,name,portal_email,phone')
    .eq('id', professorId)
    .single()
  if (!professor) redirect('/professor/login')

  return (
    <div>
      <ProfessorHeader professorName={professor.name} />
      <div style={{ maxWidth: '440px', margin: '28px auto', padding: '0 16px 48px' }}>
        <p style={{ margin: '0 0 20px', fontSize: '11px', fontWeight: 700, color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Configurações
        </p>
        <SettingsForm
          initialEmail={professor.portal_email ?? ''}
          initialPhone={professor.phone ?? ''}
        />
      </div>
    </div>
  )
}
