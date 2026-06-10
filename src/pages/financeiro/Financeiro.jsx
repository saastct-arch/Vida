import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import TabDashboard from './TabDashboard.jsx'
import TabCalendario from './TabCalendario.jsx'
import TabGastos from './TabGastos.jsx'
import TabCartao from './TabCartao.jsx'
import TabVR from './TabVR.jsx'
import TabCasamento from './TabCasamento.jsx'

const ABAS = ['Dashboard', 'Calendário', 'Gastos', 'Cartão', 'VR', 'Casamento']

// Módulo Financeiro (/financeiro). Cor do módulo: --blue.
export default function Financeiro() {
  const { user } = useAuth()
  const [aba, setAba] = useState('Dashboard')

  return (
    <div style={{ '--mod': 'var(--blue)' }}>
      <h1 className="font-display" style={{ fontSize: 18, margin: '0 0 14px' }}>Financeiro</h1>

      <div className="tabs">
        {ABAS.map((a) => (
          <button key={a} className={`tab ${aba === a ? 'active' : ''}`} onClick={() => setAba(a)}>{a}</button>
        ))}
      </div>

      <div className="page-section">
        {aba === 'Dashboard' && <TabDashboard userId={user.id} />}
        {aba === 'Calendário' && <TabCalendario userId={user.id} />}
        {aba === 'Gastos' && <TabGastos userId={user.id} />}
        {aba === 'Cartão' && <TabCartao userId={user.id} />}
        {aba === 'VR' && <TabVR userId={user.id} />}
        {aba === 'Casamento' && <TabCasamento userId={user.id} />}
      </div>
    </div>
  )
}
