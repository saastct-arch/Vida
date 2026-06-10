import { useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { listaComprasSemana, SUPLEMENTOS } from '../../lib/constants.js'
import { semanaDoMes, proximoDiaUtil } from '../../lib/dates.js'
import { money, toISODate } from '../../lib/format.js'
import { Badge, SectionHead } from '../../components/ui.jsx'

// Aba Compras: lista semanal automática + lançar no financeiro.
export default function TabCompras({ userId, data }) {
  const toast = useToast()
  const semana = semanaDoMes(data)
  const { itens, total, comGranola } = listaComprasSemana(semana)
  const [marcados, setMarcados] = useState(() => itens.map(() => false))
  const [lancando, setLancando] = useState(false)

  function toggle(i) {
    setMarcados((m) => m.map((v, idx) => (idx === i ? !v : v)))
  }

  async function lancarFinanceiro() {
    setLancando(true)
    const { error } = await supabase.from('gastos').insert({
      user_id: userId, data, descricao: `Compras (semana ${semana})`,
      valor: total, categoria: 'Alimentação', origem: 'Conta', parcelado: false,
    })
    setLancando(false)
    if (error) return toast.erro('Erro: ' + error.message)
    toast.ok(`Compras lançadas: ${money(total)} (Alimentação).`)
  }

  async function lancarSuplementos() {
    const primeiroUtil = toISODate(proximoDiaUtil(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
    const { error } = await supabase.from('gastos').insert([
      { user_id: userId, data: primeiroUtil, descricao: 'Whey protein', valor: SUPLEMENTOS.whey.preco, categoria: 'Saúde', origem: 'Conta' },
      { user_id: userId, data: primeiroUtil, descricao: 'Creatina', valor: SUPLEMENTOS.creatina.preco, categoria: 'Saúde', origem: 'Conta' },
    ])
    if (error) return toast.erro('Erro: ' + error.message)
    toast.ok('Suplementos lançados no 1º dia útil do mês.')
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 6 }}>
        <SectionHead>Lista da semana {semana}</SectionHead>
      </div>
      <div className="card card-pad">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <Badge tipo={comGranola ? 'green' : 'amber'}>{comGranola ? 'com granola' : 'sem granola'}</Badge>
          <span className="mono" style={{ fontSize: 16, color: 'var(--blue)' }}>{money(total)}</span>
        </div>

        <div className="col gap-6">
          {itens.map((it, i) => (
            <button key={it.item} onClick={() => toggle(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 0, padding: '6px 0', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <span className={`check-circle ${marcados[i] ? 'on' : ''}`} style={{ width: 18, height: 18, minWidth: 18 }}>{marcados[i] && <Check size={11} />}</span>
              <span style={{ flex: 1, fontSize: 13.5, textDecoration: marcados[i] ? 'line-through' : 'none', color: marcados[i] ? 'var(--text-muted)' : 'var(--text-primary)' }}>{it.item}</span>
              <span className="mono text-muted" style={{ fontSize: 12 }}>{money(it.valor)}</span>
            </button>
          ))}
        </div>

        <button className="btn btn-blue btn-full" style={{ marginTop: 14 }} onClick={lancarFinanceiro} disabled={lancando}>
          Lançar no financeiro · {money(total)}
        </button>
      </div>

      {/* Suplementos mensais */}
      <div className="page-section">
        <SectionHead>Suplementos do mês</SectionHead>
        <div className="card card-pad">
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13.5 }}>Whey {money(SUPLEMENTOS.whey.preco)} + Creatina {money(SUPLEMENTOS.creatina.preco)}</span>
            <span className="mono" style={{ fontSize: 14, color: 'var(--blue)' }}>{money(SUPLEMENTOS.whey.preco + SUPLEMENTOS.creatina.preco)}</span>
          </div>
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 10 }}>Lançados no 1º dia útil de cada mês (categoria Saúde).</div>
          <button className="btn btn-outline-blue btn-full" onClick={lancarSuplementos}>Lançar suplementos do mês</button>
        </div>
      </div>
    </div>
  )
}
