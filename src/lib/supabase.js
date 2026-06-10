import { createClient } from '@supabase/supabase-js'

// Cliente Supabase compartilhado por toda a aplicação.
// A anon key é pública; o acesso aos dados é protegido por RLS (auth.uid() = user_id).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Falha cedo e de forma clara caso o .env não esteja configurado.
  console.error('⚠️ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configurados.')
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'nexus-auth',
    // Sessão persistente por 30 dias (ver instruções de configuração no Supabase Auth).
  },
})

// Helper: retorna o user_id atual (ou null). Usado em inserts.
export async function currentUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}
