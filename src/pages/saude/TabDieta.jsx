import {
  PLANO_DIETA, NUTRI_BASE, REFEICOES, SUPLEMENTOS,
  MEAL_PREP, REAJUSTE_DIETA, CUSTO_MENSAL,
} from '../../lib/constants.js'
import { money, number } from '../../lib/format.js'
import { Badge, SectionHead } from '../../components/ui.jsx'

// Aba Dieta: plano semanal completo (somente leitura, editável apenas via IA).
export default function TabDieta() {
  return (
    <div>
      <div className="card bl-green card-pad" style={{ marginBottom: 14 }}>
        <div className="font-label" style={{ fontSize: 11, color: 'var(--green-dark)', marginBottom: 4 }}>PLANO ALIMENTAR</div>
        <div className="text-secondary" style={{ fontSize: 13 }}>
          Perda de peso + ganho de massa · atividade {NUTRI_BASE.atividade}. Para ajustes, peça à NEXUS IA (botão ∞).
        </div>
      </div>

      {/* Nutrição base */}
      <SectionHead>Calorias base</SectionHead>
      <div className="grid grid-3" style={{ marginBottom: 8 }}>
        <Mini titulo="TMB" valor={`${number(NUTRI_BASE.tmb)}`} sub="kcal" cor="text-secondary" />
        <Mini titulo="TDEE" valor={`${number(NUTRI_BASE.tdee)}`} sub="kcal" cor="text-secondary" />
        <Mini titulo="Meta (déficit)" valor={`${number(NUTRI_BASE.metaPadrao)}`} sub={`−${NUTRI_BASE.deficit} kcal`} cor="green" />
      </div>
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <Linha label="Seg–Sex (treino)" valor={`${number(NUTRI_BASE.metaPadrao)} kcal`} />
        <Linha label="Sábado (futsal — reposição)" valor={`${number(NUTRI_BASE.metaSabado)} kcal`} />
        <Linha label="Domingo (descanso)" valor={`${number(NUTRI_BASE.metaDomingo)} kcal`} ultimo />
      </div>

      {/* Macros */}
      <SectionHead>Macros diários · base {number(NUTRI_BASE.metaPadrao)} kcal</SectionHead>
      <div className="grid grid-3" style={{ marginBottom: 14 }}>
        <MacroCard titulo="Proteína" g={NUTRI_BASE.proteinaG} kcal={NUTRI_BASE.proteinaKcal} cor="green" det="2 g/kg" />
        <MacroCard titulo="Carboidrato" g={NUTRI_BASE.carboidratoG} kcal={NUTRI_BASE.carboidratoKcal} cor="blue" det="ajuste" />
        <MacroCard titulo="Gordura" g={NUTRI_BASE.gorduraG} kcal={NUTRI_BASE.gorduraKcal} cor="amber" det="25%" />
      </div>

      {/* Horários */}
      <SectionHead>Horário das refeições</SectionHead>
      <div className="card" style={{ marginBottom: 14 }}>
        {REFEICOES.map((r, i) => (
          <div key={r.key} className="row-between" style={{ padding: '9px 14px', borderBottom: i < REFEICOES.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: 13 }}>{r.nome}</span>
            <span className="row gap-8">
              <span className="mono text-muted" style={{ fontSize: 12 }}>{r.horario}</span>
              <Badge tipo={r.obrigatoria ? 'green' : 'amber'}>{r.local}</Badge>
            </span>
          </div>
        ))}
      </div>

      {/* Plano semanal detalhado */}
      <SectionHead>Plano semanal</SectionHead>
      <div className="col gap-12">
        {Object.entries(PLANO_DIETA).map(([dia, info]) => (
          <div key={dia} className="card card-pad">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <strong className="font-label" style={{ fontSize: 14 }}>{dia}</strong>
              <Badge tipo={info.treino === 'Descanso' ? 'green' : 'green'}>{info.treino}</Badge>
            </div>
            <div className="col gap-10">
              {Object.entries(info.refeicoes).map(([refeicao, itens]) => (
                <div key={refeicao}>
                  <div className="font-label" style={{ fontSize: 11, color: 'var(--green-dark)', marginBottom: 3 }}>{refeicao}</div>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {itens.map((it, k) => (
                      <li key={k} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {info.obs && (
              <div className="text-muted" style={{ fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>{info.obs}</div>
            )}
          </div>
        ))}
      </div>

      {/* Suplementação */}
      <div className="page-section">
        <SectionHead>Suplementação</SectionHead>
        <div className="col gap-8">
          {[SUPLEMENTOS.whey, SUPLEMENTOS.creatina].map((s) => (
            <div key={s.nome} className="card card-pad">
              <div className="row-between" style={{ marginBottom: 4 }}>
                <strong style={{ fontSize: 13.5 }}>{s.nome}</strong>
                <span className="mono text-muted" style={{ fontSize: 12 }}>{s.doseG} g/dose · {s.embalagemG} g ({s.dosesEmbalagem} doses)</span>
              </div>
              <div className="text-secondary" style={{ fontSize: 12.5 }}>{s.uso}</div>
              <div className="text-muted" style={{ fontSize: 11.5, marginTop: 3 }}>
                Duração {s.duracao} · alerta de estoque {s.alertaDoses ? `< ${s.alertaDoses} doses` : `< ${s.alertaDias} dias`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal prep */}
      <div className="page-section">
        <SectionHead>Meal prep · {MEAL_PREP.janela}</SectionHead>
        <div className="card card-pad">
          <div className="font-label" style={{ fontSize: 11, color: 'var(--green-dark)', marginBottom: 4 }}>PREPARAR</div>
          <ul style={{ margin: '0 0 10px', paddingLeft: 16 }}>
            {MEAL_PREP.itens.map((it, i) => <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{it}</li>)}
          </ul>
          <div className="font-label" style={{ fontSize: 11, color: 'var(--green-dark)', marginBottom: 4 }}>ORGANIZAÇÃO</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {MEAL_PREP.organizacao.map((it, i) => <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{it}</li>)}
          </ul>
        </div>
      </div>

      {/* Regras de ajuste */}
      <div className="page-section">
        <SectionHead>Ajuste automático (IA)</SectionHead>
        <div className="card card-pad">
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {REAJUSTE_DIETA.map((r, i) => <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r}</li>)}
          </ul>
        </div>
      </div>

      {/* Custo mensal */}
      <div className="page-section grid grid-3">
        <Mini titulo="Alimentação" valor={money(CUSTO_MENSAL.alimentacao)} sub="/mês" cor="blue" />
        <Mini titulo="Suplementos" valor={money(CUSTO_MENSAL.suplementacao)} sub="/mês" cor="violet" />
        <Mini titulo="Total" valor={money(CUSTO_MENSAL.total)} sub="/mês" cor="green" />
      </div>
    </div>
  )
}

function Mini({ titulo, valor, sub, cor }) {
  const corStyle = cor === 'text-secondary' ? 'var(--text-secondary)' : `var(--${cor})`
  return (
    <div className="card card-pad" style={{ padding: 12 }}>
      <div className="font-label text-muted" style={{ fontSize: 10, textTransform: 'uppercase' }}>{titulo}</div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: corStyle, marginTop: 4 }}>{valor}</div>
      {sub && <div className="text-muted mono" style={{ fontSize: 10, marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

function MacroCard({ titulo, g, kcal, cor, det }) {
  return (
    <div className="card card-pad" style={{ padding: 12 }}>
      <div className="row-between">
        <span className="font-label text-muted" style={{ fontSize: 10, textTransform: 'uppercase' }}>{titulo}</span>
        <Badge tipo={cor}>{det}</Badge>
      </div>
      <div className="mono" style={{ fontSize: 17, fontWeight: 500, color: `var(--${cor})`, marginTop: 4 }}>{g} g</div>
      <div className="text-muted mono" style={{ fontSize: 11 }}>{number(kcal)} kcal</div>
    </div>
  )
}

function Linha({ label, valor, ultimo }) {
  return (
    <div className="row-between" style={{ padding: '7px 0', borderBottom: ultimo ? 'none' : '1px solid var(--border)' }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <span className="mono" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{valor}</span>
    </div>
  )
}
