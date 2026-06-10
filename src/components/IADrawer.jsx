import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Send } from 'lucide-react'
import { useIADrawer } from '../contexts/IADrawerContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { chatIA } from '../lib/ia.js'
import { coletarContexto } from '../lib/iaContext.js'
import { Skeleton } from './ui.jsx'

const CHIPS = [
  'Como está meu peso?',
  'Estou no caminho certo?',
  'Ajustar treino',
  'Replanejo aportes',
  'Quanto terei no casamento?',
]

// Drawer lateral direito (340px) com o chat livre da NEXUS IA (Opus 4.8 + thinking).
export default function IADrawer() {
  const { aberto, fechar } = useIADrawer()
  const { user } = useAuth()
  const [mensagens, setMensagens] = useState([])
  const [entrada, setEntrada] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [contexto, setContexto] = useState(null)
  const fimRef = useRef(null)

  // Coleta o contexto do usuário ao abrir pela primeira vez.
  useEffect(() => {
    if (aberto && user && !contexto) {
      coletarContexto(user.id).then(setContexto).catch(() => {})
    }
  }, [aberto, user, contexto])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, carregando])

  async function enviar(texto) {
    const conteudo = (texto ?? entrada).trim()
    if (!conteudo || carregando) return
    const historico = [...mensagens, { role: 'user', content: conteudo }]
    setMensagens(historico)
    setEntrada('')
    setCarregando(true)
    try {
      const ctx = contexto || (user ? await coletarContexto(user.id) : {})
      const resposta = await chatIA(historico, ctx)
      setMensagens((m) => [...m, { role: 'assistant', content: resposta }])
    } catch (e) {
      setMensagens((m) => [...m, { role: 'assistant', content: `⚠️ ${e.message}` }])
    } finally {
      setCarregando(false)
    }
  }

  if (!aberto) return null

  return createPortal(
    <>
      {/* Overlay */}
      <div onClick={fechar} style={{ position: 'fixed', inset: 0, background: 'rgba(13,15,20,0.4)', zIndex: 70 }} />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(340px, 92vw)', zIndex: 71,
          background: 'var(--card)', borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-pop)',
          animation: 'drawerIn 0.22s ease',
        }}
      >
        {/* Header */}
        <div className="row-between" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div className="row gap-8">
            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--blue)', fontSize: 18 }}>∞</span>
            <span className="font-label" style={{ fontWeight: 500 }}>NEXUS IA</span>
            <span className="mono badge-blue" style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20 }}>opus-4.8 · thinking</span>
          </div>
          <button onClick={fechar} className="btn-ghost" style={{ border: 0, background: 'none', padding: 4 }} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mensagens.length === 0 && (
            <div className="text-muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 16 }}>
              Pergunte qualquer coisa sobre sua vida financeira, saúde ou metas.
            </div>
          )}
          {mensagens.map((m, i) => (
            <Bolha key={i} role={m.role}>{m.content}</Bolha>
          ))}
          {carregando && (
            <div style={{ alignSelf: 'flex-start', width: '80%' }}>
              <Skeleton h={12} style={{ marginBottom: 6 }} />
              <Skeleton h={12} w="90%" style={{ marginBottom: 6 }} />
              <Skeleton h={12} w="60%" />
            </div>
          )}
          <div ref={fimRef} />
        </div>

        {/* Chips de sugestão */}
        <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CHIPS.map((c) => (
            <button key={c} onClick={() => enviar(c)} disabled={carregando} className="font-label"
              style={{ fontSize: 11, padding: '5px 10px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Entrada */}
        <div className="row gap-8" style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <input
            className="input"
            placeholder="Escreva uma mensagem…"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
          />
          <button className="btn btn-blue" onClick={() => enviar()} disabled={carregando} style={{ padding: '10px 12px' }} aria-label="Enviar">
            <Send size={16} />
          </button>
        </div>
      </div>
      <style>{`@keyframes drawerIn { from { transform: translateX(20px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
    </>,
    document.body
  )
}

// Bolha de mensagem.
function Bolha({ role, children }) {
  const isUser = role === 'user'
  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        background: isUser ? 'color-mix(in srgb, var(--blue) 20%, transparent)' : 'var(--card)',
        border: isUser ? 'none' : '1px solid var(--border)',
        borderLeft: isUser ? 'none' : '2px solid var(--blue)',
        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        padding: '9px 12px', fontSize: 13.5, lineHeight: 1.55,
        whiteSpace: 'pre-wrap', color: 'var(--text-primary)',
      }}
    >
      {children}
    </div>
  )
}
