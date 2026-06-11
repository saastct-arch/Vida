import { createContext, useContext, useState, useCallback } from 'react'

// Controla a abertura do drawer de IA (acessível pelo botão ∞ em qualquer tela).
const IADrawerContext = createContext(null)

export function IADrawerProvider({ children }) {
  const [aberto, setAberto] = useState(false)
  const abrir = useCallback(() => setAberto(true), [])
  const fechar = useCallback(() => setAberto(false), [])
  return (
    <IADrawerContext.Provider value={{ aberto, abrir, fechar }}>
      {children}
    </IADrawerContext.Provider>
  )
}

export const useIADrawer = () => useContext(IADrawerContext)
