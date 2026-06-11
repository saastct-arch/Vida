// ════════════════════════════════════════════════════════════════════
// Função serverless da Vercel — proxy seguro para a API da Anthropic.
// A chave ANTHROPIC_API_KEY fica SOMENTE no servidor (nunca no browser).
// Endpoint: POST /api/ia  body: { mode, system, messages }
// ════════════════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk'

const MODELO_RESUMO = 'claude-haiku-4-5-20251001'
const MODELO_CHAT = 'claude-opus-4-8'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor.' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const { mode = 'resumo', system = '', messages = [] } = body

    const client = new Anthropic({ apiKey })

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
    res.status(200).json({ text: bloco?.text || '' })
  } catch (err) {
    console.error('Erro /api/ia:', err)
    res.status(500).json({ error: err?.message || 'Erro ao chamar a IA.' })
  }
}
