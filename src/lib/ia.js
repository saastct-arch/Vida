// ════════════════════════════════════════════════════════════════════
// NEXUS · Cliente de IA
// Estratégia de chamada:
//   1) POST /api/ia  → função serverless da Vercel (chave no servidor, seguro)
//   2) Fallback (apenas dev): SDK no browser com VITE_ANTHROPIC_API_KEY
//      (inseguro — expõe a chave; use somente localmente)
// ════════════════════════════════════════════════════════════════════

const MODELO_RESUMO = 'claude-haiku-4-5-20251001'
const MODELO_CHAT = 'claude-opus-4-8'

// Indica se há alguma forma de IA configurada.
export function iaDisponivel() {
  return Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY) || true // /api/ia pode existir em produção
}

// Chamada via função serverless da Vercel.
async function viaServerless(payload) {
  const resp = await fetch('/api/ia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error(`serverless ${resp.status}: ${txt}`)
  }
  const data = await resp.json()
  return data.text || ''
}

// Fallback de desenvolvimento: chama o SDK direto do browser.
async function viaBrowserSDK({ mode, system, messages }) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!key) throw new Error('sem-chave')
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true })

  const params =
    mode === 'chat'
      ? {
          // max_tokens precisa ser maior que o budget de thinking (8000)
          model: MODELO_CHAT,
          max_tokens: 12000,
          thinking: { type: 'enabled', budget_tokens: 8000 },
          system,
          messages,
        }
      : { model: MODELO_RESUMO, max_tokens: 1000, system, messages }

  const msg = await client.messages.create(params)
  const bloco = (msg.content || []).find((b) => b.type === 'text')
  return bloco?.text || ''
}

// Tenta serverless e, em caso de falha, o SDK do browser.
async function chamar(payload) {
  try {
    return await viaServerless(payload)
  } catch (e) {
    try {
      return await viaBrowserSDK(payload)
    } catch (e2) {
      throw e2.message === 'sem-chave'
        ? new Error('IA não configurada. Defina ANTHROPIC_API_KEY (serverless) ou VITE_ANTHROPIC_API_KEY (dev).')
        : e2
    }
  }
}

// ───────── Resumo diário (Home) ─────────
// Modelo Haiku, máx 1000 tokens. 3–4 frases, tom técnico-pessoal.
export async function gerarResumoDiario(contexto) {
  const system =
    'Você é a NEXUS IA, assistente pessoal de um painel de vida (saúde, finanças, investimentos). ' +
    'Gere um resumo do dia em português do Brasil, tom técnico-pessoal e direto, de 3 a 4 frases. ' +
    'Não use listas nem markdown. Seja específico com os números fornecidos.'
  const user =
    'Contexto do dia (JSON):\n' +
    JSON.stringify(contexto, null, 2) +
    '\n\nEscreva o resumo do dia.'
  return chamar({ mode: 'resumo', system, messages: [{ role: 'user', content: user }] })
}

// ───────── Chat livre (drawer IA) ─────────
// Modelo Opus 4.8 com extended thinking (budget 8000).
export async function chatIA(historico, contexto) {
  const system =
    'Você é a NEXUS IA, assistente pessoal do painel de vida do usuário. ' +
    'Responda em português do Brasil, com precisão e tom técnico-pessoal. ' +
    'Use os dados de contexto (finanças, saúde, peso, treinos, investimentos e metas) para dar respostas concretas e acionáveis. ' +
    'Você apenas sugere; o usuário decide e confirma manualmente.\n\n' +
    'CONTEXTO DO USUÁRIO (JSON):\n' + JSON.stringify(contexto, null, 2)
  const messages = historico.map((m) => ({ role: m.role, content: m.content }))
  return chamar({ mode: 'chat', system, messages })
}
