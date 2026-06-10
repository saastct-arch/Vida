import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Tema automático: claro 07h–19h, escuro 19h–07h (horário local do browser).
// O usuário pode forçar manualmente; a opção fica guardada em localStorage.

const ThemeContext = createContext(null)

function temaPorHorario() {
  const h = new Date().getHours()
  return h >= 7 && h < 19 ? 'light' : 'dark'
}

export function ThemeProvider({ children }) {
  // modo: 'auto' | 'light' | 'dark'
  const [modo, setModo] = useState(() => localStorage.getItem('nexus-theme-modo') || 'auto')
  const [tema, setTema] = useState(() => (localStorage.getItem('nexus-theme-modo') === 'light' || localStorage.getItem('nexus-theme-modo') === 'dark' ? localStorage.getItem('nexus-theme-modo') : temaPorHorario()))

  // Aplica o atributo data-theme no <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'dark' ? '#0D0F14' : '#4F6EF7')
  }, [tema])

  // Reavalia o tema automático periodicamente (a cada minuto).
  useEffect(() => {
    if (modo !== 'auto') return
    const aplicar = () => setTema(temaPorHorario())
    aplicar()
    const id = setInterval(aplicar, 60 * 1000)
    return () => clearInterval(id)
  }, [modo])

  // Alterna manualmente entre claro/escuro (sai do modo automático).
  const alternar = useCallback(() => {
    setTema((t) => {
      const novo = t === 'dark' ? 'light' : 'dark'
      setModo(novo)
      localStorage.setItem('nexus-theme-modo', novo)
      return novo
    })
  }, [])

  // Volta ao modo automático.
  const usarAuto = useCallback(() => {
    setModo('auto')
    localStorage.setItem('nexus-theme-modo', 'auto')
    setTema(temaPorHorario())
  }, [])

  return (
    <ThemeContext.Provider value={{ tema, modo, alternar, usarAuto }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
