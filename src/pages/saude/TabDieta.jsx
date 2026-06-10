import { PLANO_DIETA } from '../../lib/constants.js'
import { SectionHead } from '../../components/ui.jsx'

// Aba Dieta: plano semanal completo (somente leitura, editável apenas via IA).
export default function TabDieta() {
  return (
    <div>
      <div className="card bl-green card-pad" style={{ marginBottom: 14 }}>
        <div className="font-label" style={{ fontSize: 11, color: 'var(--green-dark)', marginBottom: 4 }}>PLANO ALIMENTAR</div>
        <div className="text-secondary" style={{ fontSize: 13 }}>
          Plano semanal de referência. Para ajustes, peça à NEXUS IA (botão ∞).
        </div>
      </div>

      <div className="col gap-12">
        {Object.entries(PLANO_DIETA).map(([dia, refeicoes]) => (
          <div key={dia} className="card card-pad">
            <SectionHead>{dia}</SectionHead>
            <div className="col gap-8">
              {Object.entries(refeicoes).map(([refeicao, desc]) => (
                <div key={refeicao} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                  <span className="font-label" style={{ fontSize: 11, color: 'var(--green-dark)', minWidth: 110 }}>{refeicao}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
