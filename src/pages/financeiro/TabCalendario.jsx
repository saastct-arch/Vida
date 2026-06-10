import { useEffect, useState, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { eventosFixosDoMes, projetarSaldoMes, corSaldo } from '../../lib/finance.js'
import { money, nomeMes, dataExtenso, number } from '../../lib/format.js'
import { Badge, Modal, Skeleton } from '../../components/ui.jsx'

const DIAS_CAB = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export default function TabCalendario({ userId }) {
  const toast = useToast()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [saldoInicial, setSaldoInicial] = useState(null)
  const [dbEventos, setDbEventos] = useState([])
  const [diaSel, setDiaSel] = useState(null)

  const carregar = useCallback(async () => {
    setSaldoInicial(null)
    const ini = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
    const fim = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(new Date(ano, mes + 1, 0).getDate()).padStart(2, '0')}`
    const [saldo, gastos, entradas] = await Promise.all([
      supabase.from('saldo_conta').select('saldo,data').eq('user_id', userId).lte('data', ini).order('data', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('gastos').select('data,descricao,valor,origem').eq('user_id', userId).gte('data', ini).lte('data', fim),
      supabase.from('entradas').select('data,descricao,valor,destino').eq('user_id', userId).gte('data', ini).lte('data', fim),
    ])
    const evs = [
      ...(gastos.data || []).map((g) => ({ data: g.data, descricao: g.descricao || 'Gasto', valor: -Number(g.valor), origem: g.origem, tipo: 'saida', real: true })),
      ...(entradas.data || []).map((e) => ({ data: e.data, descricao: e.descricao || 'Entrada', valor: Number(e.valor), origem: e.destino, tipo: 'entrada', real: true })),
    ]
    setDbEventos(evs)
    setSaldoInicial(Number(saldo.data?.saldo ?? 0))
  }, [userId, ano, mes])

  useEffect(() => { carregar() }, [carregar])

  const eventos = useMemo(() => [...eventosFixosDoMes(ano, mes), ...dbEventos], [ano, mes, dbEventos])
  const serie = useMemo(() => (saldoInicial == null ? [] : projetarSaldoMes(saldoInicial, ano, mes, dbEventos)), [saldoInicial, ano, mes, dbEventos])

  function navegar(delta) {
    let m = mes + delta, a = ano
    if (m < 0) { m = 11; a-- } else if (m > 11) { m = 0; a++ }
    setMes(m); setAno(a)
  }

  if (saldoInicial == null) return <Skeleton h={360} />

  const primeiroDow = new Date(ano, mes, 1).getDay()
  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const celulas = []
  for (let i = 0; i < primeiroDow; i++) celulas.push(null)
  for (let dia = 1; dia <= totalDias; dia++) celulas.push(dia)

  const eventosDoDia = (dia) => eventos.filter((e) => Number(e.data.slice(8, 10)) === dia)
  const saldoDoDia = (dia) => serie[dia - 1]?.saldo ?? 0

  return (
    <div>
      {/* Navegação */}
      <div className="row-between card card-pad" style={{ padding: '10px 12px', marginBottom: 12 }}>
        <button className="btn-ghost" style={{ border: 0, padding: 6 }} onClick={() => navegar(-1)}><ChevronLeft size={18} /></button>
        <strong className="font-label" style={{ fontSize: 14, textTransform: 'capitalize' }}>{nomeMes(mes)} {ano}</strong>
        <button className="btn-ghost" style={{ border: 0, padding: 6 }} onClick={() => navegar(1)}><ChevronRight size={18} /></button>
      </div>

      {/* Grade */}
      <div className="card card-pad" style={{ padding: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {DIAS_CAB.map((d, i) => (
            <div key={i} className="font-label text-muted center" style={{ fontSize: 10, padding: '2px 0' }}>{d}</div>
          ))}
          {celulas.map((dia, i) => {
            if (!dia) return <div key={i} />
            const evs = eventosDoDia(dia)
            const saldo = saldoDoDia(dia)
            const cor = corSaldo(saldo)
            const ehHoje = ano === hoje.getFullYear() && mes === hoje.getMonth() && dia === hoje.getDate()
            return (
              <button key={i} onClick={() => setDiaSel(dia)}
                style={{ minHeight: 56, border: ehHoje ? '1.5px solid var(--blue)' : '1px solid var(--border)', borderRadius: 8, background: 'var(--card)', padding: '4px 4px 3px', display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{dia}</span>
                <div className="row" style={{ gap: 2, flexWrap: 'wrap', flex: 1 }}>
                  {evs.slice(0, 3).map((e, k) => (
                    <span key={k} style={{ width: 5, height: 5, borderRadius: '50%', background: e.tipo === 'entrada' ? 'var(--green)' : e.tipo === 'vencimento' ? 'var(--amber)' : e.tipo === 'aporte' ? 'var(--violet)' : 'var(--red)' }} />
                  ))}
                </div>
                <span className="mono" style={{ fontSize: 9, color: `var(--${cor})` }}>{number(saldo)}</span>
              </button>
            )
          })}
        </div>
        <div className="row gap-12 wrap" style={{ marginTop: 10, fontSize: 10 }}>
          <Legenda cor="green" txt="> R$500" /><Legenda cor="amber" txt="R$200–500" /><Legenda cor="red" txt="< R$200" />
        </div>
      </div>

      {/* Modal do dia */}
      <Modal aberto={diaSel != null} onClose={() => setDiaSel(null)} titulo={diaSel ? dataExtenso(new Date(ano, mes, diaSel)) : ''}>
        {diaSel && <DiaDetalhe userId={userId} ano={ano} mes={mes} dia={diaSel} eventos={eventosDoDia(diaSel)} saldo={saldoDoDia(diaSel)} onPago={() => { carregar(); }} toast={toast} />}
      </Modal>
    </div>
  )
}

function DiaDetalhe({ userId, ano, mes, dia, eventos, saldo, onPago, toast }) {
  const dataISO = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

  async function marcarPago(e) {
    if (e.real) return toast.info('Evento já lançado.')
    if (e.tipo === 'entrada') {
      await supabase.from('entradas').insert({ user_id: userId, data: dataISO, descricao: e.descricao, valor: Math.abs(e.valor), tipo: 'Outros', destino: e.origem || 'Conta' })
    } else if (e.tipo !== 'vencimento') {
      await supabase.from('gastos').insert({ user_id: userId, data: dataISO, descricao: e.descricao, valor: Math.abs(e.valor), categoria: 'Outros', origem: e.origem || 'Conta' })
    }
    toast.ok('Marcado como pago/lançado.')
    onPago()
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="font-label text-muted" style={{ fontSize: 11 }}>Saldo projetado</span>
        <span className="mono" style={{ fontSize: 16, color: `var(--${corSaldo(saldo)})` }}>{money(saldo)}</span>
      </div>
      {eventos.length === 0 ? (
        <div className="empty">Sem eventos neste dia.</div>
      ) : (
        <div className="col gap-8">
          {eventos.map((e, i) => (
            <div key={i} className="row-between card" style={{ padding: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13 }}>{e.descricao}</div>
                <div className="row gap-6" style={{ marginTop: 2 }}>
                  <Badge tipo={e.tipo === 'entrada' ? 'green' : e.tipo === 'vencimento' ? 'amber' : e.tipo === 'aporte' ? 'violet' : 'red'}>{e.origem || e.tipo}</Badge>
                  {e.real && <span className="text-muted" style={{ fontSize: 11 }}>lançado</span>}
                </div>
              </div>
              <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                {e.tipo !== 'vencimento' && <span className="mono" style={{ fontSize: 13, color: e.valor >= 0 ? 'var(--green)' : 'var(--red)' }}>{e.valor >= 0 ? '+' : '−'}{money(Math.abs(e.valor))}</span>}
                {!e.real && e.tipo !== 'vencimento' && <button className="btn btn-sm btn-outline-blue" onClick={() => marcarPago(e)}>Marcar pago</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Legenda({ cor, txt }) {
  return <span className="row gap-6"><span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--${cor})` }} /><span className="text-muted">{txt}</span></span>
}
