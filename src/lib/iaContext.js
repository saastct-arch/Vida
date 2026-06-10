// Coleta um snapshot compacto dos dados do usuário para injetar como
// contexto da IA (chat livre e resumo diário).

import { supabase } from './supabase.js'
import { toISODate } from './format.js'
import {
  PERFIL, PESO_INICIAL, PESO_META, INVEST_INICIAL, INVEST_METAS,
} from './constants.js'
import { eventosFixosDoMes, vrDoMes } from './finance.js'

export async function coletarContexto(userId) {
  const hoje = new Date()
  const hojeISO = toISODate(hoje)
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()

  // Busca paralela das tabelas relevantes (recentes)
  const [peso, refeicoes, treino, gastos, entradas, aportes, fornecedores, config] = await Promise.all([
    supabase.from('peso_registros').select('data,peso_kg').eq('user_id', userId).order('data', { ascending: false }).limit(8),
    supabase.from('refeicoes_registros').select('refeicao,concluida,calorias,proteinas_g').eq('user_id', userId).eq('data', hojeISO),
    supabase.from('treino_registros').select('data,dia_semana,concluido,sem_treino').eq('user_id', userId).order('data', { ascending: false }).limit(5),
    supabase.from('gastos').select('data,valor,categoria,origem').eq('user_id', userId).gte('data', `${ano}-${String(mes + 1).padStart(2, '0')}-01`),
    supabase.from('entradas').select('data,valor,tipo,destino').eq('user_id', userId).gte('data', `${ano}-${String(mes + 1).padStart(2, '0')}-01`),
    supabase.from('investimentos_aportes').select('data,destino,valor').eq('user_id', userId).order('data', { ascending: false }).limit(6),
    supabase.from('fornecedores_casamento').select('nome,servico,valor_total,valor_pago,status,data_vencimento').eq('user_id', userId),
    supabase.from('configuracoes').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const eventos = eventosFixosDoMes(ano, mes)
  const vr = vrDoMes(ano, mes)
  const proximos = eventos.filter((e) => e.data >= hojeISO).slice(0, 5)

  const gastosMes = (gastos.data || []).reduce((s, g) => s + Number(g.valor), 0)
  const entradasMes = (entradas.data || []).reduce((s, e) => s + Number(e.valor), 0)

  return {
    hoje: hojeISO,
    perfil: { cidade: PERFIL.cidade, pesoInicial: PESO_INICIAL, pesoMeta: PESO_META, salario: PERFIL.salarioLiquido },
    peso: {
      registros: (peso.data || []).reverse(),
      atual: peso.data?.[0]?.peso_kg ?? null,
      meta: PESO_META,
    },
    refeicoesHoje: refeicoes.data || [],
    treinosRecentes: treino.data || [],
    financeiro: {
      gastosMes: +gastosMes.toFixed(2),
      entradasMes: +entradasMes.toFixed(2),
      vr,
      proximosEventos: proximos,
    },
    investimentos: {
      inicial: INVEST_INICIAL,
      metas: INVEST_METAS,
      aportesRecentes: aportes.data || [],
    },
    casamento: {
      data: config.data?.data_casamento || '2028-06-01',
      fornecedores: fornecedores.data || [],
    },
    cdi: config.data?.cdi_atual ?? 0.1225,
  }
}
