import { useEffect, useState, useCallback } from 'react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'
import { supabase } from '../../lib/supabase.js'
import { money, number } from '../../lib/format.js'
import { vrDoMes } from '../../lib/finance.js'
import { CARTAO } from '../../lib/constants.js'
import { SectionHead, Skeleton } from '../../components/ui.jsx'

const CORES_PIE = ['#4F6EF7', '#2DD4A0', '#F9A825', '#F25C54', '#7B5CF0', '#5571E8', '#1A9B76', '#C07800', '#9B9B9B']

function rangeMes(ano, mes) {
  const ini = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
  const fim = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(new Date(ano, mes + 1, 0).getDate()).padStart(2, '0')}`
  return { ini, fim }
}

export default function TabDashboard({ userId }) {
  const [d, setD] = useState(null)
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()

  const carregar = useCallback(async () => {
    const atual = rangeMes(ano, mes)
    const antMes = mes === 0 ? 11 : mes - 1
    const antAno = mes === 0 ? ano - 1 : ano
    const ant = rangeMes(antAno, antMes)

    const [saldo, gastosAtual, gastosAnt, entradas, aportes] = await Promise.all([
      supabase.from('saldo_conta').select('saldo').eq('user_id', userId).order('data', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('gastos').select('data,valor,categoria,origem').eq('user_id', userId).gte('data', atual.ini).lte('data', atual.fim),
      supabase.from('gastos').select('data,valor').eq('user_id', userId).gte('data', ant.ini).lte('data', ant.fim),
      supabase.from('entradas').select('valor').eq('user_id', userId).gte('data', atual.ini).lte('data', atual.fim),
      supabase.from('investimentos_aportes').select('valor').eq('user_id', userId).gte('data', atual.ini).lte('data', atual.fim),
    ])

    const gAtual = gastosAtual.data || []
    const cartao = gAtual.filter((g) => g.origem === 'Cartão').reduce((s, g) => s + Number(g.valor), 0)
    const totalGastos = gAtual.reduce((s, g) => s + Number(g.valor), 0)
    const totalEntradas = (entradas.data || []).reduce((s, e) => s + Number(e.valor), 0)
    const totalAportes = (aportes.data || []).reduce((s, e) => s + Number(e.valor), 0)

    // Pizza por categoria
    const porCat = {}
    for (const g of gAtual) porCat[g.categoria || 'Outros'] = (porCat[g.categoria || 'Outros'] || 0) + Number(g.valor)
    const pie = Object.entries(porCat).map(([name, value]) => ({ name, value: +value.toFixed(2) }))

    // Linha comparativa acumulada (atual vs anterior)
    const acumular = (rows) => {
      const porDia = {}
      for (const g of rows) { const dia = Number(g.data.slice(8, 10)); porDia[dia] = (porDia[dia] || 0) + Number(g.valor) }
      let acc = 0
      return Array.from({ length: 31 }, (_, i) => { acc += porDia[i + 1] || 0; return acc })
    }
    const accAtual = acumular(gAtual)
    const accAnt = acumular(gastosAnt.data || [])
    const linha = Array.from({ length: 31 }, (_, i) => ({ dia: i + 1, atual: accAtual[i], anterior: accAnt[i] }))

    const saldoConta = Number(saldo.data?.saldo ?? 0)
    const vr = vrDoMes(ano, mes).total
    setD({ saldoConta, vr, cartao, consolidado: saldoConta + vr - cartao, totalGastos, totalEntradas, totalAportes, pie, linha })
  }, [userId, ano, mes])

  useEffect(() => { carregar() }, [carregar])

  if (!d) return <Skeleton h={300} />

  return (
    <div>
      {/* 4 cards saldo */}
      <div className="grid grid-4">
        <Saldo titulo="Conta" valor={money(d.saldoConta)} cor="blue" />
        <Saldo titulo="VR" valor={money(d.vr)} cor="green" />
        <Saldo titulo="Cartão" valor={'−' + money(d.cartao)} cor="red" />
        <Saldo titulo="Consolidado" valor={money(d.consolidado)} cor="violet" />
      </div>

      {/* Resumo mensal */}
      <div className="page-section">
        <SectionHead>Resumo do mês</SectionHead>
        <div className="grid grid-3">
          <Linha titulo="Receita" valor={money(d.totalEntradas)} cor="green" />
          <Linha titulo="Gastos" valor={money(d.totalGastos)} cor="red" />
          <Linha titulo="Aportes" valor={money(d.totalAportes)} cor="violet" />
        </div>
      </div>

      {/* Pizza categorias */}
      <div className="page-section">
        <SectionHead>Gastos por categoria</SectionHead>
        <div className="card card-pad" style={{ height: 260 }}>
          {d.pie.length === 0 ? <div className="empty">Sem gastos no mês.</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={42} paddingAngle={2}>
                  {d.pie.map((_, i) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => money(v)} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Comparativo mês atual vs anterior */}
      <div className="page-section">
        <SectionHead>Gastos acumulados · atual vs anterior</SectionHead>
        <div className="card card-pad" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.linha} margin={{ top: 8, right: 8, bottom: 4, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${number(v / 1000, 1)}k`} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="atual" name="Mês atual" stroke="var(--blue)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="anterior" name="Mês anterior" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function Saldo({ titulo, valor, cor }) {
  return (
    <div className={`card bl-${cor}`} style={{ padding: 12 }}>
      <div className="font-label text-muted" style={{ fontSize: 10, textTransform: 'uppercase' }}>{titulo}</div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: `var(--${cor})`, marginTop: 5 }}>{valor}</div>
    </div>
  )
}
function Linha({ titulo, valor, cor }) {
  return (
    <div className="card card-pad" style={{ padding: 12 }}>
      <div className="font-label text-muted" style={{ fontSize: 10, textTransform: 'uppercase' }}>{titulo}</div>
      <div className="mono" style={{ fontSize: 15, fontWeight: 500, color: `var(--${cor})`, marginTop: 5 }}>{valor}</div>
    </div>
  )
}
