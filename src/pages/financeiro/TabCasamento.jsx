import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { INVEST_INICIAL, INVEST_METAS, DATA_CASAMENTO_PADRAO } from '../../lib/constants.js'
import { diffDias } from '../../lib/dates.js'
import { money, dataBR, toISODate, number } from '../../lib/format.js'
import { Badge, Modal, SectionHead, ProgressBar, Skeleton } from '../../components/ui.jsx'

const META = INVEST_METAS.fundo_casamento

export default function TabCasamento({ userId }) {
  const toast = useToast()
  const [dados, setDados] = useState(null)
  const [modal, setModal] = useState(false)

  const carregar = useCallback(async () => {
    const [config, saldo, forn] = await Promise.all([
      supabase.from('configuracoes').select('data_casamento').eq('user_id', userId).maybeSingle(),
      supabase.from('investimentos_saldos').select('fundo_casamento,data').eq('user_id', userId).order('data', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('fornecedores_casamento').select('*').eq('user_id', userId).order('data_vencimento', { ascending: true }),
    ])
    setDados({
      dataCasamento: config.data?.data_casamento || DATA_CASAMENTO_PADRAO,
      fundo: Number(saldo.data?.fundo_casamento ?? INVEST_INICIAL.fundo_casamento),
      fornecedores: forn.data || [],
    })
  }, [userId])

  useEffect(() => { carregar() }, [carregar])

  async function salvarData(nova) {
    await supabase.from('configuracoes').upsert({ user_id: userId, data_casamento: nova }, { onConflict: 'user_id' })
    setDados((d) => ({ ...d, dataCasamento: nova }))
  }

  async function marcarPago(f) {
    await supabase.from('fornecedores_casamento').update({ valor_pago: f.valor_total, status: 'pago' }).eq('id', f.id)
    toast.ok('Fornecedor marcado como pago.')
    carregar()
  }
  async function excluir(id) {
    await supabase.from('fornecedores_casamento').delete().eq('id', id)
    carregar()
  }

  if (!dados) return <Skeleton h={300} />

  const dias = diffDias(toISODate(new Date()), dados.dataCasamento)
  const pct = Math.min(100, (dados.fundo / META) * 100)

  return (
    <div>
      {/* Contagem regressiva */}
      <div className="card bl-amber card-pad center" style={{ flexDirection: 'column', padding: 22 }}>
        <div className="font-label" style={{ fontSize: 11, color: 'var(--amber-dark)', letterSpacing: '0.06em' }}>CONTAGEM REGRESSIVA</div>
        <div className="mono" style={{ fontSize: 46, color: 'var(--amber)', fontWeight: 500, lineHeight: 1.1, margin: '6px 0' }}>{number(Math.max(0, dias))}</div>
        <div className="text-muted" style={{ fontSize: 12 }}>dias para o casamento</div>
        <label style={{ marginTop: 12, position: 'relative' }}>
          <span className="btn btn-outline-amber btn-sm">📅 {dataBR(dados.dataCasamento)}</span>
          <input type="date" value={dados.dataCasamento} onChange={(e) => e.target.value && salvarData(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        </label>
      </div>

      {/* Fundo */}
      <div className="card card-pad" style={{ marginTop: 12 }}>
        <div className="row-between" style={{ marginBottom: 8 }}>
          <span className="font-label" style={{ fontSize: 12 }}>Fundo casamento</span>
          <span className="mono" style={{ fontSize: 16, color: 'var(--amber-dark)' }}>{money(dados.fundo)} <span className="text-muted">/ {money(META)}</span></span>
        </div>
        <ProgressBar valor={pct} cor="amber" />
      </div>

      {/* Fornecedores */}
      <div className="page-section">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <SectionHead>Fornecedores</SectionHead>
          <button className="btn btn-sm btn-amber" onClick={() => setModal(true)}><Plus size={15} /> Adicionar</button>
        </div>
        {dados.fornecedores.length === 0 ? (
          <div className="empty">Nenhum fornecedor cadastrado.</div>
        ) : (
          <div className="col gap-8">
            {dados.fornecedores.map((f) => {
              const d = f.data_vencimento ? diffDias(toISODate(new Date()), f.data_vencimento) : null
              const pago = f.status === 'pago'
              const atrasado = !pago && d != null && d < 0
              const alerta = !pago && d != null && d >= 0 && d <= 7
              return (
                <div key={f.id} className={`card ${pago ? 'bl-green' : atrasado ? 'bl-red' : ''} card-pad`} style={{ padding: 12 }}>
                  <div className="row-between" style={{ gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{f.nome}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{f.servico}</div>
                      <div className="row gap-6 wrap" style={{ marginTop: 4 }}>
                        {pago ? <Badge tipo="green">pago</Badge> : atrasado ? <Badge tipo="red">atrasado</Badge> : alerta ? <Badge tipo="amber">vence em {d}d</Badge> : <Badge tipo="amber">pendente</Badge>}
                        {f.data_vencimento && <span className="text-muted font-label" style={{ fontSize: 11 }}>venc. {dataBR(f.data_vencimento)}</span>}
                      </div>
                    </div>
                    <div className="col" style={{ alignItems: 'flex-end', gap: 6 }}>
                      <span className="mono" style={{ fontSize: 14, color: 'var(--amber-dark)' }}>{money(f.valor_total)}</span>
                      <span className="text-muted mono" style={{ fontSize: 11 }}>pago {money(f.valor_pago || 0)}</span>
                      <div className="row gap-6">
                        {!pago && <button className="btn btn-sm btn-outline-green" onClick={() => marcarPago(f)}><Check size={13} /> Pago</button>}
                        <button className="btn-ghost" style={{ border: 0, padding: 4, color: 'var(--text-muted)' }} onClick={() => excluir(f.id)}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && <FornecedorModal userId={userId} onClose={() => setModal(false)} onSaved={carregar} toast={toast} />}
    </div>
  )
}

function FornecedorModal({ userId, onClose, onSaved, toast }) {
  const [f, setF] = useState({ nome: '', servico: '', valor_total: '', valor_pago: '', data_vencimento: '' })
  const [salvando, setSalvando] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function salvar() {
    if (!f.nome) return toast.erro('Informe o nome do fornecedor.')
    setSalvando(true)
    const { error } = await supabase.from('fornecedores_casamento').insert({
      user_id: userId, nome: f.nome, servico: f.servico,
      valor_total: Number(String(f.valor_total).replace(',', '.')) || 0,
      valor_pago: Number(String(f.valor_pago).replace(',', '.')) || 0,
      data_vencimento: f.data_vencimento || null,
      status: 'pendente',
    })
    setSalvando(false)
    if (error) return toast.erro('Erro: ' + error.message)
    toast.ok('Fornecedor adicionado.')
    onSaved(); onClose()
  }

  return (
    <Modal aberto onClose={onClose} titulo="Adicionar fornecedor"
      footer={<button className="btn btn-amber btn-full" onClick={salvar} disabled={salvando}>Adicionar</button>}>
      <div className="col gap-12">
        <div className="field"><label>Nome</label><input className="input focus-amber" value={f.nome} onChange={set('nome')} placeholder="Ex.: Buffet Encanto" /></div>
        <div className="field"><label>Serviço</label><input className="input focus-amber" value={f.servico} onChange={set('servico')} placeholder="Ex.: Buffet, fotografia…" /></div>
        <div className="grid grid-2">
          <div className="field"><label>Valor total (R$)</label><input type="number" inputMode="decimal" className="input input-num focus-amber" value={f.valor_total} onChange={set('valor_total')} placeholder="0,00" /></div>
          <div className="field"><label>Valor pago (R$)</label><input type="number" inputMode="decimal" className="input input-num focus-amber" value={f.valor_pago} onChange={set('valor_pago')} placeholder="0,00" /></div>
        </div>
        <div className="field"><label>Vencimento</label><input type="date" className="input focus-amber" value={f.data_vencimento} onChange={set('data_vencimento')} /></div>
      </div>
    </Modal>
  )
}
