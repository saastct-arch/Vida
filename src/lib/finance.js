// ════════════════════════════════════════════════════════════════════
// NEXUS · Motor financeiro
// Geração de eventos recorrentes do mês, projeção de saldo em cascata e
// projeção patrimonial dos investimentos (baseada no CDI).
// ════════════════════════════════════════════════════════════════════

import {
  nthDiaUtil, ultimoDiaUtil, diasUteisDoMes, qtdDiasUteis, semanaDoMes,
} from './dates.js'
import { toISODate } from './format.js'
import {
  SALARIO, DIZIMO, CONTAS_FIXAS, CARTAO, VR, APORTES,
  INVEST_INICIAL, INVEST_METAS, RENDIMENTO_FIIS_AA,
  aporteCasamentoNaData, listaComprasSemana, INICIO_OPERACIONAL,
} from './constants.js'

// Tipos de evento: 'entrada' (verde), 'saida' (vermelho), 'vencimento' (âmbar), 'aporte' (violeta)
function ev(data, descricao, valor, { origem = 'Conta', tipo, auto = false, modulo = 'financeiro' } = {}) {
  return {
    data: toISODate(data),
    descricao,
    valor, // sinalizado (+entrada / -saida)
    origem,
    tipo: tipo || (valor >= 0 ? 'entrada' : 'saida'),
    auto,
    modulo,
  }
}

// ───────── Eventos recorrentes (pré-cadastrados) de um mês ─────────
// ano completo (ex.: 2026), mes 0-11.
export function eventosFixosDoMes(ano, mes) {
  const eventos = []
  const diaSalario = nthDiaUtil(ano, mes, 5) // 5º dia útil
  const primeiroUtil = nthDiaUtil(ano, mes, 1) // 1º dia útil

  // Salário + Dízimo no 5º dia útil
  if (diaSalario) {
    eventos.push(ev(diaSalario, 'Salário', +SALARIO, { tipo: 'entrada' }))
    eventos.push(ev(diaSalario, 'Dízimo', -DIZIMO, { tipo: 'saida' }))
  }

  // Contas fixas (dia fixo do mês)
  for (const c of CONTAS_FIXAS) {
    const d = new Date(ano, mes, c.dia)
    eventos.push(
      ev(d, c.nome, -c.valor, {
        origem: c.origem,
        tipo: 'saida',
        auto: c.tipo === 'automatico',
      })
    )
  }

  // Vencimento da fatura do cartão (dia 17)
  eventos.push(
    ev(new Date(ano, mes, CARTAO.vencimentoDia), 'Vencimento fatura Itaú', 0, {
      tipo: 'vencimento', origem: 'Cartão',
    })
  )

  // Aportes no 1º dia útil
  if (primeiroUtil) {
    const isoPrimeiro = toISODate(primeiroUtil)
    eventos.push(ev(primeiroUtil, 'Aporte reserva', -APORTES.reserva, { tipo: 'aporte', modulo: 'investimentos' }))
    eventos.push(ev(primeiroUtil, 'Aporte casamento', -aporteCasamentoNaData(isoPrimeiro), { tipo: 'aporte', modulo: 'investimentos' }))
    eventos.push(ev(primeiroUtil, 'Aporte FIIs', -APORTES.fiis, { tipo: 'aporte', modulo: 'investimentos' }))
  }

  // Compras nas segundas-feiras (semanas 1/3 R$176 · semanas 2/4 R$158)
  const d = new Date(ano, mes, 1)
  while (d.getMonth() === mes) {
    if (d.getDay() === 1) { // segunda-feira
      const semana = semanaDoMes(d)
      const { total } = listaComprasSemana(semana)
      eventos.push(ev(new Date(d), `Compras (semana ${semana})`, -total, { tipo: 'saida', modulo: 'saude' }))
    }
    d.setDate(d.getDate() + 1)
  }

  return eventos.sort((a, b) => a.data.localeCompare(b.data))
}

// ───────── VR do mês ─────────
export function vrDoMes(ano, mes) {
  const dias = qtdDiasUteis(ano, mes)
  return {
    diasUteis: dias,
    total: dias * VR.porDiaUtil,
    zeraEm: toISODate(ultimoDiaUtil(ano, mes)),
  }
}

