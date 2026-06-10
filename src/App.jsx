import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { IADrawerProvider } from './contexts/IADrawerContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'

import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Saude from './pages/saude/Saude.jsx'
import Financeiro from './pages/financeiro/Financeiro.jsx'
import Investimentos from './pages/investimentos/Investimentos.jsx'

// Componente raiz: providers globais + roteamento.
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <IADrawerProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/home" element={<Home />} />
                  <Route path="/saude" element={<Saude />} />
                  <Route path="/financeiro" element={<Financeiro />} />
                  <Route path="/investimentos" element={<Investimentos />} />
                </Route>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </BrowserRouter>
          </IADrawerProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
