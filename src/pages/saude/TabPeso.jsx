import { useEffect, useState, useCallback } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid,
} from 'recharts'
import { supabase } from '../../lib/supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { PESO_INICIAL, PESO_META } from '../../lib/constants.js'
import { toISODate, dataBR, number } from '../../lib/format.js'
import { projetarPeso } from '../../lib/finance.js'
import { Badge, SectionHead, Skeleton, ProgressBar } from '../../components/ui.jsx'

// Aba Peso: registro semanal (segundas), gráfico realizado vs meta e projeção.
export default function TabPeso({ userId }) {
  const toast = useToast()
  const [registros, setRegistros] = useState(null)
  const [data, setData] = useState(toISODate(new Date()))
  const [kg, setKg] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    const { data: rows } = await supabase
      .from('peso_registros').select('*').eq('user_id', userId).order('data', { ascending: true })
    setRegistros(rows || [])
  }, [userId])

  useEffect(() => { carregar() }, [carregar])

  async function salvar() {
    const v = Number(String(kg).replace(',', '.'))
    if (!v) return toast.erro('Informe o peso em kg.')
    setSalvando(true)
    const { error } = await supabase.from('peso_registros').insert({ user_id: userId, data, peso_kg: v })
    setSalvando(false)
    if (error) return toast.erro('Erro: ' + error.message)
    toast.ok('Peso registrado.')
    setKg('')
    carregar()
  }

  if (!registros) return <Skeleton h={260} />

  const atual = registros.length ? Number(registros[registros.length - 1].peso_kg) : PESO_INICIAL
  const perdido = +(PESO_INICIAL - atual).toFixed(1)
  const restante = +(atual - PESO_META).toFixed(1)
  const progresso = Math.max(0, Math.min(100, ((PESO_INICIAL - atual) / (PESO_INICIAL - PESO_META)) * 100))

  const proj = projetarPeso(registros)
  const alertas = []
  if (proj) {
    if (Math.abs(proj.slopeSemana) < 0.05 && registros.length >= 2) alertas.push({ tipo: 'amber', txt: 'Peso estagnado — sem variação significativa nas últimas semanas.' })
    if (proj.slopeSemana < -1.5) alertas.push({ tipo: 'amber', txt: 'Queda acentuada (>1,5kg/sem) — atenção ao déficit calórico.' })
  }
  if (perdido > 0 && Math.floor(perdido / 5) >= 1) alertas.push({ tipo: 'green', txt: `${Math.floor(perdido / 5) * 5}kg perdidos — a IA pode recalcular TDEE e macros.` })

  // Dados do gráfico: realizado + projeção (linha pontilhada)
  const chart = registros.map((r) => ({ label: dataBR(r.data).slice(0, 5), peso: Number(r.peso_kg), meta: PESO_META }))
  if (proj && registros.length) {
    proj.projecao.forEach((p) => chart.push({ label: `+${p.semana}sem`, projecao: p.peso, meta: PESO_META }))
  }

  return (
    <div>
      {/* Cards resumo */}
      <div className="grid grid-3">
        <Mini titulo="Atual" valor={`${number(atual, 1)} kg`} cor="green" />
        <Mini titulo="Perdido" valor={`${number(perdido, 1)} kg`} cor="blue" />
        <Mini titulo="Faltam" valor={`${number(Math.max(0, restante), 1)} kg`} cor="amber" />
      </div>
      <div className="card card-pad" style={{ marginTop: 10 }}>
        <div className="row-between" style={{ marginBottom: 6 }}>
          <span className="font-label text-muted" style={{ fontSize: 11 }}>{PESO_INICIAL}kg → {PESO_META}kg</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--green-dark)' }}>{number(progresso)}%</span>
        </div>
        <ProgressBar valor={progresso} cor="green" />
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="col gap-8" style={{ marginTop: 12 }}>
          {alertas.map((a, i) => (
            <div key={i} className={`card bl-${a.tipo === 'green' ? 'green' : 'amber'} card-pad`} style={{ padding: 12 }}>
              <div className="row gap-8"><Badge tipo={a.tipo}>{a.tipo === 'green' ? 'marco' : 'alerta'}</Badge><span style={{ fontSize: 13 }}>{a.txt}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico */}
      <div className="page-section">
        <SectionHead>Evolução</SectionHead>
        <div className="card card-pad" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis domain={[PESO_META - 2, PESO_INICIAL + 1]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine y={PESO_META} stroke="var(--amber)" strokeDasharray="4 4" label={{ value: 'meta', fontSize: 10, fill: 'var(--amber-dark)' }} />
              <Line type="monotone" dataKey="peso" stroke="var(--green)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls name="Realizado" />
              <Line type="monotone" dataKey="projecao" stroke="var(--blue)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls name="Projeção" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Registro */}
      <div className="page-section">
        <SectionHead>Registrar peso (segundas-feiras)</SectionHead>
        <div className="card card-pad row gap-8 wrap">
          <div className="field" style={{ flex: 1, minWidth: 130 }}>
            <label>Data</label>
            <input type="date" className="input focus-green" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 110 }}>
            <label>Peso (kg)</label>
            <input type="number" inputMode="decimal" className="input input-num focus-green" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="0,0" />
          </div>
          <button className="btn btn-green" style={{ alignSelf: 'flex-end' }} onClick={salvar} disabled={salvando}>Registrar</button>
        </div>
      </div>
    </div>
  )
}

function Mini({ titulo, valor, cor }) {
  return (
    <div className="card card-pad" style={{ padding: 12 }}>
      <div className="font-label text-muted" style={{ fontSize: 10, textTransform: 'uppercase' }}>{titulo}</div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: `var(--${cor})`, marginTop: 4 }}>{valor}</div>
    </div>
  )
}
