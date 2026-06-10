import { createContext, useContext, useState, useCallback } from 'react'

// Sistema simples de toasts (notificações temporárias).
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remover = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const mostrar = useCallback(
    (mensagem, tipo = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, mensagem, tipo }])
      setTimeout(() => remover(id), 3200)
    },
    [remover]
  )

  const toast = {
    ok: (m) => mostrar(m, 'ok'),
    erro: (m) => mostrar(m, 'err'),
    info: (m) => mostrar(m, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tipo}`} onClick={() => remover(t.id)}>
            {t.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
