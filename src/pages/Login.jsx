import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'
import { GoogleIcon } from '../components/ui.jsx'

// Tela de login (/login) — e-mail+senha e Google OAuth.
export default function Login() {
  const { user, entrar, cadastrar, entrarComGoogle, recuperarSenha } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [modo, setModo] = useState('entrar') // 'entrar' | 'cadastrar'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)

  // Já autenticado → vai para a home.
  useEffect(() => {
    if (user) navigate('/home', { replace: true })
  }, [user, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    if (!email || !senha) return toast.erro('Preencha e-mail e senha.')
    setCarregando(true)
    try {
      if (modo === 'entrar') {
        const { error } = await entrar(email, senha)
        if (error) throw error
        navigate('/home', { replace: true })
      } else {
        const { error } = await cadastrar(email, senha, nome)
        if (error) throw error
        toast.ok('Conta criada! Verifique seu e-mail se a confirmação estiver ativa.')
        setModo('entrar')
      }
    } catch (err) {
      toast.erro(traduzErro(err.message))
    } finally {
      setCarregando(false)
    }
  }

  async function onGoogle() {
    setCarregando(true)
    const { error } = await entrarComGoogle()
    if (error) {
      toast.erro(traduzErro(error.message))
      setCarregando(false)
    }
  }

  async function onEsqueci() {
    if (!email) return toast.erro('Informe seu e-mail para recuperar a senha.')
    const { error } = await recuperarSenha(email)
    if (error) toast.erro(traduzErro(error.message))
    else toast.ok('Enviamos um link de recuperação para seu e-mail.')
  }

  return (
    <div className="center" style={{ minHeight: '100vh', padding: 18, background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: '34px 28px' }}>
        {/* Logo */}
        <div className="font-display" style={{ textAlign: 'center', fontSize: 30, letterSpacing: '0.25em', fontWeight: 800 }}>
          <span style={{ color: 'var(--text-primary)' }}>NEX</span>
          <span style={{ color: 'var(--blue)' }}>US</span>
        </div>
        <div className="font-label text-muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 6 }}>
          Seu painel de vida
        </div>

        {/* Tag row */}
        <div className="center gap-12" style={{ margin: '18px 0 24px' }}>
          <Tag cor="var(--blue)" label="saúde" />
          <Tag cor="var(--green)" label="finanças" />
          <Tag cor="var(--amber)" label="metas" />
        </div>

        <form onSubmit={onSubmit} className="col gap-12">
          {modo === 'cadastrar' && (
            <div className="field">
              <label>Nome</label>
              <input className="input focus-blue" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
            </div>
          )}
          <div className="field">
            <label>E-mail</label>
            <input className="input focus-blue" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          </div>
          <div className="field">
            <label>Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input focus-blue"
                type={verSenha ? 'text' : 'password'}
                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: 40 }}
              />
              <button type="button" onClick={() => setVerSenha((v) => !v)} className="btn-ghost"
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'none', padding: 6, color: 'var(--text-muted)' }}
                aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}>
                {verSenha ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-blue btn-full" disabled={carregando} style={{ marginTop: 4 }}>
            {carregando ? '...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {/* Divisor */}
        <div className="row gap-10" style={{ margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span className="text-muted font-label" style={{ fontSize: 12 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button onClick={onGoogle} className="btn btn-outline btn-full" disabled={carregando}>
          <GoogleIcon /> Continuar com Google
        </button>

        <div className="center" style={{ marginTop: 16, flexDirection: 'column', gap: 8 }}>
          <button onClick={onEsqueci} className="btn-ghost" style={{ background: 'none', border: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Esqueci minha senha
          </button>
          <button onClick={() => setModo((m) => (m === 'entrar' ? 'cadastrar' : 'entrar'))}
            className="btn-ghost font-label" style={{ background: 'none', border: 0, fontSize: 12, color: 'var(--blue)' }}>
            {modo === 'entrar' ? 'Não tem conta? Criar agora' : 'Já tenho conta — Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Tag({ cor, label }) {
  return (
    <div className="row gap-6">
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cor }} />
      <span className="font-label text-muted" style={{ fontSize: 10 }}>{label}</span>
    </div>
  )
}

// Traduz mensagens comuns de erro do Supabase para PT-BR.
function traduzErro(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered')) return 'Este e-mail já está cadastrado.'
  if (m.includes('password should be')) return 'A senha deve ter pelo menos 6 caracteres.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('provider is not enabled')) return 'Login com Google não está habilitado no Supabase.'
  return msg || 'Ocorreu um erro. Tente novamente.'
}
