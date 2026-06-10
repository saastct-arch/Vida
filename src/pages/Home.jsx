import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Sparkles, Sun, Moon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { supabase } from '../lib/supabase.js'
import { toISODate, dataExtenso, money, number } from '../lib/format.js'
import { diffDias } from '../lib/dates.js'
import { vrDoMes, proximosEventos } from '../lib/finance.js'
import { gerarResumoDiario } from '../lib/ia.js'
import { coletarContexto } from '../lib/iaContext.js'
import { REFEICOES, DATA_CASAMENTO_PADRAO } from '../lib/constants.js'
import { ProgressBar, Badge, SectionHead, Skeleton } from '../components/ui.jsx'

export default function Home() {
  const { user } = useAuth()
  const { tema, alternar } = useTheme()
  const navigate = useNavigate()
  const hoje = toISODate(new Date())

  const [resumo, setResumo] = useState(null)
  const [carregandoResumo, setCarregandoResumo] = useState(true)
  const [dados, setDados] = useState(null)

  // Carrega dados de saldo, casamento, refeições e treino do dia.
  const carregar = useCallback(async () => {
    const ano = new Date().getFullYear()
    const mes = new Date().getMonth()
    const [saldo, config, refs, treino] = await Promise.all([
      supabase.from('saldo_conta').select('saldo').eq('user_id', user.id).order('data', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('configuracoes').select('data_casamento').eq('user_id', user.id).maybeSingle(),
      supabase.from('refeicoes_registros').select('refeicao,concluida').eq('user_id', user.id).eq('data', hoje),
      supabase.from('treino_registros').select('concluido,sem_treino').eq('user_id', user.id).eq('data', hoje).maybeSingle(),
    ])
    const dataCasamento = config.data?.data_casamento || DATA_CASAMENTO_PADRAO
    setDados({
      saldoConta: Number(saldo.data?.saldo ?? 0),
      vr: vrDoMes(ano, mes),
      diasCasamento: diffDias(hoje, dataCasamento),
      refeicoesFeitas: (refs.data || []).filter((r) => r.concluida).map((r) => r.refeicao),
      treino: treino.data,
    })
  }, [user, hoje])

  useEffect(() => { carregar() }, [carregar])

  // Resumo diário (IA — Haiku).
  useEffect(() => {
    let ativo = true
    setCarregandoResumo(true)
    coletarContexto(user.id)
      .then((ctx) => gerarResumoDiario(ctx))
      .then((txt) => { if (ativo) setResumo(txt) })
      .catch(() => { if (ativo) setResumo(null) })
      .finally(() => { if (ativo) setCarregandoResumo(false) })
    return () => { ativo = false }
  }, [user])

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  // Pendências do dia
  const pendencias = []
  if (dados) {
    const obrigatoriasFeitas = dados.refeicoesFeitas
    const faltamObrig = REFEICOES.filter((r) => r.obrigatoria && !obrigatoriasFeitas.includes(r.nome))
    if (faltamObrig.length) {
      pendencias.push({
        cor: 'red', badge: 'obrigatório',
        titulo: 'Alimentação não registrada',
        sub: faltamObrig.map((r) => r.nome).join(' · '),
        acao: 'Registrar agora', destino: '/saude',
      })
    }
    if (!dados.treino?.concluido && !dados.treino?.sem_treino) {
      pendencias.push({
        cor: 'amber', badge: 'pendente',
        titulo: 'Treino do dia não registrado',
        sub: 'Registre suas séries ou marque descanso',
        acao: 'Abrir treino', destino: '/saude',
      })
    }
  }

  const eventos = proximosEventos(hoje, 5)

  return (
    <div>
      {/* Header */}
      <div className="row-between">
        <div>
          <h1 className="font-display" style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>{saudacao}</h1>
          <div className="font-label text-muted" style={{ fontSize: 12, marginTop: 2 }}>{dataExtenso(hoje)}</div>
        </div>
        <div className="row gap-8">
          <button onClick={alternar} className="btn-ghost" style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 8 }} aria-label="Alternar tema">
            {tema === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="btn-ghost" style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 8, position: 'relative' }} aria-label="Notificações">
            <Bell size={17} />
            {pendencias.length > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--red)' }} />
            )}
          </button>
        </div>
      </div>

      {/* Card IA */}
      <div className="card bl-blue card-pad page-section">
        <div className="row gap-6" style={{ marginBottom: 8 }}>
          <Sparkles size={13} color="var(--blue)" />
          <span className="font-label" style={{ fontSize: 10, color: 'var(--blue)', letterSpacing: '0.06em' }}>NEXUS IA</span>
        </div>
        {carregandoResumo ? (
          <div className="col gap-6">
            <Skeleton h={12} /><Skeleton h={12} w="92%" /><Skeleton h={12} w="70%" />
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {resumo || 'Configure a IA (ANTHROPIC_API_KEY) para ver seu resumo diário personalizado.'}
          </p>
        )}
      </div>

      {/* 3 cards de saldo */}
      <div className="grid grid-3 page-section">
        <SaldoCard titulo="Conta Itaú" cor="blue" valor={dados ? money(dados.saldoConta) : '—'} progresso={dados ? Math.min(100, (dados.saldoConta / 4500) * 100) : 0} loading={!dados} />
        <SaldoCard titulo="VR" cor="green" valor={dados ? money(dados.vr.total) : '—'} progresso={70} loading={!dados} />
        <SaldoCard titulo="Casamento" cor="amber" valor={dados ? `${number(dados.diasCasamento)} dias` : '—'} progresso={dados ? Math.max(5, 100 - (dados.diasCasamento / 730) * 100) : 0} loading={!dados} />
      </div>

      {/* Pendências */}
      <div className="page-section">
        <SectionHead>Pendências</SectionHead>
        {!dados ? (
          <Skeleton h={60} />
        ) : pendencias.length === 0 ? (
          <div className="empty">Tudo em dia por aqui. ✦</div>
        ) : (
          <div className="col gap-8">
            {pendencias.map((p, i) => (
              <div key={i} className={`card bl-${p.cor} card-pad`} style={{ padding: 12 }}>
                <div className="row-between" style={{ gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row gap-8" style={{ marginBottom: 4 }}>
                      <Badge tipo={p.cor}>{p.badge}</Badge>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.titulo}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{p.sub}</div>
                  </div>
                  <button className={`btn btn-sm btn-outline-${p.cor}`} onClick={() => navigate(p.destino)} style={{ whiteSpace: 'nowrap' }}>
                    {p.acao}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linha do tempo */}
      <div className="page-section">
        <SectionHead>Próximos eventos</SectionHead>
        <div className="card card-pad">
          {eventos.length === 0 ? (
            <div className="empty">Sem eventos próximos.</div>
          ) : (
            <Timeline eventos={eventos} />
          )}
        </div>
      </div>
    </div>
  )
}

function SaldoCard({ titulo, cor, valor, progresso, loading }) {
  return (
    <div className="card" style={{ padding: '14px 14px 0', overflow: 'hidden' }}>
      <div className="font-label text-muted" style={{ fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{titulo}</div>
      {loading ? (
        <Skeleton h={22} w="70%" style={{ margin: '8px 0' }} />
      ) : (
        <div className="mono" style={{ fontSize: 20, fontWeight: 500, color: `var(--${cor})`, margin: '6px 0 12px' }}>{valor}</div>
      )}
      <div style={{ margin: '0 -14px' }}><ProgressBar valor={progresso} cor={cor} altura={3} /></div>
    </div>
  )
}

// Cor por tipo de evento.
function corEvento(tipo) {
  if (tipo === 'entrada') return 'green'
  if (tipo === 'vencimento') return 'amber'
  if (tipo === 'aporte') return 'violet'
  return 'red'
}

function Timeline({ eventos }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 6 }}>
      {eventos.map((e, i) => {
        const cor = corEvento(e.tipo)
        const ultimo = i === eventos.length - 1
        return (
          <div key={i} style={{ position: 'relative', paddingLeft: 22, paddingBottom: ultimo ? 0 : 16 }}>
            {!ultimo && <span style={{ position: 'absolute', left: 3.5, top: 12, bottom: -4, width: 1, background: 'var(--border)' }} />}
            <span style={{ position: 'absolute', left: 0, top: 4, width: 8, height: 8, borderRadius: '50%', border: `2px solid var(--${cor})`, background: `var(--${cor}-light-bg)` }} />
            <div className="font-label text-muted" style={{ fontSize: 10 }}>{e.data.slice(8, 10)}/{e.data.slice(5, 7)}</div>
            <div className="row-between" style={{ gap: 8 }}>
              <span style={{ fontSize: 13 }}>{e.descricao}</span>
              {e.tipo !== 'vencimento' && (
                <span className="mono" style={{ fontSize: 12, color: `var(--${cor})` }}>
                  {e.valor >= 0 ? '+' : '−'}{money(Math.abs(e.valor))}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
