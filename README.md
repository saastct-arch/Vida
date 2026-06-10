# NEXUS — Seu painel de vida

Sistema web pessoal para gestão de **saúde**, **finanças** e **investimentos**.
Conceito visual: _"Clareza em movimento"_ — clean, pessoal e arejado, com tema
claro/escuro automático conforme o horário.

**Stack:** React + Vite · Supabase (Auth + Postgres + RLS) · Vercel · Recharts ·
IA da Anthropic (resumo diário com Haiku e chat com Opus 4.8).

Início operacional: **01/07/2026** · Cidade base: **Ipatinga-MG**.

---

## 📁 Estrutura

```
.
├── api/ia.js                 # Função serverless (proxy seguro p/ Anthropic)
├── supabase/migrations/      # Migration SQL (tabelas + RLS + triggers)
├── src/
│   ├── lib/                  # supabase, datas/feriados, finanças, IA, constantes
│   ├── contexts/             # Auth, Tema, Toast, Drawer IA
│   ├── components/           # Layout, navegação, UI, drawer IA, seletor de data
│   └── pages/                # Login, Home, saude/, financeiro/, investimentos/
├── .env.example              # Modelo de variáveis de ambiente
├── vercel.json               # Build + rewrites (SPA + /api)
└── vite.config.js
```

---

## 🚀 Rodando localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
#    edite o .env (Supabase já vem preenchido; a chave da Anthropic é opcional)

# 3. Subir em desenvolvimento
npm run dev          # http://localhost:5173

# Build de produção
npm run build && npm run preview
```

---

## 🗄️ Configurando o Supabase

1. Acesse o painel do projeto Supabase.
2. **SQL Editor → New query** e cole o conteúdo de
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   Execute. Isso cria **todas as tabelas**, ativa **RLS** em cada uma e aplica a
   policy `auth.uid() = user_id`. Também cria um _trigger_ que gera
   automaticamente `profiles` e `configuracoes` a cada novo usuário.

   > Alternativa via CLI: `supabase db push`.

3. **Authentication → Providers**
   - **Email**: habilitado (e-mail + senha).
   - **Google**: habilite e informe `Client ID` / `Client Secret` do Google
     Cloud. Em _Authorized redirect URIs_ do Google adicione:
     `https://<SEU-PROJETO>.supabase.co/auth/v1/callback`.

4. **Authentication → URL Configuration**
   - _Site URL_: a URL de produção da Vercel (ex.: `https://nexus.vercel.app`).
   - _Redirect URLs_: adicione a URL de produção e `http://localhost:5173`.

5. **Sessão persistente (30 dias):** em **Authentication → Sessions** ajuste o
   _inactivity timeout_ conforme sua política (ex.: 30 dias). O cliente já
   persiste a sessão e renova o token automaticamente; sem sessão, o app
   redireciona para `/login`.

---

## 🤖 Configurando a IA (Anthropic)

A aplicação chama a IA por meio da **função serverless** `api/ia.js`, mantendo a
chave **somente no servidor** (forma segura, recomendada):

- Resumo diário (Home): `claude-haiku-4-5-20251001`, `max_tokens: 1000`.
- Chat livre (drawer ∞): `claude-opus-4-8` com _extended thinking_
  (`budget_tokens: 8000`).

Defina na Vercel (e/ou no `.env` local) a variável **sem** prefixo `VITE_`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

> ⚠️ **Segurança:** existe um _fallback_ opcional `VITE_ANTHROPIC_API_KEY` que
> chama a API direto do browser (`dangerouslyAllowBrowser`). Ele **expõe a chave
> publicamente** e deve ser usado **apenas em desenvolvimento local**. Em
> produção, use somente `ANTHROPIC_API_KEY` na função serverless.

Sem chave configurada, o app funciona normalmente — apenas o resumo e o chat
exibem uma mensagem indicando que a IA não está configurada.

---

## ▲ Deploy na Vercel

1. **Importar o repositório** em <https://vercel.com/new>.
   A Vercel detecta o Vite automaticamente (`vercel.json` já define
   `build`, `outputDirectory: dist` e os _rewrites_ de SPA + `/api`).

2. **Environment Variables** (Project → Settings → Environment Variables):

   | Variável | Valor | Ambiente |
   |---|---|---|
   | `VITE_SUPABASE_URL` | `https://gxgtrbsqojhdmulrvpro.supabase.co` | Production/Preview |
   | `VITE_SUPABASE_ANON_KEY` | _(anon key do projeto)_ | Production/Preview |
   | `ANTHROPIC_API_KEY` | _(sua chave da Anthropic)_ | Production/Preview |

   > Não defina `VITE_ANTHROPIC_API_KEY` em produção.

3. **Deploy.** A função `api/ia.js` é publicada automaticamente como Serverless
   Function em `/api/ia`.

4. Após o primeiro deploy, copie a URL de produção e atualize as
   **Redirect URLs / Site URL** no Supabase (passo 4 acima).

5. CLI (opcional):
   ```bash
   npm i -g vercel
   vercel            # preview
   vercel --prod     # produção
   ```

---

## 🧩 Módulos

- **Home** — saudação, resumo diário da IA, 3 saldos (Conta/VR/Casamento),
  pendências e linha do tempo dos próximos eventos.
- **Saúde** — abas Hoje (resumo nutricional, refeições detalhadas, treino e
  suplementação), Treino (progressão de carga), Dieta (plano semanal),
  Peso (gráfico + projeção) e Compras (lista automática semanal).
- **Financeiro** — Dashboard, Calendário com saldo projetado em cascata,
  Gastos (com tetos por categoria), Cartão (virada dia 11, vencimento 17),
  VR (transferência com taxa) e Casamento (contagem + fornecedores).
- **Investimentos** — patrimônio total, reserva/casamento/FIIs, fases de aporte,
  projeção patrimonial por CDI, marcos, histórico de aportes e proventos.
- **NEXUS IA** — drawer lateral (botão ∞) com chat contextual; alertas
  automáticos são regras determinísticas (não LLM).

---

## 🎨 Identidade visual

- Tipografia: **Syne** (display), **Space Grotesk** (labels), **DM Sans**
  (corpo), **JetBrains Mono** (valores).
- Tema automático: claro 07h–19h, escuro 19h–07h (alternável manualmente na Home).
- CSS 100% customizado — **sem** bibliotecas de componentes.

---

## 📝 Notas

- Todas as tabelas têm RLS; cada usuário só enxerga os próprios dados.
- Feriados de dias úteis consideram nacionais + móveis + municipais de Ipatinga
  (aniversário em 29/04 e Corpus Christi).
- Datas/valores formatados em pt-BR (`Intl`).
