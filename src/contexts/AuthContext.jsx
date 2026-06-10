import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// Contexto de autenticação (Supabase Auth).
// Sessão persistente; sem sessão a aplicação redireciona para /login.

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setCarregando(false)
    })

    // Atualizações de sessão (login, logout, refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      setUser(sess?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const api = {
    session,
    user,
    carregando,
    // E-mail + senha
    async entrar(email, senha) {
      return supabase.auth.signInWithPassword({ email, password: senha })
    },
    async cadastrar(email, senha, nome) {
      return supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } },
      })
    },
    // Google OAuth
    async entrarComGoogle() {
      return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/home' },
      })
    },
    async recuperarSenha(email) {
      return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      })
    },
    async sair() {
      return supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
