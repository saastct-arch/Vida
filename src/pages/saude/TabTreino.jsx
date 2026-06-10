import { useEffect, useState, useMemo } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { supabase } from '../../lib/supabase.js'
import { dataBR } from '../../lib/format.js'
import { diffDias } from '../../lib/dates.js'
import { Badge, SectionHead, Skeleton } from '../../components/ui.jsx'

// Aba Treino: histórico por exercício com progressão de carga + alerta de estagnação.
export default function TabTreino({ userId }) {
  const [series, setSeries] = useState(null)
  const [exercicio, setExercicio] = useState('')

  useEffect(() => {
    supabase
      .from('treino_series')
      .select('exercicio,carga_kg,series,repeticoes,treino_registros(data)')
      .eq('user_id', userId)
      .then(({ data }) => {
        const limpo = (data || [])
          .filter((s) => s.treino_registros?.data && s.carga_kg != null)
          .map((s) => ({ exercicio: s.exercicio, carga: Number(s.carga_kg), data: s.treino_registros.data }))
          .sort((a, b) => a.data.localeCompare(b.data))
        setSeries(limpo)
        if (limpo.length && !exercicio) setExercicio(limpo[limpo.length - 1].exercicio)
      })
  }, [userId]) // eslint-disable-line

  const exercicios = useMemo(() => [...new Set((series || []).map((s) => s.exercicio))], [series])
  const dados = useMemo(
    () => (series || []).filter((s) => s.exercicio === exercicio).map((s) => ({ label: dataBR(s.data).slice(0, 5), carga: s.carga })),
    [series, exercicio]
  )

  // Alerta de estagnação: 2+ semanas sem aumento de carga.
  const estagnado = useMemo(() => {
    const pts = (series || []).filter((s) => s.exercicio === exercicio)
    if (pts.length < 2) return false
    const ult = pts[pts.length - 1]
    const penult = pts[pts.length - 2]
    const dias = diffDias(penult.data, ult.data)
    return ult.carga <= penult.carga && dias >= 14
  }, [series, exercicio])

  if (!series) return <Skeleton h={260} />

  if (exercicios.length === 0) {
    return <div className="empty">Nenhum treino registrado ainda. Registre na aba <strong>Hoje</strong> para acompanhar a progressão de carga.</div>
  }

  return (
    <div>
      <SectionHead>Progressão de carga</SectionHead>
      <div className="card card-pad">
        <select className="select focus-green" value={exercicio} onChange={(e) => setExercicio(e.target.value)} style={{ marginBottom: 12 }}>
          {exercicios.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
        </select>

        {estagnado && (
          <div className="row gap-8" style={{ marginBottom: 12 }}>
            <Badge tipo="amber">alerta</Badge>
            <span style={{ fontSize: 13 }}>Carga estagnada há 2+ semanas neste exercício.</span>
          </div>
        )}

        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} kg`, 'Carga']} />
              <Line type="monotone" dataKey="carga" stroke="var(--green)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