// ───────── Projeção de saldo em cascata ─────────
// Aplica os eventos de Conta dia a dia a partir de um saldo inicial.
// Eventos de cartão são debitados juntos no dia do vencimento (estimativa).
export function projetarSaldoMes(saldoInicial, ano, mes, eventosExtras = []) {
  const eventos = [...eventosFixosDoMes(ano, mes), ...eventosExtras]
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()

  // total do cartão (eventos com origem Cartão) — debitado no vencimento
  const totalCartao = eventos
    .filter((e) => e.origem === 'Cartão' && e.tipo !== 'vencimento')
    .reduce((s, e) => s + Math.abs(e.valor), 0)

  const porDia = {}
  for (const e of eventos) {
    if (e.origem !== 'Conta') continue
    const dia = Number(e.data.slice(8, 10))
    porDia[dia] = (porDia[dia] || 0) + e.valor
  }
  // débito da fatura no dia do vencimento
  porDia[CARTAO.vencimentoDia] = (porDia[CARTAO.vencimentoDia] || 0) - totalCartao

  const serie = []
  let saldo = Number(saldoInicial) || 0
  for (let dia = 1; dia <= ultimoDia; dia++) {
    saldo += porDia[dia] || 0
    serie.push({
      dia,
      data: `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
      delta: porDia[dia] || 0,
      saldo: +saldo.toFixed(2),
    })
  }
  return serie
}

// Classe de cor do saldo projetado.
export function corSaldo(saldo) {
  if (saldo >= 500) return 'green'
  if (saldo >= 200) return 'amber'
  return 'red'
}

// ───────── Próximos eventos (timeline da Home) ─────────
export function proximosEventos(hojeISO, n = 6) {
  const hoje = new Date(hojeISO + 'T00:00:00')
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const todos = [
    ...eventosFixosDoMes(ano, mes),
    ...eventosFixosDoMes(mes === 11 ? ano + 1 : ano, (mes + 1) % 12),
  ]
  return todos
    .filter((e) => e.data >= hojeISO)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, n)
}

// ════════════════════════════════════════════════════════════════════
// Projeção patrimonial (investimentos) baseada no CDI.
// ════════════════════════════════════════════════════════════════════

// Taxa mensal equivalente a partir de uma taxa anual.
function mensal(taxaAnual) {
  return Math.pow(1 + taxaAnual, 1 / 12) - 1
}

// Gera a série mensal projetada do início operacional até jun/2028.
// Retorna [{ mesISO, label, reserva, casamento, fiis, total, projecao:true }]
export function serieProjecao({ cdi = 0.1225, dataCasamento = '2028-06-01' } = {}) {
  const taxaReserva = mensal(cdi * 1.0) // CDB 100% CDI
  const taxaCasamento = mensal(cdi * 1.04) // LCI/LCA 104% CDI
  const taxaFiis = mensal(RENDIMENTO_FIIS_AA) // 12% a.a.

  let reserva = INVEST_INICIAL.reserva_emergencia
  let casamento = INVEST_INICIAL.fundo_casamento
  let fiis = INVEST_INICIAL.fiis

  const serie = []
  const start = new Date(INICIO_OPERACIONAL + 'T00:00:00')
  const fim = new Date((dataCasamento || '2028-06-01') + 'T00:00:00')

  const cursor = new Date(start)
  let reservaAtingida = false

  while (cursor <= fim) {
    const iso = toISODate(cursor)

    // Aporte do 1º dia útil do mês (reserva para de aportar quando atinge a meta)
    if (!reservaAtingida && reserva < INVEST_METAS.reserva_emergencia) {
      reserva += APORTES.reserva
      if (reserva >= INVEST_METAS.reserva_emergencia) reservaAtingida = true
    }
    casamento += aporteCasamentoNaData(iso)
    fiis += APORTES.fiis

    // Rendimentos do mês
    reserva *= 1 + taxaReserva
    casamento *= 1 + taxaCasamento
    fiis *= 1 + taxaFiis

    serie.push({
      mesISO: iso,
      label: `${String(cursor.getMonth() + 1).padStart(2, '0')}/${String(cursor.getFullYear()).slice(2)}`,
      reserva: +reserva.toFixed(2),
      casamento: +casamento.toFixed(2),
      fiis: +fiis.toFixed(2),
      total: +(reserva + casamento + fiis).toFixed(2),
      projecao: true,
    })

    cursor.setMonth(cursor.getMonth() + 1)
  }
  return serie
}

// Projeção linear de peso a partir dos últimos registros (mínimos quadrados).
// registros: [{ data, peso_kg }] ordenados por data asc.
export function projetarPeso(registros, semanasAFrente = 8) {
  if (!registros || registros.length < 2) return null
  const ult = registros.slice(-4) // últimos 4 registros
  const x0 = new Date(ult[0].data + 'T00:00:00').getTime()
  const pts = ult.map((r) => ({
    x: (new Date(r.data + 'T00:00:00').getTime() - x0) / (7 * 86400000), // semanas
    y: Number(r.peso_kg),
  }))
  const n = pts.length
  const sx = pts.reduce((s, p) => s + p.x, 0)
  const sy = pts.reduce((s, p) => s + p.y, 0)
  const sxy = pts.reduce((s, p) => s + p.x * p.y, 0)
  const sxx = pts.reduce((s, p) => s + p.x * p.x, 0)
  const denom = n * sxx - sx * sx
  if (denom === 0) return null
  const slope = (n * sxy - sx * sy) / denom // kg por semana
  const intercept = (sy - slope * sx) / n
  const ultimaSemana = pts[n - 1].x
  return {
    slopeSemana: +slope.toFixed(3), // negativo = perdendo peso
    projecao: Array.from({ length: semanasAFrente }, (_, i) => ({
      semana: i + 1,
      peso: +(intercept + slope * (ultimaSemana + i + 1)).toFixed(2),
    })),
  }
}
