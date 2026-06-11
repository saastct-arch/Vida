import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { REFEICOES, METAS_NUTRI, metaCaloricaDia, sugestaoRefeicao } from '../../lib/constants.js'
import { number } from '../../lib/format.js'
import { ProgressBar, SectionHead, Skeleton } from '../../components/ui.jsx'
import MealCard from './MealCard.jsx'
import TreinoDoDia from './TreinoDoDia.jsx'
import Suplementacao from './Suplementacao.jsx'

// Aba "Hoje": resumo nutricional + refeições + treino + suplementação.
export default function TabHoje({ userId, data }) {
  const [registros, setRegistros] = useState(null) // refeicao.nome -> row

  const carregar = useCallback(async () => {
    const { data: rows } = await supabase
      .from('refeicoes_registros').select('*').eq('user_id', userId).eq('data', data)
    const mapa = {}
    for (const r of rows || []) mapa[r.refeicao] = r
    setRegistros(mapa)
  }, [userId, data])

  useEffect(() => { setRegistros(null); carregar() }, [carregar])

  // Acumula totais do dia conforme refeições salvas.
  const totais = { calorias: 0, proteinas_g: 0, carboidratos_g: 0, gorduras_totais_g: 0 }
  if (registros) {
    for (const r of Object.values(registros)) {
      totais.calorias += Number(r.calorias || 0)
      totais.proteinas_g += Number(r.proteinas_g || 0)
      totais.carboidratos_g += Number(r.carboidratos_g || 0)
      totais.gorduras_totais_g += Number(r.gorduras_totais_g || 0)
    }
  }

  return (
    <div>
      {/* Resumo nutricional do dia */}
      <SectionHead>Resumo nutricional</SectionHead>
      {!registros ? (
        <Skeleton h={70} />
      ) : (
        <div className="grid grid-4">
          <ResumoCard titulo="Calorias" cor="red" valor={totais.calorias} meta={metaCaloricaDia(data)} unidade="kcal" />
          <ResumoCard titulo="Proteína" cor="green" valor={totais.proteinas_g} meta={METAS_NUTRI.proteinas_g} unidade="g" />
          <ResumoCard titulo="Carboidrato" cor="blue" valor={totais.carboidratos_g} meta={METAS_NUTRI.carboidratos_g} unidade="g" />
          <ResumoCard titulo="Gordura" cor="amber" valor={totais.gorduras_totais_g} meta={METAS_NUTRI.gorduras_totais_g} unidade="g" />
        </div>
      )}

      {/* Refeições */}
      <div className="page-section">
        <SectionHead>Refeições</SectionHead>
        {!registros ? (
          <Skeleton h={200} />
        ) : (
          <div className="col gap-8">
            {REFEICOES.map((r) => (
              <MealCard key={r.key} userId={userId} data={data} refeicao={r} registro={registros[r.nome]} sugestao={sugestaoRefeicao(data, r.nome)} onSaved={carregar} />
            ))}
          </div>
        )}
      </div>

      {/* Treino do dia */}
      <div className="page-section">
        <SectionHead>Treino do dia</SectionHead>
        <TreinoDoDia userId={userId} data={data} />
      </div>

      {/* Suplementação */}
      <div className="page-section">
        <SectionHead>Suplementação</SectionHead>
        <Suplementacao userId={userId} data={data} />
      </div>
    </div>
  )
}

function ResumoCard({ titulo, cor, valor, meta, unidade }) {
  const pct = meta ? (valor / meta) * 100 : 0
  return (
    <div className="card" style={{ padding: '12px 12px 0', overflow: 'hidden' }}>
      <div className="font-label text-muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{titulo}</div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: `var(--${cor})`, margin: '5px 0 2px' }}>{number(valor, valor % 1 ? 1 : 0)}</div>
      <div className="text-muted" style={{ fontSize: 10, marginBottom: 8 }}>meta {number(meta)} {unidade}</div>
      <div style={{ margin: '0 -12px' }}><ProgressBar valor={pct} cor={cor} /></div>
    </div>
  )
}
