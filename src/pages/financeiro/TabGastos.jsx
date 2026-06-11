import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, SlidersHorizontal } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import {
  CATEGORIAS_GASTO, ORIGENS_GASTO, TIPOS_ENTRADA, DESTINOS_ENTRADA,
} from '../../lib/constants.js'
import { money, dataBR, toISODate } from '../../lib/format.js'
import { Badge, Modal, SectionHead, ProgressBar, Skeleton } from '../../components/ui.jsx'

export default function TabGastos({ userId }) {
  const toast = useToast()
  const [gastos, setGastos] = useState(null)
  const [entradas, setEntradas] = useState([])
  const [tetos, setTetos] = useState({})
  const [modal, setModal] = useState(null) // 'gasto' | 'entrada' | 'tetos'
  const [filtroCat, setFiltroCat] = useState('Todas')

  const hoje = new Date()
  const ini = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`

  const carregar = useCallback(async () => {
    const [g, e, c] = await Promise.all([
      supabase.from('gastos').select('*').eq('user_id', userId).order('data', { ascending: false }).limit(120),
      supabase.from('entradas').select('*').eq('user_id', userId).order('data', { ascending: false }).limit(60),
      supabase.from('configuracoes').select('tetos_categoria').eq('user_id', userId).maybeSingle(),
    ])
    setGastos(g.data || [])
    setEntradas(e.data || [])
    setTetos(c.data?.tetos_categoria || {})
  }, [userId])

  useEffect(() => { carregar() }, [carregar])

  if (!gastos) return <Skeleton h={300} />

  // Gastos do mês por categoria (para tetos)
  const gastosMes = gastos.filter((g) => g.data >= ini)
  const porCat = {}
  for (const g of gastosMes) porCat[g.categoria || 'Outros'] = (porCat[g.categoria || 'Outros'] || 0) + Number(g.valor)

  const historico = gastos.filter((g) => filtroCat === 'Todas' || g.categoria === filtroCat)

  async function excluir(id) {
    await supabase.from('gastos').delete().eq('id', id)
    toast.info('Gasto removido.')
    carregar()
  }

  return (
    <div>
      {/* Ações */}
      <div className="row gap-8 wrap">
        <button className="btn btn-blue" onClick={() => setModal('gasto')}><Plus size={16} /> Lançar gasto</button>
        <button className="btn btn-outline-green" onClick={() => setModal('entrada')}><Plus size={16} /> Lançar entrada</button>
        <button className="btn btn-ghost" style={{ border: '1px solid var(--border)' }} onClick={() => setModal('tetos')}><SlidersHorizontal size={15} /> Tetos</button>
      </div>

      {/* Tetos por categoria */}
      <div className="page-section">
        <SectionHead>Tetos por categoria · este mês</SectionHead>
        {Object.keys(tetos).length === 0 ? (
          <div className="empty">Nenhum teto configurado. Clique em <strong>Tetos</strong> para definir.</div>
        ) : (
          <div className="col gap-10">
            {Object.entries(tetos).filter(([, v]) => v > 0).map(([cat, teto]) => {
              const gasto = porCat[cat] || 0
              const pct = (gasto / teto) * 100
              const cor = pct >= 100 ? 'red' : pct >= 80 ? 'amber' : 'blue'
              return (
                <div key={cat} className="card card-pad" style={{ padding: 12 }}>
                  <div className="row-between" style={{ marginBottom: 6 }}>
                    <span className="row gap-8"><span style={{ fontSize: 13 }}>{cat}</span>{pct >= 80 && <Badge tipo={cor === 'red' ? 'red' : 'amber'}>{pct >= 100 ? '100%' : '80%'}</Badge>}</span>
                    <span className="mono text-muted" style={{ fontSize: 12 }}>{money(gasto)} / {money(teto)}</span>
                  </div>
                  <ProgressBar valor={pct} cor={cor} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="page-section">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <SectionHead>Histórico</SectionHead>
          <select className="select" value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}>
            <option>Todas</option>
            {CATEGORIAS_GASTO.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="card">
          {historico.length === 0 ? <div className="empty">Sem lançamentos.</div> : historico.map((g) => (
            <div key={g.id} className="row-between" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5 }}>{g.descricao || g.categoria} {g.parcelado && <span className="text-muted">({g.parcela_atual}/{g.num_parcelas})</span>}</div>
                <div className="row gap-6" style={{ marginTop: 2 }}>
                  <span className="text-muted font-label" style={{ fontSize: 11 }}>{dataBR(g.data)}</span>
                  <Badge tipo="blue">{g.categoria}</Badge>
                  <span className="text-muted" style={{ fontSize: 11 }}>{g.origem}</span>
                </div>
              </div>
              <div className="row gap-8">
                <span className="mono" style={{ fontSize: 13.5, color: 'var(--red)' }}>−{money(Number(g.valor))}</span>
                <button className="btn-ghost" style={{ border: 0, padding: 4, color: 'var(--text-muted)' }} onClick={() => excluir(g.id)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal === 'gasto' && <GastoModal userId={userId} onClose={() => setModal(null)} onSaved={carregar} toast={toast} />}
      {modal === 'entrada' && <EntradaModal userId={userId} onClose={() => setModal(null)} onSaved={carregar} toast={toast} />}
      {modal === 'tetos' && <TetosModal userId={userId} tetos={tetos} onClose={() => setModal(null)} onSaved={carregar} toast={toast} />}
    </div>
  )
}

// ───────── Modal: Lançar gasto ─────────
function GastoModal({ userId, onClose, onSaved, toast }) {
  const [f, setF] = useState({ data: toISODate(new Date()), valor: '', descricao: '', categoria: 'Alimentação', origem: 'Conta', parcelado: false, num_parcelas: 2 })
  const [salvando, setSalvando] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function salvar() {
    const valor = Number(String(f.valor).replace(',', '.'))
    if (!valor) return toast.erro('Informe o valor.')
    setSalvando(true)
    if (f.parcelado) {
      const n = Math.max(2, parseInt(f.num_parcelas, 10) || 2)
      const parcela = +(valor / n).toFixed(2)
      const { data: pai, error } = await supabase.from('gastos').insert({ user_id: userId, data: f.data, descricao: f.descricao, valor: parcela, categoria: f.categoria, origem: f.origem, parcelado: true, num_parcelas: n, parcela_atual: 1 }).select().single()
      if (error) { setSalvando(false); return toast.erro('Erro: ' + error.message) }
      const linhas = []
      for (let i = 2; i <= n; i++) {
        const d = new Date(f.data + 'T00:00:00'); d.setMonth(d.getMonth() + (i - 1))
        linhas.push({ user_id: userId, data: toISODate(d), descricao: f.descricao, valor: parcela, categoria: f.categoria, origem: f.origem, parcelado: true, num_parcelas: n, parcela_atual: i, gasto_pai_id: pai.id })
      }
      if (linhas.length) await supabase.from('gastos').insert(linhas)
    } else {
      const { error } = await supabase.from('gastos').insert({ user_id: userId, data: f.data, descricao: f.descricao, valor, categoria: f.categoria, origem: f.origem, parcelado: false })
      if (error) { setSalvando(false); return toast.erro('Erro: ' + error.message) }
    }
    setSalvando(false)
    toast.ok('Gasto lançado.')
    onSaved(); onClose()
  }

  return (
    <Modal aberto onClose={onClose} titulo="Lançar gasto"
      footer={<button className="btn btn-blue btn-full" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar gasto'}</button>}>
      <div className="col gap-12">
        <div className="grid grid-2">
          <Field label="Data"><input type="date" className="input focus-blue" value={f.data} onChange={set('data')} /></Field>
          <Field label="Valor (R$)"><input type="number" inputMode="decimal" className="input input-num focus-blue" value={f.valor} onChange={set('valor')} placeholder="0,00" /></Field>
        </div>
        <Field label="Descrição"><input className="input focus-blue" value={f.descricao} onChange={set('descricao')} placeholder="Ex.: almoço, gasolina…" /></Field>
        <div className="grid grid-2">
          <Field label="Categoria"><select className="select focus-blue" value={f.categoria} onChange={set('categoria')}>{CATEGORIAS_GASTO.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Origem"><select className="select focus-blue" value={f.origem} onChange={set('origem')}>{ORIGENS_GASTO.map((o) => <option key={o}>{o}</option>)}</select></Field>
        </div>
        <label className="row gap-8" style={{ fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.parcelado} onChange={(e) => setF({ ...f, parcelado: e.target.checked })} /> Parcelado?
        </label>
        {f.parcelado && <Field label="Nº de parcelas"><input type="number" className="input input-num focus-blue" value={f.num_parcelas} onChange={set('num_parcelas')} min={2} /></Field>}
      </div>
    </Modal>
  )
}

// ───────── Modal: Lançar entrada ─────────
function EntradaModal({ userId, onClose, onSaved, toast }) {
  const [f, setF] = useState({ data: toISODate(new Date()), valor: '', tipo: 'Salário', descricao: '', destino: 'Conta' })
  const [salvando, setSalvando] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function salvar() {
    const valor = Number(String(f.valor).replace(',', '.'))
    if (!valor) return toast.erro('Informe o valor.')
    setSalvando(true)
    const { error } = await supabase.from('entradas').insert({ user_id: userId, data: f.data, descricao: f.descricao, valor, tipo: f.tipo, destino: f.destino })
    setSalvando(false)
    if (error) return toast.erro('Erro: ' + error.message)
    toast.ok('Entrada lançada.')
    onSaved(); onClose()
  }

  return (
    <Modal aberto onClose={onClose} titulo="Lançar entrada"
      footer={<button className="btn btn-green btn-full" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar entrada'}</button>}>
      <div className="col gap-12">
        <div className="grid grid-2">
          <Field label="Data"><input type="date" className="input focus-green" value={f.data} onChange={set('data')} /></Field>
          <Field label="Valor (R$)"><input type="number" inputMode="decimal" className="input input-num focus-green" value={f.valor} onChange={set('valor')} placeholder="0,00" /></Field>
        </div>
        <div className="grid grid-2">
          <Field label="Tipo"><select className="select focus-green" value={f.tipo} onChange={set('tipo')}>{TIPOS_ENTRADA.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Destino"><select className="select focus-green" value={f.destino} onChange={set('destino')}>{DESTINOS_ENTRADA.map((d) => <option key={d}>{d}</option>)}</select></Field>
        </div>
        <Field label="Descrição"><input className="input focus-green" value={f.descricao} onChange={set('descricao')} placeholder="Opcional" /></Field>
      </div>
    </Modal>
  )
}

// ───────── Modal: Tetos por categoria ─────────
function TetosModal({ userId, tetos, onClose, onSaved, toast }) {
  const [valores, setValores] = useState(() => {
    const v = {}; CATEGORIAS_GASTO.forEach((c) => { v[c] = tetos[c] ?? '' }); return v
  })
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    const limpo = {}
    for (const [k, val] of Object.entries(valores)) { const n = Number(String(val).replace(',', '.')); if (n > 0) limpo[k] = n }
    const { error } = await supabase.from('configuracoes').upsert({ user_id: userId, tetos_categoria: limpo }, { onConflict: 'user_id' })
    setSalvando(false)
    if (error) return toast.erro('Erro: ' + error.message)
    toast.ok('Tetos atualizados.')
    onSaved(); onClose()
  }

  return (
    <Modal aberto onClose={onClose} titulo="Tetos por categoria"
      footer={<button className="btn btn-blue btn-full" onClick={salvar} disabled={salvando}>Salvar tetos</button>}>
      <div className="col gap-8">
        {CATEGORIAS_GASTO.map((c) => (
          <div key={c} className="row-between gap-8">
            <span style={{ fontSize: 13 }}>{c}</span>
            <input type="number" inputMode="decimal" className="input input-num focus-blue" style={{ width: 120 }} placeholder="sem teto"
              value={valores[c]} onChange={(e) => setValores({ ...valores, [c]: e.target.value })} />
          </div>
        ))}
      </div>
    </Modal>
  )
}

function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>
}
