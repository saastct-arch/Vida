import { useEffect, useState, useCallback } from 'react'
import { Plus, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { CARTAO, CONTAS_FIXAS } from '../../lib/constants.js'
import { money, dataBR, toISODate, nomeMes } from '../../lib/format.js'
import { Badge, Modal, SectionHead, ProgressBar, Skeleton } from '../../components/ui.jsx'

// Determina o mês/ano de vencimento (competência) de uma compra no cartão.
// Virada dia 11: compras a partir do dia 11 caem na fatura do mês seguinte.
function competencia(dataISO) {
  const d = new Date(dataISO + 'T00:00:00')
  let mes = d.getMonth(), ano = d.getFullYear()
  if (d.getDate() >= CARTAO.viradaDia) { mes++; if (mes > 11) { mes = 0; ano++ } }
  return { ano, mes }
}

export default function TabCartao({ userId }) {
  const toast = useToast()
  const [gastos, setGastos] = useState(null)
  const [modal, setModal] = useState(false)
  const hoje = new Date()

  const carregar = useCallback(async () => {
    const ini = toISODate(new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1))
    const fim = toISODate(new Date(hoje.getFullYear(), hoje.getMonth() + 5, 0))
    const { data } = await supabase.from('gastos').select('*').eq('user_id', userId).eq('origem', 'Cartão').gte('data', ini).lte('data', fim)
    setGastos(data || [])
  }, [userId]) // eslint-disable-line

  useEffect(() => { carregar() }, [carregar])

  if (!gastos) return <Skeleton h={280} />

  // Eventos fixos automáticos do cartão (Spotify, Vivo) para os meses exibidos
  const fixosCartao = []
  for (let off = -1; off <= 3; off++) {
    const dt = new Date(hoje.getFullYear(), hoje.getMonth() + off, 1)
    for (const c of CONTAS_FIXAS.filter((x) => x.origem === 'Cartão')) {
      fixosCartao.push({ data: toISODate(new Date(dt.getFullYear(), dt.getMonth(), c.dia)), descricao: c.nome, valor: c.valor, fixo: true })
    }
  }
  const todos = [...gastos.map((g) => ({ ...g, valor: Number(g.valor) })), ...fixosCartao]

  // Agrupa por competência (ano-mes)
  const buckets = {}
  for (const g of todos) {
    const { ano, mes } = competencia(g.data)
    const key = `${ano}-${mes}`
    if (!buckets[key]) buckets[key] = { ano, mes, total: 0, itens: [] }
    buckets[key].total += g.valor
    buckets[key].itens.push(g)
  }

  // Fatura aberta = competência atual (se hoje < virada) ou próxima
  const compAberta = competencia(toISODate(hoje))
  const keyAberta = `${compAberta.ano}-${compAberta.mes}`
  // Fatura fechada = competência anterior à aberta
  const fechMes = compAberta.mes === 0 ? 11 : compAberta.mes - 1
  const fechAno = compAberta.mes === 0 ? compAberta.ano - 1 : compAberta.ano
  const keyFechada = `${fechAno}-${fechMes}`

  const faturaAberta = buckets[keyAberta] || { ano: compAberta.ano, mes: compAberta.mes, total: 0, itens: [] }
  const faturaFechada = buckets[keyFechada]

  const pctLimite = (faturaAberta.total / CARTAO.limite) * 100
  const proximas = []
  for (let i = 1; i <= 3; i++) {
    let m = compAberta.mes + i, a = compAberta.ano
    while (m > 11) { m -= 12; a++ }
    proximas.push(buckets[`${a}-${m}`] || { ano: a, mes: m, total: 0, itens: [] })
  }

  // Alerta dia 12: fatura fechada
  const mostrarAlertaFechada = hoje.getDate() >= CARTAO.viradaDia + 1 && faturaFechada && faturaFechada.total > 0
  const diasParaVencer = CARTAO.vencimentoDia - hoje.getDate()

  return (
    <div>
      {/* Limite */}
      <div className="card bl-red card-pad">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <span className="row gap-8"><CreditCard size={16} color="var(--red)" /><span className="font-label" style={{ fontSize: 12 }}>Fatura aberta</span></span>
          <span className="mono" style={{ fontSize: 18, color: 'var(--red)' }}>{money(faturaAberta.total)}</span>
        </div>
        <ProgressBar valor={pctLimite} cor={pctLimite >= 80 ? 'red' : 'blue'} />
        <div className="row-between" style={{ marginTop: 6 }}>
          <span className="text-muted font-label" style={{ fontSize: 11 }}>Limite {money(CARTAO.limite)} · vence dia {CARTAO.vencimentoDia}</span>
          {pctLimite >= 80 && <Badge tipo="amber">acima de 80%</Badge>}
        </div>
      </div>

      {/* Alerta fatura fechada */}
      {mostrarAlertaFechada && (
        <div className="card bl-amber card-pad" style={{ marginTop: 12 }}>
          <div className="row gap-8"><Badge tipo="amber">fatura fechada</Badge>
            <span style={{ fontSize: 13 }}>{money(faturaFechada.total)} — vence em {Math.max(0, diasParaVencer)} dia(s).</span></div>
        </div>
      )}

      <button className="btn btn-blue" style={{ marginTop: 12 }} onClick={() => setModal(true)}><Plus size={16} /> Compra parcelada</button>

      {/* Fatura fechada detalhe */}
      {faturaFechada && faturaFechada.total > 0 && (
        <div className="page-section">
          <SectionHead>Fatura fechada · {nomeMes(faturaFechada.mes)}</SectionHead>
          <FaturaCard fatura={faturaFechada} />
        </div>
      )}

      {/* Próximas faturas */}
      <div className="page-section">
        <SectionHead>Próximas faturas · parcelas comprometidas</SectionHead>
        <div className="col gap-10">
          {proximas.map((f, i) => (
            <div key={i} className="row-between card card-pad" style={{ padding: 12 }}>
              <span className="font-label" style={{ fontSize: 13, textTransform: 'capitalize' }}>{nomeMes(f.mes)}/{String(f.ano).slice(2)}</span>
              <span className="mono" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{money(f.total)}</span>
            </div>
          ))}
        </div>
      </div>

      {modal && <ParceladoModal userId={userId} onClose={() => setModal(false)} onSaved={carregar} toast={toast} />}
    </div>
  )
}

