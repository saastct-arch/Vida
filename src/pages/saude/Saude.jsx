import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { toISODate } from '../../lib/format.js'
import DateSelector from '../../components/DateSelector.jsx'
import TabHoje from './TabHoje.jsx'
import TabTreino from './TabTreino.jsx'
import TabDieta from './TabDieta.jsx'
import TabPeso from './TabPeso.jsx'
import TabCompras from './TabCompras.jsx'

const ABAS = ['Hoje', 'Treino', 'Dieta', 'Peso', 'Compras']

// Módulo Saúde (/saude). Cor do módulo: --green.
export default function Saude() {
  const { user } = useAuth()
  const [aba, setAba] = useState('Hoje')
  const [data, setData] = useState(toISODate(new Date()))

  return (
    <div style={{ '--mod': 'var(--green)' }}>
      <div className="row-between" style={{ marginBottom: 14 }}>
        <h1 className="font-display" style={{ fontSize: 18, margin: 0 }}>Saúde</h1>
      </div>

      {/* Seletor de data (visível em todas as abas) */}
      <DateSelector value={data} onChange={setData} cor="green" />

      {/* Abas */}
      <div className="tabs" style={{ marginTop: 14 }}>
        {ABAS.map((a) => (
          <button key={a} className={`tab ${aba === a ? 'active' : ''}`} onClick={() => setAba(a)}>{a}</button>
        ))}
      </div>

      <div className="page-section">
        {aba === 'Hoje' && <TabHoje userId={user.id} data={data} />}
        {aba === 'Treino' && <TabTreino userId={user.id} />}
        {aba === 'Dieta' && <TabDieta />}
        {aba === 'Peso' && <TabPeso userId={user.id} />}
        {aba === 'Compras' && <TabCompras userId={user.id} data={data} />}
      </div>
    </div>
  )
}
