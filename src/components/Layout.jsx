import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import MobileNav from './MobileNav.jsx'
import IADrawer from './IADrawer.jsx'

// Casca da aplicação: sidebar (desktop) + barra inferior (mobile) + conteúdo + drawer IA.
export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
      <MobileNav />
      <IADrawer />
    </div>
  )
}
