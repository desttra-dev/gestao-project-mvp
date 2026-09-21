export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AvisoActions } from './aviso-actions'
import { NovoAvisoButton } from './novo-aviso-button'

export default async function AvisosPage() {
  const supabase = await createClient()
  const { data: avisos } = await supabase
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const ativos   = (avisos ?? []).filter(a => a.active).length
  const inativos = (avisos ?? []).filter(a => !a.active).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Avisos para professores</h1>
          <p className="text-sm text-slate-500 mt-1">
            <span style={{ color: '#1e6b40', fontWeight: 600 }}>{ativos} ativo{ativos !== 1 ? 's' : ''}</span>
            {inativos > 0 && <> · <span style={{ color: '#94a3b8' }}>{inativos} inativo{inativos !== 1 ? 's' : ''}</span></>}
          </p>
        </div>
        <NovoAvisoButton />
      </div>

      {(avisos ?? []).length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 6px', fontSize: '32px' }}>📢</p>
          <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: '#0d2e1e' }}>Nenhum aviso criado ainda</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Crie um aviso para que os professores vejam no portal.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(avisos ?? []).map(aviso => (
            <div key={aviso.id} style={{
              background: 'white', borderRadius: '12px',
              border: `1px solid ${aviso.active ? '#e2e8f0' : '#f1f5f9'}`,
              padding: '18px 20px',
              opacity: aviso.active ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {aviso.pinned && (
                      <span style={{ fontSize: '12px' }}>📌</span>
                    )}
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0d2e1e' }}>
                      {aviso.title}
                    </h3>
                    <span style={{
                      background: aviso.active ? '#dcfce7' : '#f1f5f9',
                      color:      aviso.active ? '#166534' : '#64748b',
                      borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 700,
                    }}>
                      {aviso.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#4a5a4a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {aviso.body}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                    Criado em {format(new Date(aviso.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {aviso.updated_at !== aviso.created_at && (
                      <> · editado em {format(new Date(aviso.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</>
                    )}
                  </p>
                </div>
                <AvisoActions aviso={aviso} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
