import { useEffect, useState, useCallback } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { calcTransferenciaVR } from '../../lib/constants.js'
import { vrDoMes } from '../../lib/finance.js'
import { money, dataBR, toISODate } from '../../lib/format.js'
import { Badge, SectionHead, Skeleton } from '../../components/ui.jsx'

export default function TabVR({ userId }) {
  const toast = useToast()
  const [dados, setDados] = useState(null)
  const [valor, setValor] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const hoje = new Date()
  const ano = hoje.getFullYear(), mes = hoje.getMonth()
  const ini = `${ano}-${String(mes + 1).padStart(2, '0')}-01`

  const carregar = useCallback(async () => {
    const [usos, transf] = await Promise.all([
      supabase.from('gastos').select('data,descricao,valor').eq('user_id', userId).eq('origem', 'VR').gte('data', ini).order('data', { ascending: false }),
      supabase.from('transferencias_vr').select('*').eq('user_id', userId).gte('data', ini).order('data', { ascending: false }),
    ])
    const vr = vrDoMes(ano, mes)
    const totalUso = (usos.data || []).reduce((s, g) => s + Number(g.valor), 0)
    const totalTransf = (transf.data || []).reduce((s, t) => s + Number(t.valor_bruto), 0)
    setDados({ vr, usos: usos.data || [], transf: transf.data || [], saldo: vr.total - totalUso - totalTransf })
  }, [userId, ano, mes, ini])

  useEffect(() => { carregar() }, [carregar])

  if (!dados) return <Skeleton h={220} />

  const v = Number(String(valor).replace(',', '.')) || 0
  const { taxa, liquido } = calcTransferenciaVR(v)

  async function confirmar() {
    if (v <= 0) return toast.erro('Informe o valor a transferir.')
    if (v > dados.saldo) return toast.erro('Valor maior que o saldo de VR disponível.')
    setConfirmando(true)
    const dataISO = toISODate(new Date())
    const { error } = await supabase.from('transferencias_vr').insert({ user_id: userId, data: dataISO, valor_bruto: v, taxa, valor_liquido: liquido })
    if (!error) {
      // credita o líquido na conta como entrada
      await supabase.from('entradas').insert({ user_id: userId, data: dataISO, descricao: 'Transferência VR → Conta', valor: liquido, tipo: 'Outros', destino: 'Conta' })
    }
    setConfirmando(false)
    if (error) return toast.erro('Erro: ' + error.message)
    toast.ok(`Transferido. Líquido ${money(liquido)} na conta.`)
    setValor('')
    carregar()
  }

  return (
    <div>
      {/* Saldo */}
      <div className="card bl-green card-pad">
        <div className="row-between">
          <div>
            <div className="font-label text-muted" style={{ fontSize: 11 }}>SALDO VR</div>
            <div className="mono" style={{ fontSize: 26, color: 'var(--green-dark)', marginTop: 4 }}>{money(dados.saldo)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="text-muted" style={{ fontSize: 11 }}>{dados.vr.diasUteis} dias úteis × R$25</div>
            <Badge tipo="green" style={{ marginTop: 6 }}>zera em {dataBR(dados.vr.zeraEm)}</Badge>
          </div>
        </div>
      </div>

      {/* Transferência */}
      <div className="page-section">
        <SectionHead>Transferir VR → Conta</SectionHead>
        <div className="card card-pad">
          <div className="row gap-8 wrap">
            <div className="field flex-1" style={{ minWidth: 140 }}>
              <label>Valor a transferir (R$)</label>
              <input type="number" inputMode="decimal" className="input input-num focus-green" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          {v > 0 && (
            <div className="card" style={{ background: 'var(--green-light-bg)', border: '1px solid var(--green)', padding: 12, marginTop: 12 }}>
              <Linha label="Valor bruto" valor={money(v)} />
              <Linha label={`Taxa (${v <= 100 ? 'fixa R$2,50' : '2,5%'})`} valor={'− ' + money(taxa)} cor="red" />
              <div style={{ height: 1, background: 'var(--green)', opacity: 0.3, margin: '8px 0' }} />
              <Linha label="Valor líquido" valor={money(liquido)} cor="green-dark" forte />
            </div>
          )}
          <button className="btn btn-green btn-full" style={{ marginTop: 12 }} onClick={confirmar} disabled={confirmando}>
            <ArrowRightLeft size={15} /> Confirmar transferência
          </button>
          <div className="text-muted" style={{ fontSize: 11, marginTop: 8, textAlign: 'center' }}>Transferências apenas no sentido VR → Conta.</div>
        </div>
      </div>

      {/* Histórico de uso */}
      <div className="page-section">
        <SectionHead>Uso no mês</SectionHead>
        <div className="card">
          {dados.usos.length === 0 && dados.transf.length === 0 ? (
            <div className="empty">Nenhum uso registrado.</div>
          ) : (
            <>
              {dados.usos.map((g, i) => (
                <Item key={'u' + i} desc={g.descricao || 'Compra VR'} data={g.data} valor={Number(g.valor)} tag="uso" />
              ))}
              {dados.transf.map((t, i) => (
                <Item key={'t' + i} desc={`Transferência (líq. ${money(t.valor_liquido)})`} data={t.data} valor={Number(t.valor_bruto)} tag="transf" />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Linha({ label, valor, cor, forte }) {
  return (
    <div className="row-between" style={{ padding: '2px 0' }}>
      <span style={{ fontSize: 13, fontWeight: forte ? 600 : 400 }}>{label}</span>
      <span className="mono" style={{ fontSize: forte ? 15 : 13, color: cor ? `var(--${cor})` : 'var(--text-primary)' }}>{valor}</span>
    </div>
  )
}
function Item({ desc, data, valor, tag }) {
  return (
    <div className="row-between" style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
      <div>
        <span style={{ fontSize: 13 }}>{desc}</span>
        <div className="text-muted font-label" style={{ fontSize: 11 }}>{dataBR(data)}</div>
      </div>
      <span className="row gap-8">
        <Badge tipo={tag === 'uso' ? 'green' : 'blue'}>{tag === 'uso' ? 'uso' : 'transf.'}</Badge>
        <span className="mono" style={{ fontSize: 13, color: 'var(--red)' }}>−{money(valor)}</span>
      </span>
    </div>
  )
}
