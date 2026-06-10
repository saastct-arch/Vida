// Primitivos de UI reutilizáveis: ProgressBar, Badge, Modal, Skeleton,
// cabeçalho de seção e ícone do Google.

import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// Mapa de cores de acento (para gradientes/barras)
const COR = {
  blue: 'var(--blue)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  violet: 'var(--violet)',
  gray: 'var(--gray-label)',
}

// Barra de progresso com gradiente na cor do módulo.
export function ProgressBar({ valor, cor = 'blue', altura = 3 }) {
  const pct = Math.max(0, Math.min(100, valor))
  const c = COR[cor] || cor
  return (
    <div className="progress" style={{ height: altura }}>
      <span style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c}, ${c}99)` }} />
    </div>
  )
}

// Badge pill (estados: green/red/amber/blue/violet)
export function Badge({ children, tipo = 'blue', style }) {
  return <span className={`badge badge-${tipo}`} style={style}>{children}</span>
}

// Cabeçalho de seção: label + linha separadora gradiente.
export function SectionHead({ children, right }) {
  return (
    <div className="section-head">
      <span className="label">{children}</span>
      <span className="line" />
      {right}
    </div>
  )
}

// Esqueleto de carregamento.
export function Skeleton({ w = '100%', h = 14, style }) {
  return <div className="skeleton" style={{ width: w, height: h, ...style }} />
}

// Modal centralizado (portal).
export function Modal({ aberto, onClose, titulo, children, footer }) {
  if (!aberto) return null
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row-between" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <strong className="font-label" style={{ fontSize: 15 }}>{titulo}</strong>
          <button className="btn-ghost" style={{ border: 0, background: 'none', padding: 4 }} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
        {footer && <div style={{ padding: '0 18px 18px' }}>{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

// Ícone oficial do Google (SVG colorido).
export function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  )
}

// Símbolo do infinito (logo da IA).
export function InfinitySymbol({ size = 14, color = '#fff' }) {
  return (
    <span style={{ fontFamily: 'var(--font-display)', fontSize: size, color, lineHeight: 1 }}>∞</span>
  )
}
