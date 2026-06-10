import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'
import { Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useToast } from '../../contexts/ToastContext.jsx'
import {
  INVEST_INICIAL, INVEST_METAS, APORTES, FASES_CASAMENTO, MARCOS,
  DESTINOS_APORTE, CDI_PADRAO, DATA_CASAMENTO_PADRAO,
} from '../../lib/constants.js'
import { serieProjecao } from '../../lib/finance.js'
import { money, dataBR, toISODate, number } from '../../lib/format.js'
import { Badge, Modal, SectionHead, Skeleton } from '../../components/ui.jsx'

export default function Investimentos() {
  const { user } = useAuth()
  const toast = useToast()
  const [dados, setDados] = useState(null)
  const [cdi, setCdi] = useState(CDI_PADRAO)
  const [dataCasamento, setDataCasamento] = useState(DATA_CASAMENTO_PADRAO)
  const [modal, setModal] = useState(null) // 'aporte' | 'provento'

  const carregar = useCallback(async () => {
    const [config, saldo, aportes, proventos] = await Promise.all([
      supabase.from('configuracoes').select('cdi_atual,data_casamento').eq('user_id', user.id).maybeSingle(),
      supabase.from('investimentos_saldos').select('*').eq('user_id', user.id).order('data', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('investimentos_aportes').select('*').eq('user_id', user.id).order('data', { ascending: true }),
      supabase.from('proventos').select('*').eq('user_id', user.id).order('data', { ascending: false }),
    ])
    setCdi(Number(config.data?.cdi_atual ?? CDI_PADRAO))
    setDataCasamento(config.data?.data_casamento || DATA_CASAMENTO_PADRAO)
    setDados({
      saldos: {
        reserva_emergencia: Number(saldo.data?.reserva_emergencia ?? INVEST_INICIAL.reserva_emergencia),
        fundo_casamento: Number(saldo.data?.fundo_casamento ?? INVEST_INICIAL.fundo_casamento),
        fiis: Number(saldo.data?.fiis ?? INVEST_INICIAL.fiis),
      },
      aportes: aportes.data || [],
      proventos: proventos.data || [],
    })
  }, [user])

  useEffect(() => { carregar() }, [carregar])

  const projecao = useMemo(() => serieProjecao({ cdi, dataCasamento }), [cdi, dataCasamento])

  async function salvarCdi(novo) {
    const frac = Number(String(novo).replace(',', '.')) / 100
    setCdi(frac)
    await supabase.from('configuracoes').upsert({ user_id: user.id, cdi_atual: frac }, { onConflict: 'user_id' })
  }

  if (!dados) return <Skeleton h={400} />

  const { reserva_emergencia: re, fundo_casamento: fc, fiis } = dados.saldos
  const patrimonio = re + fc + fiis
  const chart = projecao.map((p) => ({ label: p.label, projecao: +p.total.toFixed(0) }))
  const proventosRealizado = dados.proventos.reduce((s, p) => s + Number(p.valor || 0), 0)
  const proventosProjetado = dados.proventos.reduce((s, p) => s + Number(p.projetado || 0), 0)

  return (
    <div style={{ '--mod': 'var(--violet)' }}>
      <h1 className="font-display" style={{ fontSize: 18, margin: '0 0 14px' }}>Investimentos</h1>

      {/* Patrimônio total */}
      <div className="card card-pad center" style={{ flexDirection: 'column', padding: 24 }}>
        <div className="font-label text-muted" style={{ fontSize: 11, letterSpacing: '0.06em' }}>PATRIMÔNIO TOTAL</div>
        <div className="mono" style={{ fontSize: 36, color: 'var(--blue)', fontWeight: 500, marginTop: 6 }}>{money(patrimonio)}</div>
        <label className="row gap-8" style={{ marginTop: 12 }}>
          <span className="font-label text-muted" style={{ fontSize: 12 }}>CDI</span>
          <input type="number" inputMode="decimal" className="input input-num focus-blue" style={{ width: 90, padding: '6px 8px', textAlign: 'center' }}
            value={(cdi * 100).toFixed(2)} onChange={(e) => salvarCdi(e.target.value)} step="0.05" />
          <span className="font-label text-muted" style={{ fontSize: 12 }}>% a.a.</span>
        </label>
      </div>

      {/* 3 cards */}
      <div className="page-section grid" style={{ gap: 10 }}>
        <CardInvest titulo="Reserva de Emergência" valor={re} meta={INVEST_METAS.reserva_emergencia}
          info={`Aporte ${money(APORTES.reserva)}/mês · CDB 100% CDI · prazo mar/2027`} />
        <CardInvest titulo="Fundo Casamento" valor={fc} meta={INVEST_METAS.fundo_casamento}
          info={'Aportes crescentes · LCI/LCA 104% CDI · projeção R$42–48k'} />
        <CardInvest titulo="FIIs" valor={fiis} meta={null}
          info={`Aporte ${money(APORTES.fiis)}/mês · rendimento 12% a.a.`} />
      </div>

      {/* Fases do fundo casamento */}
      <div className="page-section">
        <SectionHead>Fases do fundo casamento</SectionHead>
        <div className="card">
          {FASES_CASAMENTO.map((f, i) => (
            <div key={i} className="row-between" style={{ padding: '10px 14px', borderBottom: i < FASES_CASAMENTO.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13 }}>{f.label}</span>
              <span className="mono" style={{ fontSize: 14, color: 'var(--violet)' }}>{money(f.valor)}/mês</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico patrimonial */}
      <div className="page-section">
        <SectionHead>Projeção patrimonial · até jun/2028</SectionHead>
        <div className="card card-pad" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${number(v / 1000)}k`} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="projecao" name="Projeção" stroke="var(--violet)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Marcos */}
      <div className="page-section">
        <SectionHead>Marcos</SectionHead>
        <div className="col gap-8">
          {MARCOS.map((m, i) => (
            <div key={i} className={`card bl-${m.tipo === 'green' ? 'green' : 'amber'} card-pad`} style={{ padding: 12 }}>
              <div className="row gap-8"><Badge tipo={m.tipo}>{dataBR(m.data).slice(3)}</Badge><span style={{ fontSize: 13 }}>{m.texto}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico de aportes */}
      <div className="page-section">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <SectionHead>Histórico de aportes</SectionHead>
          <button className="btn btn-sm btn-violet" onClick={() => setModal('aporte')}><Plus size={15} /> Confirmar aporte</button>
        </div>
        <HistoricoAportes aportes={dados.aportes} />
      </div>

      {/* Proventos */}
      <div className="page-section">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <SectionHead>Proventos (dividendos)</SectionHead>
          <button className="btn btn-sm btn-outline-violet" onClick={() => setModal('provento')}><Plus size={15} /> Lançar provento</button>
        </div>
        <div className="grid grid-2" style={{ marginBottom: 10 }}>
          <Mini titulo="Projetado" valor={money(proventosProjetado)} cor="text-secondary" />
          <Mini titulo="Realizado" valor={money(proventosRealizado)} cor="violet" />
        </div>
        <div className="card">
          {dados.proventos.length === 0 ? <div className="empty">Nenhum provento lançado.</div> : dados.proventos.map((p) => (
            <div key={p.id} className="row-between" style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
              <div><span style={{ fontSize: 13 }}>{p.origem || 'FII'}</span><div className="text-muted font-label" style={{ fontSize: 11 }}>{dataBR(p.data)}</div></div>
              <div className="row gap-10">
                {p.projetado != null && <span className="mono text-muted" style={{ fontSize: 12 }}>proj. {money(p.projetado)}</span>}
                <span className="mono" style={{ fontSize: 13, color: 'var(--violet)' }}>{money(p.valor)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal === 'aporte' && <AporteModal userId={user.id} saldos={dados.saldos} onClose={() => setModal(null)} onSaved={carregar} toast={toast} />}
      {modal === 'provento' && <ProventoModal userId={user.id} onClose={() => setModal(null)} onSaved={carregar} toast={toast} />}
    </div>
  )
}

function CardInvest({ titulo, valor, meta, info }) {
  const pct = meta ? Math.min(100, (valor / meta) * 100) : null
  const faltante = meta ? Math.max(0, meta - valor) : null
  return (
    <div className="card bl-violet card-pad">
      <div className="row-between" style={{ marginBottom: 6 }}>
        <span className="font-label" style={{ fontSize: 12 }}>{titulo}</span>
        <span className="mono" style={{ fontSize: 16, color: 'var(--violet)' }}>{money(valor)}</span>
      </div>
      <div className="progress" style={{ height: 5 }}>
        <span style={{ width: `${pct ?? 100}%`, background: 'linear-gradient(90deg, var(--violet), var(--blue))' }} />
      </div>
      {pct != null && (
        <div className="row-between" style={{ marginTop: 5 }}>
          <span className="mono text-muted" style={{ fontSize: 11 }}>{number(pct)}%</span>
          <span className="mono text-muted" style={{ fontSize: 11 }}>faltam {money(faltante)}</span>
        </div>
      )}
      <div className="text-muted" style={{ fontSize: 11.5, marginTop: 8 }}>{info}</div>
    </div>
  )
}

function HistoricoAportes({ aportes }) {
  // Calcula "saldo após" acumulado por destino a partir dos valores iniciais.
  const acumulado = { 'Reserva de emergência': INVEST_INICIAL.reserva_emergencia, 'Fundo casamento': INVEST_INICIAL.fundo_casamento, FIIs: INVEST_INICIAL.fiis }
  const linhas = aportes.map((a) => {
    const destino = a.destino || 'FIIs'
    acumulado[destino] = (acumulado[destino] || 0) + Number(a.valor)
    return { ...a, saldoApos: acumulado[destino] }
  }).reverse()

  if (linhas.length === 0) return <div className="empty">Nenhum aporte confirmado.</div>
  return (
    <div className="card">
      {linhas.map((a) => (
        <div key={a.id} className="row-between" style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontSize: 13 }}>{a.destino}</span>
            <div className="text-muted font-label" style={{ fontSize: 11 }}>{dataBR(a.data)}</div>
          </div>
          <div className="col" style={{ alignItems: 'flex-end' }}>
            <span className="mono" style={{ fontSize: 13, color: 'var(--violet)' }}>+{money(Number(a.valor))}</span>
            <span className="mono text-muted" style={{ fontSize: 11 }}>saldo {money(a.saldoApos)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function AporteModal({ userId, saldos, onClose, onSaved, toast }) {
  const [f, setF] = useState({ data: toISODate(new Date()), destino: DESTINOS_APORTE[0].label, valor: '' })
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    const valor = Number(String(f.valor).replace(',', '.'))
    if (!valor) return toast.erro('Informe o valor do aporte.')
    setSalvando(true)
    const campo = DESTINOS_APORTE.find((d) => d.label === f.destino)?.campo
    const { error } = await supabase.from('investimentos_aportes').insert({ user_id: userId, data: f.data, destino: f.destino, valor })
    if (!error && campo) {
      const novo = { ...saldos, [campo]: (saldos[campo] || 0) + valor }
      await supabase.from('investimentos_saldos').insert({ user_id: userId, data: f.data, ...novo })
    }
    setSalvando(false)
    if (error) return toast.erro('Erro: ' + error.message)
    toast.ok('Aporte confirmado.')
    onSaved(); onClose()
  }

  return (
    <Modal aberto onClose={onClose} titulo="Confirmar aporte"
      footer={<button className="btn btn-violet btn-full" onClick={salvar} disabled={salvando}>Confirmar</button>}>
      <div className="col gap-12">
        <div className="field"><label>Data</label><input type="date" className="input focus-blue" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></div>
        <div className="field"><label>Destino</label><select className="select focus-blue" value={f.destino} onChange={(e) => setF({ ...f, destino: e.target.value })}>{DESTINOS_APORTE.map((d) => <option key={d.campo}>{d.label}</option>)}</select></div>
        <div className="field"><label>Valor (R$)</label><input type="number" inputMode="decimal" className="input input-num focus-blue" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} placeholder="0,00" /></div>
      </div>
    </Modal>
  )
}

function ProventoModal({ userId, onClose, onSaved, toast }) {
  const [f, setF] = useState({ data: toISODate(new Date()), origem: '', valor: '', projetado: '' })
  const [salvando, setSalvando] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function salvar() {
    const valor = Number(String(f.valor).replace(',', '.'))
    if (!valor) return toast.erro('Informe o valor recebido.')
    setSalvando(true)
    const { error } = await supabase.from('proventos').insert({
      user_id: userId, data: f.data, origem: f.origem || 'FII', valor,
      projetado: f.projetado ? Number(String(f.projetado).replace(',', '.')) : null,
    })
    setSalvando(false)
    if (error) return toast.erro('Erro: ' + error.message)
    toast.ok('Provento lançado.')
    onSaved(); onClose()
  }

  return (
    <Modal aberto onClose={onClose} titulo="Lançar provento"
      footer={<button className="btn btn-violet btn-full" onClick={salvar} disabled={salvando}>Lançar</button>}>
      <div className="col gap-12">
        <div className="grid grid-2">
          <div className="field"><label>Data</label><input type="date" className="input focus-blue" value={f.data} onChange={set('data')} /></div>
          <div className="field"><label>Origem</label><input className="input focus-blue" value={f.origem} onChange={set('origem')} placeholder="Ex.: MXRF11" /></div>
        </div>
        <div className="grid grid-2">
          <div className="field"><label>Recebido (R$)</label><input type="number" inputMode="decimal" className="input input-num focus-blue" value={f.valor} onChange={set('valor')} placeholder="0,00" /></div>
          <div className="field"><label>Projetado (R$)</label><input type="number" inputMode="decimal" className="input input-num focus-blue" value={f.projetado} onChange={set('projetado')} placeholder="opcional" /></div>
        </div>
      </div>
    </Modal>
  )
}

function Mini({ titulo, valor, cor }) {
  const corStyle = cor === 'text-secondary' ? 'var(--text-secondary)' : `var(--${cor})`
  return (
    <div className="card card-pad" style={{ padding: 12 }}>
      <div className="font-label text-muted" style={{ fontSize: 10, textTransform: 'uppercase' }}>{titulo}</div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: corStyle, marginTop: 4 }}>{valor}</div>
    </div>
  )
}
