import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { SPLIT_SEMANAL } from '../../lib/constants.js'
import { nomeDiaSemana } from '../../lib/format.js'
import { Badge, Skeleton } from '../../components/ui.jsx'
import { Check } from 'lucide-react'

// Treino do dia (na aba Hoje e reutilizável). Split semanal pré-cadastrado.
export default function TreinoDoDia({ userId, data }) {
  const toast = useToast()
  const [carregando, setCarregando] = useState(true)
  const [registro, setRegistro] = useState(null)
  const [series, setSeries] = useState({}) // exercicio -> { series, repeticoes, carga_kg }
  const [salvando, setSalvando] = useState(false)

  const diaSemana = new Date(data + 'T00:00:00').getDay()
  const plano = SPLIT_SEMANAL[diaSemana]

  const carregar = useCallback(async () => {
    setCarregando(true)
    const { data: reg } = await supabase
      .from('treino_registros').select('*').eq('user_id', userId).eq('data', data).maybeSingle()
    let mapa = {}
    if (reg) {
      const { data: ss } = await supabase.from('treino_series').select('*').eq('treino_id', reg.id)
      for (const s of ss || []) mapa[s.exercicio] = { series: s.series ?? '', repeticoes: s.repeticoes ?? '', carga_kg: s.carga_kg ?? '' }
    }
    setRegistro(reg || null)
    setSeries(mapa)
    setCarregando(false)
  }, [userId, data])

  useEffect(() => { carregar() }, [carregar])

  function setCampo(ex, campo, valor) {
    setSeries((s) => ({ ...s, [ex]: { ...s[ex], [campo]: valor } }))
  }

  async function concluir() {
    setSalvando(true)
    // upsert do registro do treino
    const { data: reg, error } = await supabase
      .from('treino_registros')
      .upsert({ user_id: userId, data, dia_semana: nomeDiaSemana(data), concluido: true, sem_treino: false }, { onConflict: 'user_id,data' })
      .select().single()
    if (error) { setSalvando(false); return toast.erro('Erro: ' + error.message) }

    // regrava as séries
    await supabase.from('treino_series').delete().eq('treino_id', reg.id)
    const linhas = plano.exercicios
      .filter((ex) => series[ex])
      .map((ex) => ({
        user_id: userId, treino_id: reg.id, exercicio: ex,
        series: int(series[ex].series), repeticoes: series[ex].repeticoes || null, carga_kg: dec(series[ex].carga_kg),
      }))
    if (linhas.length) await supabase.from('treino_series').insert(linhas)
    setSalvando(false)
    toast.ok('Treino concluído!')
    carregar()
  }

  async function marcarSemTreino() {
    const { error } = await supabase
      .from('treino_registros')
      .upsert({ user_id: userId, data, dia_semana: nomeDiaSemana(data), concluido: false, sem_treino: true }, { onConflict: 'user_id,data' })
    if (error) return toast.erro('Erro: ' + error.message)
    toast.info('Marcado como descanso.')
    carregar()
  }

  if (carregando) return <Skeleton h={120} />

  // Dias especiais
  if (plano.descanso) {
    return (
      <div className="card card-pad center" style={{ flexDirection: 'column', gap: 6, padding: 22 }}>
        <Badge tipo="green">descanso</Badge>
        <div className="text-muted" style={{ fontSize: 13 }}>Domingo é dia de recuperação. 🌙</div>
      </div>
    )
  }

  return (
    <div className="card card-pad">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{nomeDiaSemana(data)}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>{plano.futsal ? 'Treino esportivo' : 'Musculação'}</div>
        </div>
        <Badge tipo="green">{plano.grupo}</Badge>
      </div>

      {plano.futsal ? (
        <div className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>Futsal — registre como concluído ao finalizar a partida.</div>
      ) : (
        <div className="grid grid-2">
          {plano.exercicios.map((ex) => (
            <div key={ex} className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>{ex}</div>
              <div className="grid grid-3" style={{ gap: 6 }}>
                <MiniInput label="SÉRIES" value={series[ex]?.series ?? ''} onChange={(v) => setCampo(ex, 'series', v)} />
                <MiniInput label="REPS" value={series[ex]?.repeticoes ?? ''} onChange={(v) => setCampo(ex, 'repeticoes', v)} texto />
                <MiniInput label="CARGA kg" value={series[ex]?.carga_kg ?? ''} onChange={(v) => setCampo(ex, 'carga_kg', v)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row gap-8" style={{ marginTop: 14 }}>
        <button className="btn btn-green flex-1" onClick={concluir} disabled={salvando}>
          {registro?.concluido ? <><Check size={15} /> Treino concluído</> : 'Concluir treino'}
        </button>
        {!registro?.concluido && (
          <button className="btn btn-outline" onClick={marcarSemTreino}>Descanso</button>
        )}
      </div>
    </div>
  )
}

function MiniInput({ label, value, onChange, texto }) {
  return (
    <div className="col" style={{ gap: 3 }}>
      <label className="font-label text-muted" style={{ fontSize: 9, letterSpacing: '0.03em' }}>{label}</label>
      <input
        type={texto ? 'text' : 'number'} inputMode={texto ? 'text' : 'decimal'}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="focus-green"
        style={{ background: '#fff', border: '1.5px solid var(--border-input)', borderRadius: 6, padding: '6px 4px', fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'center', width: '100%', outline: 'none', color: 'var(--text-primary)' }}
      />
    </div>
  )
}

const int = (v) => (v === '' || v == null ? null : parseInt(v, 10) || null)
const dec = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')) || null)
