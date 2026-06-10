// ════════════════════════════════════════════════════════════════════
// Utilidades de datas: feriados (nacionais + Ipatinga-MG) e dias úteis.
// Usado para cálculo de salário (5º dia útil), aportes (1º dia útil),
// VR (dias úteis × R$25) e zeramento do VR (último dia útil).
// ════════════════════════════════════════════════════════════════════

import { toISODate } from './format.js'

// Algoritmo de Meeus/Jones/Butcher para a Páscoa (domingo).
function pascoa(ano) {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31) // 3=março, 4=abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, mes - 1, dia)
}

function addDias(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Cache de feriados por ano (Set de strings yyyy-mm-dd)
const cacheFeriados = new Map()

// Retorna um Set com os feriados (ISO) do ano informado.
// Inclui feriados nacionais, móveis e municipais de Ipatinga-MG.
export function feriadosDoAno(ano) {
  if (cacheFeriados.has(ano)) return cacheFeriados.get(ano)

  const dom = pascoa(ano)
  const set = new Set([
    // Nacionais fixos
    `${ano}-01-01`, // Confraternização Universal
    `${ano}-04-21`, // Tiradentes
    `${ano}-05-01`, // Dia do Trabalho
    `${ano}-09-07`, // Independência
    `${ano}-10-12`, // Nossa Senhora Aparecida
    `${ano}-11-02`, // Finados
    `${ano}-11-15`, // Proclamação da República
    `${ano}-11-20`, // Consciência Negra (nacional desde 2024)
    `${ano}-12-25`, // Natal
    // Municipais de Ipatinga-MG
    `${ano}-04-29`, // Aniversário de Ipatinga
    // Móveis (baseados na Páscoa)
    toISODate(addDias(dom, -48)), // Segunda de Carnaval
    toISODate(addDias(dom, -47)), // Terça de Carnaval
    toISODate(addDias(dom, -2)), // Sexta-feira Santa
    toISODate(addDias(dom, 60)), // Corpus Christi
  ])

  cacheFeriados.set(ano, set)
  return set
}

// É feriado? (recebe Date ou ISO)
export function ehFeriado(date) {
  const d = date instanceof Date ? date : new Date(date + 'T00:00:00')
  return feriadosDoAno(d.getFullYear()).has(toISODate(d))
}

// É dia útil? (seg–sex e não feriado)
export function ehDiaUtil(date) {
  const d = date instanceof Date ? date : new Date(date + 'T00:00:00')
  const dow = d.getDay()
  if (dow === 0 || dow === 6) return false
  return !ehFeriado(d)
}

// Lista de dias úteis (Date[]) de um mês (mes 0-11).
export function diasUteisDoMes(ano, mes) {
  const out = []
  const d = new Date(ano, mes, 1)
  while (d.getMonth() === mes) {
    if (ehDiaUtil(d)) out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

// Quantidade de dias úteis no mês (base do VR).
export function qtdDiasUteis(ano, mes) {
  return diasUteisDoMes(ano, mes).length
}

// n-ésimo dia útil do mês (n começa em 1). Ex.: salário no 5º dia útil.
export function nthDiaUtil(ano, mes, n) {
  const dias = diasUteisDoMes(ano, mes)
  return dias[Math.min(n, dias.length) - 1] ?? null
}

// Último dia útil do mês (VR zera neste dia).
export function ultimoDiaUtil(ano, mes) {
  const dias = diasUteisDoMes(ano, mes)
  return dias[dias.length - 1] ?? null
}

// Próximo dia útil a partir de uma data (inclusive).
export function proximoDiaUtil(date) {
  const d = new Date(date)
  while (!ehDiaUtil(d)) d.setDate(d.getDate() + 1)
  return d
}

// Qual a "semana do mês" (1..5) para uma data — usado nas listas de compras.
export function semanaDoMes(date) {
  const d = date instanceof Date ? date : new Date(date + 'T00:00:00')
  return Math.ceil(d.getDate() / 7)
}

// Diferença em dias inteiros entre duas datas (b - a).
export function diffDias(a, b) {
  const da = a instanceof Date ? a : new Date(a + 'T00:00:00')
  const db = b instanceof Date ? b : new Date(b + 'T00:00:00')
  return Math.round((db - da) / 86400000)
}

// Diferença em meses (aproximada, fracionária) entre duas datas.
export function diffMeses(a, b) {
  const da = a instanceof Date ? a : new Date(a + 'T00:00:00')
  const db = b instanceof Date ? b : new Date(b + 'T00:00:00')
  return (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth()) + (db.getDate() - da.getDate()) / 30
}
