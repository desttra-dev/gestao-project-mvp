export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyProfessorToken } from '@/lib/professor-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { ProfessorHeader } from '@/components/professor/professor-header'

export default async function AjudaPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('professor_token')?.value
  if (!token) redirect('/professor/login')
  const professorId = verifyProfessorToken(token)
  if (!professorId) redirect('/professor/login')

  const supabase = createServiceClient()
  const { data: professor } = await supabase
    .from('professors').select('id,name').eq('id', professorId).single()
  if (!professor) redirect('/professor/login')

  const s = {
    wrap:      { maxWidth: '680px', margin: '0 auto', padding: '16px 16px 64px' } as React.CSSProperties,
    label:     { margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '1px' } as React.CSSProperties,
    h2:        { margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#0d2e1e' } as React.CSSProperties,
    p:         { margin: '0 0 12px', fontSize: '14px', color: '#4a5a4a', lineHeight: 1.6 } as React.CSSProperties,
    section:   { marginBottom: '40px' } as React.CSSProperties,
    card:      { background: 'white', borderRadius: '14px', border: '1px solid #e8f0e8', padding: '20px', marginBottom: '12px' } as React.CSSProperties,
    mockup:    { background: '#f8fdf9', border: '1px solid #e0f0e6', borderRadius: '12px', padding: '16px', margin: '16px 0', fontSize: '13px' } as React.CSSProperties,
    chip:      (bg: string, color: string) => ({ background: bg, color, borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: 700, display: 'inline-block' }),
    step:      { display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'flex-start' } as React.CSSProperties,
    stepNum:   { minWidth: '28px', height: '28px', borderRadius: '50%', background: '#1e6b40', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0, marginTop: '1px' } as React.CSSProperties,
    tip:       { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', margin: '12px 0', fontSize: '13px', color: '#92400e' } as React.CSSProperties,
    info:      { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', margin: '12px 0', fontSize: '13px', color: '#1d4ed8' } as React.CSSProperties,
    divider:   { border: 'none', borderTop: '1px solid #e8f0e8', margin: '32px 0' } as React.CSSProperties,
  }

  return (
    <div>
      <ProfessorHeader professorName={professor.name} />
      <div style={s.wrap}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,#1e6b40,#2da862)', borderRadius: '16px', padding: '28px 24px', marginBottom: '32px', color: 'white' }}>
          <p style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 800 }}>Guia do Professor</p>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
            Tudo o que você precisa saber para usar o portal. Leia com calma — é mais simples do que parece!
          </p>
        </div>

        {/* Índice */}
        <div style={{ ...s.card, marginBottom: '32px' }}>
          <p style={{ ...s.label, marginBottom: '12px' }}>Nesta página</p>
          {[
            ['1', 'Visão geral do portal'],
            ['2', 'Página Inicial — suas aulas do dia'],
            ['3', 'Como confirmar uma aula'],
            ['4', 'O que fazer quando uma aula não aconteceu'],
            ['5', 'Histórico — consultar aulas passadas'],
            ['6', 'Pagamentos — ver o que você tem a receber'],
            ['7', 'Configurações — atualizar seus dados'],
            ['8', 'Perguntas frequentes'],
          ].map(([n, title]) => (
            <a key={n} href={`#secao-${n}`} style={{ display: 'flex', gap: '10px', padding: '8px 0', color: '#1e6b40', textDecoration: 'none', borderBottom: '1px solid #f0f7f0', fontSize: '14px', fontWeight: 500 }}>
              <span style={{ ...s.chip('#dcfce7', '#166534'), padding: '2px 8px', fontSize: '11px' }}>{n}</span>
              {title}
            </a>
          ))}
        </div>

        <hr style={s.divider} />

        {/* ─── 1. Visão geral ─────────────────────────────────────────── */}
        <section style={s.section} id="secao-1">
          <p style={s.label}>Seção 1</p>
          <h2 style={s.h2}>Visão geral do portal</h2>
          <p style={s.p}>
            O portal do professor é a sua ferramenta para acompanhar suas aulas, confirmar o que aconteceu e ver seus pagamentos. Ele tem <strong>5 abas principais</strong> no menu:
          </p>

          {/* Mockup do header */}
          <div style={{ ...s.mockup, padding: '0', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#1e6b40,#2da862)', padding: '12px 20px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '14px', marginRight: '8px' }}>Desttra</span>
              {['Início','Histórico','Pagamentos','Configurações','Ajuda'].map((item, i) => (
                <span key={i} style={{
                  color: i === 0 ? 'white' : 'rgba(255,255,255,0.75)',
                  fontSize: '12px', padding: '3px 10px', borderRadius: '6px',
                  background: i === 0 ? 'rgba(255,255,255,0.2)' : 'transparent',
                  fontWeight: i === 0 ? 700 : 400,
                }}>{item}</span>
              ))}
            </div>
            <div style={{ padding: '12px 20px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b8c6b' }}>← Este é o menu de navegação. Clique em qualquer aba para acessar.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '16px' }}>
            {[
              { icon: '🏠', title: 'Início', desc: 'Aulas de hoje e da semana' },
              { icon: '📋', title: 'Histórico', desc: 'Aulas do mês passado e anteriores' },
              { icon: '💰', title: 'Pagamentos', desc: 'O que você tem a receber' },
              { icon: '⚙️', title: 'Configurações', desc: 'Seus dados e senha' },
              { icon: '❓', title: 'Ajuda', desc: 'Este guia' },
            ].map(item => (
              <div key={item.title} style={{ background: '#f8fdf9', border: '1px solid #e0f0e6', borderRadius: '10px', padding: '14px 12px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: '22px' }}>{item.icon}</p>
                <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 700, color: '#0d2e1e' }}>{item.title}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b8c6b' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <hr style={s.divider} />

        {/* ─── 2. Página inicial ──────────────────────────────────────── */}
        <section style={s.section} id="secao-2">
          <p style={s.label}>Seção 2</p>
          <h2 style={s.h2}>Página Inicial — suas aulas do dia</h2>
          <p style={s.p}>
            Ao entrar no portal, você vê a <strong>Página Inicial</strong>. Ela mostra tudo que você precisa saber hoje.
          </p>

          {/* Mockup da página inicial */}
          <div style={s.mockup}>
            {/* Aviso pendente */}
            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#92400e' }}>2 aulas aguardando confirmação</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#b45309' }}>Você tem aulas anteriores que ainda não foram confirmadas.</p>
              </div>
            </div>

            {/* Aulas de hoje */}
            <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '1px' }}>Aulas de hoje · Quarta, 17 de Setembro</p>
            <div style={{ background: 'white', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e8f0e8', marginBottom: '8px' }}>
              <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 800, color: '#0d2e1e' }}>14:00 – 15:00</p>
              <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: '#1e6b40' }}>João Silva</p>
              <span style={{ ...s.chip('#eff6ff', '#1d4ed8'), fontSize: '11px' }}>Médio</span>
              <span style={{ ...s.chip('#f5f3ff', '#6d28d9'), fontSize: '11px', marginLeft: '6px' }}>Matemática</span>
            </div>

            {/* Próximas aulas */}
            <p style={{ margin: '12px 0 8px', fontSize: '10px', fontWeight: 700, color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '1px' }}>Próximas aulas</p>
            {[{ dia: 'Qui', num: '18', nome: 'Maria Oliveira', hora: '10:00 – 11:00', nivel: 'Fundamental' },
              { dia: 'Sex', num: '19', nome: 'Carlos Souza', hora: '16:00 – 17:00', nivel: 'Superior' }].map((a, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '10px 12px', border: '1px solid #e8f0e8', marginBottom: '6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', minWidth: '36px' }}>
                  <p style={{ margin: 0, fontSize: '9px', color: '#9dbfa9' }}>{a.dia}</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0d2e1e', lineHeight: 1 }}>{a.num}</p>
                </div>
                <div style={{ width: '1px', alignSelf: 'stretch', background: '#e8f0e8' }} />
                <div>
                  <p style={{ margin: '0 0 1px', fontSize: '12px', fontWeight: 700, color: '#0d2e1e' }}>{a.nome}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#6b8c6b' }}>{a.hora} · {a.nivel}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={s.info}>
            💡 <strong>Dica:</strong> Se aparecer o aviso amarelo de "aulas aguardando confirmação", é importante confirmar logo — elas afetam o seu pagamento!
          </div>

          <p style={{ ...s.label, marginTop: '20px', marginBottom: '8px' }}>O que cada parte significa:</p>
          {[
            { icon: '⚠️', title: 'Aviso amarelo', desc: 'Você tem aulas passadas sem confirmação. Acesse o Histórico para resolver.' },
            { icon: '📅', title: 'Aulas de hoje', desc: 'Todas as suas aulas programadas para o dia atual.' },
            { icon: '🔵', title: 'Entrar no Zoom', desc: 'Botão azul que aparece nas aulas — clique para entrar diretamente na videoconferência.' },
            { icon: '📆', title: 'Próximas aulas', desc: 'Aulas dos próximos 6 dias para você se programar.' },
            { icon: '📊', title: 'Aulas por nível', desc: 'Resumo de quantas aulas você deu no mês atual, separadas por nível.' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 700, color: '#0d2e1e' }}>{item.title}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#4a5a4a' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <hr style={s.divider} />

        {/* ─── 3. Confirmar aula ──────────────────────────────────────── */}
        <section style={s.section} id="secao-3">
          <p style={s.label}>Seção 3</p>
          <h2 style={s.h2}>Como confirmar uma aula ✅</h2>
          <p style={s.p}>
            Confirmar a aula é <strong>muito importante</strong> — é ela que garante que a aula entre no seu pagamento. Sem a sua confirmação, a aula não é contada.
          </p>

          <div style={s.tip}>
            ⏰ <strong>Quando confirmar?</strong> Logo após a aula terminar. A opção de confirmação só aparece quando o horário da aula já passou.
          </div>

          <p style={{ ...s.label, marginTop: '20px', marginBottom: '12px' }}>Passo a passo:</p>

          <div style={s.step}>
            <div style={s.stepNum}>1</div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#0d2e1e' }}>Acesse a aba "Início"</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#4a5a4a' }}>No menu no topo da tela, clique em <strong>Início</strong>. Você verá a aula que acabou de ministrar.</p>
            </div>
          </div>

          <div style={s.step}>
            <div style={s.stepNum}>2</div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#0d2e1e' }}>Localize a aula que terminou</p>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#4a5a4a' }}>Após o horário da aula, a área de confirmação aparece automaticamente:</p>
              <div style={s.mockup}>
                <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 800, color: '#0d2e1e' }}>14:00 – 15:00</p>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#1e6b40' }}>João Silva</p>
                <div style={{ borderTop: '1px solid #e8f0e8', paddingTop: '10px', marginTop: '4px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6b8c6b' }}>Como foi a aula?</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ ...s.chip('#1e6b40', 'white'), padding: '7px 16px', cursor: 'pointer', border: 'none', fontSize: '12px' }}>✓ Aula realizada</span>
                    <span style={{ ...s.chip('#fee2e2', '#991b1b'), padding: '7px 16px', cursor: 'pointer', fontSize: '12px' }}>✗ Não houve aula</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={s.step}>
            <div style={s.stepNum}>3</div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#0d2e1e' }}>Clique em "✓ Aula realizada"</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#4a5a4a' }}>Se a aula aconteceu normalmente, clique neste botão verde. A confirmação é registrada na hora.</p>
            </div>
          </div>

          <div style={s.step}>
            <div style={s.stepNum}>4</div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#0d2e1e' }}>Pronto! A aula foi confirmada</p>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#4a5a4a' }}>O status da aula muda para confirmado:</p>
              <div style={s.mockup}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ margin: '0 0 1px', fontSize: '13px', fontWeight: 700, color: '#0d2e1e' }}>João Silva</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#6b8c6b' }}>14:00 – 15:00 · Médio</p>
                  </div>
                  <span style={s.chip('#dcfce7', '#166534')}>✓ Confirmada</span>
                </div>
              </div>
            </div>
          </div>

          <div style={s.info}>
            ℹ️ <strong>A confirmação é de mão dupla:</strong> a gestão também confirma a aula do lado dela. A aula só entra no pagamento quando <strong>ambos</strong> confirmam.
          </div>
        </section>

        <hr style={s.divider} />

        {/* ─── 4. Aula não houve ──────────────────────────────────────── */}
        <section style={s.section} id="secao-4">
          <p style={s.label}>Seção 4</p>
          <h2 style={s.h2}>O que fazer quando uma aula não aconteceu ✗</h2>
          <p style={s.p}>
            Se a aula estava agendada mas não aconteceu, você deve registrar isso também. Isso ajuda a manter o controle correto.
          </p>

          <p style={{ ...s.label, marginTop: '16px', marginBottom: '12px' }}>Passo a passo:</p>

          <div style={s.step}>
            <div style={s.stepNum}>1</div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#0d2e1e' }}>Clique em "✗ Não houve aula"</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#4a5a4a' }}>Na área de confirmação, clique no botão vermelho.</p>
            </div>
          </div>

          <div style={s.step}>
            <div style={s.stepNum}>2</div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#0d2e1e' }}>Selecione o motivo</p>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#4a5a4a' }}>Um menu aparece para você explicar o que aconteceu:</p>
              <div style={s.mockup}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#0d2e1e' }}>Por que a aula não aconteceu?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { label: 'Aluno faltou', desc: 'O aluno não apareceu' },
                    { label: 'Professor faltou', desc: 'Você precisou cancelar' },
                    { label: 'Não devia existir', desc: 'Erro no agendamento' },
                    { label: 'Outro motivo', desc: 'Algum outro imprevisto' },
                  ].map(op => (
                    <div key={op.label} style={{ background: 'white', border: '1px solid #e8f0e8', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>
                      <p style={{ margin: '0 0 1px', fontSize: '12px', fontWeight: 700, color: '#0d2e1e' }}>{op.label}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6b8c6b' }}>{op.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={s.step}>
            <div style={s.stepNum}>3</div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#0d2e1e' }}>Adicione uma observação (opcional)</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#4a5a4a' }}>Se quiser, escreva uma nota explicando o que aconteceu. Isso fica visível para a gestão.</p>
            </div>
          </div>

          <div style={s.tip}>
            ⚠️ <strong>Aulas não realizadas não entram no pagamento.</strong> Isso é justo para todos — a gestão e o aluno também precisam saber o que aconteceu.
          </div>
        </section>

        <hr style={s.divider} />

        {/* ─── 5. Histórico ───────────────────────────────────────────── */}
        <section style={s.section} id="secao-5">
          <p style={s.label}>Seção 5</p>
          <h2 style={s.h2}>Histórico — consultar aulas passadas 📋</h2>
          <p style={s.p}>
            Na aba <strong>Histórico</strong> você vê todas as suas aulas passadas organizadas por mês. Também é onde você confirma aulas que esqueceu de confirmar na Página Inicial.
          </p>

          {/* Mockup do histórico */}
          <div style={s.mockup}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '1px' }}>Histórico</p>
              <select style={{ fontSize: '12px', border: '1px solid #e0f0e6', borderRadius: '6px', padding: '4px 8px', color: '#0d2e1e' }}>
                <option>setembro 2026</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={s.chip('#dcfce7', '#166534')}>✓ 8 confirmadas</span>
              <span style={s.chip('#fee2e2', '#991b1b')}>✗ 1 não realizada</span>
              <span style={s.chip('#fef3c7', '#92400e')}>⏳ 2 pendentes</span>
            </div>
            {[
              { dia: 'Qua', num: '17', nome: 'João Silva', hora: '14:00 – 15:00', nivel: 'Médio', status: 'confirmada' },
              { dia: 'Seg', num: '15', nome: 'Maria Oliveira', hora: '10:00 – 11:00', nivel: 'Fundamental', status: 'pendente' },
              { dia: 'Sex', num: '12', nome: 'Carlos Souza', hora: '16:00 – 17:00', nivel: 'Superior', status: 'nao_houve' },
            ].map((a, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '10px 12px', border: '1px solid #e8f0e8', marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ textAlign: 'center', minWidth: '36px' }}>
                  <p style={{ margin: 0, fontSize: '9px', color: '#9dbfa9' }}>{a.dia}</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0d2e1e', lineHeight: 1 }}>{a.num}</p>
                </div>
                <div style={{ width: '1px', alignSelf: 'stretch', background: '#e8f0e8' }} />
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                  <div>
                    <p style={{ margin: '0 0 1px', fontSize: '12px', fontWeight: 700, color: '#0d2e1e' }}>{a.nome}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#6b8c6b' }}>{a.hora} · {a.nivel}</p>
                  </div>
                  {a.status === 'confirmada' && <span style={s.chip('#dcfce7', '#166534')}>✓ Confirmada</span>}
                  {a.status === 'pendente'   && <span style={s.chip('#fef3c7', '#92400e')}>⏳ Pendente</span>}
                  {a.status === 'nao_houve' && <span style={s.chip('#fee2e2', '#991b1b')}>✗ Não houve</span>}
                </div>
              </div>
            ))}
          </div>

          <p style={{ ...s.label, marginTop: '20px', marginBottom: '8px' }}>O que cada cor significa:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { chip: s.chip('#dcfce7', '#166534'), label: '✓ Confirmada', desc: 'Você e a gestão confirmaram — aula conta para o pagamento.' },
              { chip: s.chip('#fef3c7', '#92400e'), label: '⏳ Pendente', desc: 'Você ainda não confirmou. Clique na aula para confirmar.' },
              { chip: s.chip('#fee2e2', '#991b1b'), label: '✗ Não houve', desc: 'Registrado que a aula não aconteceu.' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'white', border: '1px solid #e8f0e8', borderRadius: '10px' }}>
                <span style={item.chip}>{item.label}</span>
                <p style={{ margin: 0, fontSize: '13px', color: '#4a5a4a' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={s.info}>
            📅 <strong>Trocar de mês:</strong> Use o seletor no canto superior direito do Histórico para ver meses anteriores (até 6 meses atrás).
          </div>
        </section>

        <hr style={s.divider} />

        {/* ─── 6. Pagamentos ──────────────────────────────────────────── */}
        <section style={s.section} id="secao-6">
          <p style={s.label}>Seção 6</p>
          <h2 style={s.h2}>Pagamentos — ver o que você tem a receber 💰</h2>
          <p style={s.p}>
            Na aba <strong>Pagamentos</strong> você vê o resumo do mês atual e o histórico de meses anteriores.
          </p>

          {/* Mockup de pagamentos */}
          <div style={s.mockup}>
            <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: 700, color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '1px' }}>Pagamentos</p>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8f0e8', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f7f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0d2e1e' }}>setembro 2026</p>
                <span style={s.chip('#fef3c7', '#92400e')}>Pendente</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#9dbfa9', textTransform: 'uppercase' }}>Aulas confirmadas</p>
                  <p style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#0d2e1e', lineHeight: 1 }}>8</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#9dbfa9', textTransform: 'uppercase' }}>Valor estimado</p>
                  <p style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#1e6b40', lineHeight: 1 }}>R$ 640,00</p>
                </div>
              </div>
            </div>

            <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#9dbfa9', textTransform: 'uppercase', letterSpacing: '1px' }}>Histórico</p>
            {[
              { mes: 'agosto 2026', aulas: 10, valor: 'R$ 800,00', status: 'pago', data: '05/09/2026' },
              { mes: 'julho 2026',  aulas: 9,  valor: 'R$ 720,00', status: 'pago', data: '04/08/2026' },
            ].map((p, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e8f0e8', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 700, color: '#0d2e1e' }}>{p.mes}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#6b8c6b' }}>{p.aulas} aulas · pago em {p.data}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e6b40' }}>{p.valor}</p>
                  <span style={s.chip('#dcfce7', '#166534')}>Pago</span>
                </div>
              </div>
            ))}
          </div>

          <p style={{ ...s.label, marginTop: '20px', marginBottom: '8px' }}>O que cada status significa:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { chip: s.chip('#f1f5f9', '#475569'), label: 'A calcular', desc: 'Nenhuma aula confirmada ainda neste mês.' },
              { chip: s.chip('#fef3c7', '#92400e'), label: 'Pendente', desc: 'A gestão já calculou o valor mas o pagamento ainda não foi feito.' },
              { chip: s.chip('#dcfce7', '#166534'), label: 'Pago', desc: 'O repasse foi realizado. Você pode ver a data exata.' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'white', border: '1px solid #e8f0e8', borderRadius: '10px' }}>
                <span style={item.chip}>{item.label}</span>
                <p style={{ margin: 0, fontSize: '13px', color: '#4a5a4a' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={s.tip}>
            ⚠️ <strong>O valor é uma estimativa</strong> até que a gestão feche o mês. O valor final pode mudar se novas aulas forem confirmadas antes do fechamento.
          </div>
        </section>

        <hr style={s.divider} />

        {/* ─── 7. Configurações ───────────────────────────────────────── */}
        <section style={s.section} id="secao-7">
          <p style={s.label}>Seção 7</p>
          <h2 style={s.h2}>Configurações — atualizar seus dados ⚙️</h2>
          <p style={s.p}>
            Em <strong>Configurações</strong> você pode atualizar seu e-mail de acesso, número de telefone e senha.
          </p>

          <div style={s.mockup}>
            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#0d2e1e' }}>Dados de acesso</p>
            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: '0 0 3px', fontSize: '11px', color: '#6b8c6b' }}>E-mail</p>
              <div style={{ background: 'white', border: '1px solid #e0f0e6', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#0d2e1e' }}>professor@email.com</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ margin: '0 0 3px', fontSize: '11px', color: '#6b8c6b' }}>Telefone</p>
              <div style={{ background: 'white', border: '1px solid #e0f0e6', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#0d2e1e' }}>(11) 99999-0000</div>
            </div>
            <div style={{ background: '#1e6b40', color: 'white', borderRadius: '8px', padding: '8px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>Salvar alterações</div>
            <hr style={{ border: 'none', borderTop: '1px solid #e8f0e8', margin: '14px 0' }} />
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#0d2e1e' }}>Alterar senha</p>
            {['Senha atual', 'Nova senha', 'Confirmar nova senha'].map(label => (
              <div key={label} style={{ marginBottom: '8px' }}>
                <p style={{ margin: '0 0 3px', fontSize: '11px', color: '#6b8c6b' }}>{label}</p>
                <div style={{ background: 'white', border: '1px solid #e0f0e6', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#9dbfa9' }}>••••••••</div>
              </div>
            ))}
          </div>

          <div style={s.info}>
            🔒 <strong>Esqueceu sua senha?</strong> Na tela de login do portal, clique em <em>"Esqueci minha senha"</em> — você vai receber um link por e-mail para criar uma nova.
          </div>
        </section>

        <hr style={s.divider} />

        {/* ─── 8. FAQ ─────────────────────────────────────────────────── */}
        <section style={s.section} id="secao-8">
          <p style={s.label}>Seção 8</p>
          <h2 style={s.h2}>Perguntas frequentes ❓</h2>

          {[
            {
              q: 'Esqueci de confirmar uma aula. O que faço?',
              a: 'Acesse o Histórico e selecione o mês da aula. Você verá a aula com status "⏳ Pendente". Clique nela para confirmar — funciona igual à Página Inicial.',
            },
            {
              q: 'A aula aparece no histórico mas não no pagamento. Por quê?',
              a: 'Para entrar no pagamento, a aula precisa ser confirmada por você E pela gestão. Se você já confirmou, aguarde a confirmação do lado da gestão.',
            },
            {
              q: 'Não estou recebendo o lembrete de aula por e-mail.',
              a: 'Os lembretes são enviados 2 horas antes da aula. Verifique a caixa de spam. Se o problema persistir, fale com a gestão para verificar se seu e-mail está cadastrado corretamente em Configurações.',
            },
            {
              q: 'O link do Zoom não está aparecendo na aula.',
              a: 'O link é inserido pela gestão no momento do agendamento. Se estiver faltando, entre em contato com a gestão para adicionar o link antes da aula.',
            },
            {
              q: 'Posso acessar o portal pelo celular?',
              a: 'Sim! O portal funciona no navegador do celular (Chrome, Safari). Abra o link e faça login normalmente. Para facilitar o acesso, você pode adicionar à tela inicial do celular.',
            },
            {
              q: 'O valor do pagamento está diferente do que esperava.',
              a: 'O valor é calculado com base nas aulas confirmadas por ambos (você e a gestão) e na tabela de valores por nível de ensino. Se tiver dúvidas, entre em contato com a gestão.',
            },
          ].map((faq, i) => (
            <div key={i} style={{ ...s.card, marginBottom: '10px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 700, color: '#0d2e1e' }}>
                {faq.q}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#4a5a4a', lineHeight: 1.6 }}>
                {faq.a}
              </p>
            </div>
          ))}

          <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac', borderRadius: '12px', padding: '20px', marginTop: '24px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#166534' }}>Ainda tem dúvidas?</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#4a5a4a' }}>
              Entre em contato com a gestão pelo e-mail{' '}
              <a href="mailto:gestao@desttra.com" style={{ color: '#1e6b40', fontWeight: 600 }}>gestao@desttra.com</a>
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