function FaturaCard({ fatura }) {
  return (
    <div className="card">
      {fatura.itens.sort((a, b) => a.data.localeCompare(b.data)).map((g, i) => (
        <div key={i} className="row-between" style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontSize: 13 }}>{g.descricao || 'Compra'}{g.parcelado && <span className="text-muted"> ({g.parcela_atual}/{g.num_parcelas})</span>}</span>
            <div className="text-muted font-label" style={{ fontSize: 11 }}>{dataBR(g.data)}</div>
          </div>
          <span className="mono" style={{ fontSize: 13, color: 'var(--red)' }}>{money(g.valor)}</span>
        </div>
      ))}
    </div>
  )
}

function ParceladoModal({ userId, onClose, onSaved, toast }) {
  const [f, setF] = useState({ valor: '', parcelas: 3, data: toISODate(new Date()), descricao: '' })
  const [salvando, setSalvando] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function salvar() {
    const total = Number(String(f.valor).replace(',', '.'))
    const n = Math.max(1, parseInt(f.parcelas, 10) || 1)
    if (!total) return toast.erro('Informe o valor total.')
    setSalvando(true)
    const parcela = +(total / n).toFixed(2)
    const linhas = []
    for (let i = 1; i <= n; i++) {
      const d = new Date(f.data + 'T00:00:00'); d.setMonth(d.getMonth() + (i - 1))
      linhas.push({ user_id: userId, data: toISODate(d), descricao: f.descricao || 'Compra cartão', valor: parcela, categoria: 'Outros', origem: 'Cartão', parcelado: n > 1, num_parcelas: n, parcela_atual: i })
    }
    const { error } = await supabase.from('gastos').insert(linhas)
    setSalvando(false)
    if (error) return toast.erro('Erro: ' + error.message)
    toast.ok(`Compra distribuída em ${n}x de ${money(parcela)}.`)
    onSaved(); onClose()
  }

  return (
    <Modal aberto onClose={onClose} titulo="Compra parcelada no cartão"
      footer={<button className="btn btn-blue btn-full" onClick={salvar} disabled={salvando}>Distribuir parcelas</button>}>
      <div className="col gap-12">
        <div className="field"><label>Descrição</label><input className="input focus-blue" value={f.descricao} onChange={set('descricao')} placeholder="Ex.: tênis, eletrônico…" /></div>
        <div className="grid grid-2">
          <div className="field"><label>Valor total (R$)</label><input type="number" inputMode="decimal" className="input input-num focus-blue" value={f.valor} onChange={set('valor')} placeholder="0,00" /></div>
          <div className="field"><label>Parcelas</label><input type="number" className="input input-num focus-blue" value={f.parcelas} onChange={set('parcelas')} min={1} /></div>
        </div>
        <div className="field"><label>Data da compra</label><input type="date" className="input focus-blue" value={f.data} onChange={set('data')} /></div>
      </div>
    </Modal>
  )
}
