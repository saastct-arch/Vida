import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { Badge } from '../../components/ui.jsx'

// Campos nutricionais (chave no banco -> rótulo)
const CAMPOS_VAZIOS = {
  calorias: '', proteinas_g: '', carboidratos_g: '', fibras_g: '', acucares_g: '',
  gorduras_totais_g: '', gordura_saturada_mg: '', colesterol_mg: '', sodio_mg: '',
  potassio_mg: '', observacao: '',
}

// Card de refeição expansível com campos nutricionais agrupados por categoria.
export default function MealCard({ userId, data, refeicao, registro, sugestao, onSaved }) {
  const toast = useToast()
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState(() => carregarForm(registro))

  const concluida = registro?.concluida
  const estado = concluida ? 'green' : refeicao.obrigatoria ? 'red' : 'open'
  const badge = concluida
    ? { tipo: 'green', txt: 'registrado' }
    : refeicao.obrigatoria
      ? { tipo: 'red', txt: 'obrigatório' }
      : { tipo: 'amber', txt: 'em aberto' }
  const btnClasse = estado === 'red' ? 'btn-red' : estado === 'green' ? 'btn-green' : 'btn-blue'
  const focusClasse = estado === 'red' ? 'focus-red' : estado === 'green' ? 'focus-green' : 'focus-blue'
  const blClasse = estado === 'green' ? 'bl-green' : estado === 'red' ? 'bl-red' : ''

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function salvar() {
    setSalvando(true)
    const payload = {
      user_id: userId,
      data,
      refeicao: refeicao.nome,
      concluida: true,
      observacao: form.observacao || null,
      calorias: num(form.calorias),
      proteinas_g: num(form.proteinas_g),
      carboidratos_g: num(form.carboidratos_g),
      fibras_g: num(form.fibras_g),
      acucares_g: num(form.acucares_g),
      gorduras_totais_g: num(form.gorduras_totais_g),
      gordura_saturada_mg: num(form.gordura_saturada_mg),
      colesterol_mg: num(form.colesterol_mg),
      sodio_mg: num(form.sodio_mg),
      potassio_mg: num(form.potassio_mg),
    }
    const { error } = await supabase
      .from('refeicoes_registros')
      .upsert(payload, { onConflict: 'user_id,data,refeicao' })
    setSalvando(false)
    if (error) return toast.erro('Erro ao salvar: ' + error.message)
    toast.ok(`${refeicao.nome} registrado.`)
    setAberto(false)
    onSaved?.()
  }

  return (
    <div className={`card ${blClasse}`}>
      {/* Header */}
      <button onClick={() => setAberto((a) => !a)}
        style={{ width: '100%', background: 'none', border: 0, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={`check-circle ${concluida ? 'on' : ''}`}>{concluida && <Check size={13} />}</span>
        <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 500, display: 'block' }}>{refeicao.nome}</span>
          {refeicao.horario && <span className="font-label text-muted" style={{ fontSize: 10 }}>{refeicao.horario}</span>}
        </span>
        <Badge tipo={badge.tipo}>{badge.txt}</Badge>
        <ChevronDown size={17} className={`chevron ${aberto ? 'open' : ''}`} color="var(--text-muted)" />
      </button>

      {/* Body expansível */}
      {aberto && (
        <div style={{ padding: '4px 14px 16px' }}>
          {/* Sugestão do plano para o dia */}
          {sugestao?.length > 0 && (
            <div style={{ background: 'var(--green-light-bg)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <div className="font-label" style={{ fontSize: 10, color: 'var(--green-dark)', marginBottom: 4 }}>SUGESTÃO DO PLANO</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{sugestao.join(' · ')}</div>
            </div>
          )}
          {refeicao.nota && (
            <div className="text-muted" style={{ fontSize: 11.5, marginBottom: 12, fontStyle: 'italic' }}>{refeicao.nota}</div>
          )}

          {/* CALORIAS — destaque isolado */}
          <div style={{ background: 'var(--amber-light-bg)', border: '1px solid var(--amber-border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span className="font-label" style={{ fontSize: 11, color: 'var(--amber-dark)', letterSpacing: '0.04em' }}>CALORIAS TOTAIS</span>
            <div className="row gap-8">
              <input type="number" inputMode="decimal" value={form.calorias} onChange={set('calorias')}
                style={{ width: 110, textAlign: 'center', background: '#fff', border: '1.5px solid var(--amber-border)', borderRadius: 8, padding: '8px 6px', fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--amber)' }} placeholder="0" />
              <span className="font-label" style={{ fontSize: 12, color: 'var(--amber-dark)' }}>kcal</span>
            </div>
          </div>

          {/* PROTEÍNAS */}
          <Grupo cor="green" titulo="Proteínas">
            <Campo label="Proteínas" labelCor="green-dark" unidade="gramas (g)" value={form.proteinas_g} onChange={set('proteinas_g')} focus="focus-green" />
          </Grupo>

          {/* CARBOIDRATOS */}
          <Grupo cor="blue" titulo="Carboidratos">
            <Campo label="Carboidratos totais" labelCor="blue-dark" unidade="gramas (g)" value={form.carboidratos_g} onChange={set('carboidratos_g')} focus="focus-blue" />
            <Subgrupo>
              <Campo label="↳ Fibras" labelCor="blue-sub" unidade="g" value={form.fibras_g} onChange={set('fibras_g')} focus="focus-blue" pequeno />
              <Campo label="↳ Açúcares" labelCor="blue-sub" unidade="g" value={form.acucares_g} onChange={set('acucares_g')} focus="focus-blue" pequeno />
            </Subgrupo>
          </Grupo>

          {/* GORDURAS */}
          <Grupo cor="amber" titulo="Gorduras">
            <Campo label="Gorduras totais" labelCor="amber-dark" unidade="gramas (g)" value={form.gorduras_totais_g} onChange={set('gorduras_totais_g')} focus="focus-amber" />
            <Subgrupo>
              <Campo label="↳ Gordura saturada" labelCor="amber-sub" unidade="mg" value={form.gordura_saturada_mg} onChange={set('gordura_saturada_mg')} focus="focus-amber" pequeno />
              <Campo label="↳ Colesterol" labelCor="amber-sub" unidade="mg" value={form.colesterol_mg} onChange={set('colesterol_mg')} focus="focus-amber" pequeno />
            </Subgrupo>
          </Grupo>

          {/* MINERAIS */}
          <Grupo cor="gray" titulo="Minerais">
            <Subgrupo>
              <Campo label="Sódio" labelCor="gray-label" unidade="mg" value={form.sodio_mg} onChange={set('sodio_mg')} focus="focus-gray" pequeno />
              <Campo label="Potássio" labelCor="gray-label" unidade="mg" value={form.potassio_mg} onChange={set('potassio_mg')} focus="focus-gray" pequeno />
            </Subgrupo>
          </Grupo>

          {/* Observações */}
          <div className="field" style={{ marginTop: 14 }}>
            <label>Observações</label>
            <textarea className={`textarea ${focusClasse}`} value={form.observacao} onChange={set('observacao')} placeholder="Ex.: refeição livre, fora de casa…" />
          </div>

          <button className={`btn ${btnClasse} btn-full`} style={{ marginTop: 14 }} onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar refeição'}
          </button>
        </div>
      )}
    </div>
  )
}

// ───────── Subcomponentes ─────────
function Grupo({ cor, titulo, children }) {
  const labelCor = cor === 'gray' ? 'var(--gray-label)' : `var(--${cor}-dark)`
  const grad = cor === 'gray' ? 'var(--gray-light-bg)' : `var(--${cor})`
  return (
    <div style={{ marginTop: 14 }}>
      <div className="row gap-8" style={{ marginBottom: 8 }}>
        <span className="font-label" style={{ fontSize: 10, color: labelCor, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{titulo}</span>
        <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${grad}, transparent)` }} />
      </div>
      {children}
    </div>
  )
}

function Subgrupo({ children }) {
  return (
    <div style={{ background: 'var(--subgroup-bg)', border: '1px solid var(--subgroup-border)', borderRadius: 8, padding: 10, marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {children}
    </div>
  )
}

function Campo({ label, labelCor, unidade, value, onChange, focus, pequeno }) {
  return (
    <div className="field">
      <label style={{ color: `var(--${labelCor})`, fontSize: pequeno ? 11 : 12 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type="number" inputMode="decimal" className={`input input-num ${focus}`} value={value} onChange={onChange} placeholder="0" style={{ paddingRight: 52 }} />
        <span className="text-muted font-label" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, pointerEvents: 'none' }}>{unidade}</span>
      </div>
    </div>
  )
}

// ───────── Helpers ─────────
function carregarForm(registro) {
  if (!registro) return { ...CAMPOS_VAZIOS }
  const f = { ...CAMPOS_VAZIOS }
  for (const k of Object.keys(CAMPOS_VAZIOS)) {
    if (registro[k] != null) f[k] = String(registro[k])
  }
  return f
}
function num(v) {
  if (v === '' || v == null) return null
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
