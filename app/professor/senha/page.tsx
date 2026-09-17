export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyProfessorToken } from '@/lib/professor-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { ProfessorHeader } from '@/components/professor/professor-header'
import { ChangePasswordForm } from '@/components/professor/change-password-form'

export default async function SenhaPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('professor_token')?.value
  if (!token) redirect('/professor/login')
  const professorId = verifyProfessorToken(token)
  if (!professorId) redirect('/professor/login')

  const supabase = createServiceClient()
  const { data: professor } = await supabase
    .from('professors').select('id,name').eq('id', professorId).single()
  if (!professor) redirect('/professor/login')

  return (
    <div>
      <ProfessorHeader professorName={professor.name} />
      <div style={{ maxWidth:'400px', margin:'32px auto', padding:'0 16px' }}>
        <p style={{ margin:'0 0 20px', fontSize:'18px', fontWeight:800, color:'#0d2e1e' }}>
          Alterar senha
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
