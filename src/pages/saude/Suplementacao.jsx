import { useEffect, useState, useCallback } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useToast } from '../../contexts/ToastContext.jsx'
import { SUPLEMENTOS } from '../../lib/constants.js'
import { Badge, Skeleton } from '../../components/ui.jsx'

// Suplementação do dia: Whey + Creatina. Alertas de estoque baixo.
export default function Suplementacao({ userId, data }) {
  const toast = useToast()
  const [carregando, setCarregando] = useState(true)
  const [reg, setReg] = useState(null)
  const [config, setConfig] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const [s, c] = await Promise.all([
      supabase.from('suplementacao').select('*').eq('user_id', userId).eq('data', data).maybeSingle(),
      supabase.from('configuracoes').select('estoque_whey_doses,estoque_creatina_dias').eq('user_id', userId).maybeSingle(),
    ])
    setReg(s.data || null)
    setConfig(c.data || {})
    setCarregando(false)
  }, [userId, data])

  useEffect(() => { carregar() }, [carregar])

  async function toggle(campo) {
    const atual = reg?.[campo] || false
    const { error } = await supabase
      .from('suplementacao')
      .upsert({ user_id: userId, data, [campo]: !atual, whey: campo === 'whey' ? !atual : reg?.whey || false, creatina: campo === 'creatina' ? !atual : reg?.creatina || false }, { onConflict: 'user_id,data' })
    if (error) return toast.erro('Erro: ' + error.message)
    carregar()
  }

  if (carregando) return <Skeleton h={90} />

  const wheyDoses = config?.estoque_whey_doses
  const creatinaDias = config?.estoque_creatina_dias
  const alertaWhey = wheyDoses != null && wheyDoses < SUPLEMENTOS.whey.alertaDoses
  const alertaCreatina = creatinaDias != null && creatinaDias < SUPLEMENTOS.creatina.alertaDias

  return (
    <div className="grid grid-2">
      <SupCard nome="Whey protein" on={reg?.whey} onToggle={() => toggle('whey')}
        estoque={wheyDoses != null ? `${wheyDoses} doses` : 'estoque não informado'} alerta={alertaWhey} />
      <SupCard nome="Creatina" on={reg?.creatina} onToggle={() => toggle('creatina')}
        estoque={creatinaDias != null ? `${creatinaDias} dias` : 'estoque não informado'} alerta={alertaCreatina} />
    </div>
  )
}

function SupCard({ nome, on, onToggle, estoque, alerta }) {
  return (
    <div className="card card-pad" style={{ padding: 12 }}>
      <div className="row gap-10">
        <button onClick={onToggle} className={`check-circle ${on ? 'on' : ''}`} style={{ border: 0, background: on ? 'var(--green)' : 'var(--card)', boxShadow: on ? 'none' : 'inset 0 0 0 2px var(--border-input)' }}>
          {on && <Check size={13} />}
        </button>
        <div className="flex-1">
          <div style={{ fontSize: 13, fontWeight: 500 }}>{nome}</div>
          <div className="text-muted mono" style={{ fontSize: 11 }}>{estoque}</div>
        </div>
        {alerta && <Badge tipo="amber">repor</Badge>}
      </div>
    </div>
  )
}
