import { NavLink } from 'react-router-dom'
import { NAV_ITENS } from './navConfig.js'
import { useIADrawer } from '../contexts/IADrawerContext.jsx'

// Sidebar de navegação (desktop) — 68px de largura.
export default function Sidebar() {
  const { abrir } = useIADrawer()

  return (
    <aside
      className="hide-mobile"
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 68, zIndex: 40,
        background: 'var(--card)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '18px 0',
      }}
    >
      {/* Logo NX vertical */}
      <div
        className="font-display"
        style={{ color: 'var(--blue)', fontSize: 18, letterSpacing: '0.12em', marginBottom: 26, lineHeight: 1.1, textAlign: 'center' }}
      >
        N<br />X
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', alignItems: 'center' }}>
        {NAV_ITENS.map(({ to, label, Icon, cor }) => (
          <NavLink key={to} to={to} title={label} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {({ isActive }) => (
              <div
                style={{
                  position: 'relative', width: 44, height: 44, borderRadius: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? `var(--${cor}-light-bg)` : 'transparent',
                  color: isActive ? `var(--${cor})` : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isActive && (
                  <span style={{ position: 'absolute', left: -12, top: 9, bottom: 9, width: 2, borderRadius: 2, background: `var(--${cor})` }} />
                )}
                <Icon size={18} strokeWidth={2} />
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Botão IA */}
      <button
        onClick={abrir}
        title="NEXUS IA"
        style={{
          marginTop: 'auto', width: 38, height: 38, borderRadius: '50%',
          background: 'var(--blue)', color: '#fff', border: 'none',
          fontFamily: 'var(--font-display)', fontSize: 14, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        ∞
      </button>
    </aside>
  )
}
