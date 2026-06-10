import { NavLink } from 'react-router-dom'
import { NAV_ITENS } from './navConfig.js'
import { useIADrawer } from '../contexts/IADrawerContext.jsx'

// Barra de navegação inferior (mobile), com backdrop blur.
export default function MobileNav() {
  const { abrir } = useIADrawer()

  return (
    <nav
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '6px 6px max(6px, env(safe-area-inset-bottom))',
        background: 'color-mix(in srgb, var(--card) 90%, transparent)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
      }}
      className="mobile-only"
    >
      {NAV_ITENS.map(({ to, label, Icon, cor }) => (
        <NavLink key={to} to={to} style={{ flex: 1 }}>
          {({ isActive }) => (
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 0',
                color: isActive ? `var(--${cor})` : 'var(--text-muted)',
              }}
            >
              <Icon size={20} strokeWidth={2} />
              <span className="font-label" style={{ fontSize: 10 }}>{label}</span>
            </div>
          )}
        </NavLink>
      ))}

      {/* Botão IA */}
      <button
        onClick={abrir}
        aria-label="NEXUS IA"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          background: 'none', border: 'none', padding: '6px 0', color: 'var(--blue)',
        }}
      >
        <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 13 }}>∞</span>
        <span className="font-label" style={{ fontSize: 10 }}>IA</span>
      </button>
    </nav>
  )
}
