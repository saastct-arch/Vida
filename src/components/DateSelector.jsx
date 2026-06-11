import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toISODate, dataExtenso, nomeDiaSemana } from '../lib/format.js'

// Seletor de data com botões ◀ ▶ e campo nativo. Default: hoje.
// Permite navegação retroativa (lançamentos em dias anteriores).
export default function DateSelector({ value, onChange, cor = 'green' }) {
  function deslocar(dias) {
    const d = new Date(value + 'T00:00:00')
    d.setDate(d.getDate() + dias)
    onChange(toISODate(d))
  }
  const hoje = toISODate(new Date())
  const ehHoje = value === hoje

  return (
    <div className="row-between card card-pad" style={{ padding: '10px 12px', gap: 8 }}>
      <button className="btn-ghost" style={{ border: 0, padding: 6, borderRadius: 8 }} onClick={() => deslocar(-1)} aria-label="Dia anterior">
        <ChevronLeft size={18} />
      </button>

      <div className="center" style={{ flexDirection: 'column', gap: 2, flex: 1 }}>
        <label style={{ position: 'relative', cursor: 'pointer' }}>
          <span className="font-label" style={{ fontSize: 13, fontWeight: 500, color: `var(--${cor})` }}>
            {nomeDiaSemana(value)}
          </span>
          <span className="text-muted" style={{ fontSize: 11, display: 'block', textAlign: 'center' }}>
            {dataExtenso(value)}{ehHoje ? ' · hoje' : ''}
          </span>
          <input
            type="date"
            value={value}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          />
        </label>
      </div>

      <button className="btn-ghost" style={{ border: 0, padding: 6, borderRadius: 8 }} onClick={() => deslocar(1)} aria-label="Próximo dia">
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
