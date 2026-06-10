// Funções de formatação pt-BR (moeda, número, percentual, datas).

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const num0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const num2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// R$ 1.234,56
export function money(v) {
  const n = Number(v) || 0
  return brl.format(n)
}

// Versão compacta sem o símbolo (para valores monoespaçados em destaque)
export function moneyShort(v) {
  const n = Number(v) || 0
  return 'R$ ' + num2.format(n)
}

export function number(v, dec = 0) {
  const n = Number(v) || 0
  if (dec === 1) return num1.format(n)
  if (dec === 2) return num2.format(n)
  return num0.format(n)
}

// 12,25%  (recebe fração 0.1225 ou número 12.25 com base no flag)
export function percent(v, { fromFraction = false, dec = 2 } = {}) {
  const n = (Number(v) || 0) * (fromFraction ? 100 : 1)
  const fmt = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })
  return fmt.format(n) + '%'
}

// Data ISO (yyyy-mm-dd) -> 10/06/2026
export function dataBR(iso) {
  if (!iso) return ''
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

// Date -> yyyy-mm-dd (sem fuso, usando data local)
export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export function nomeDiaSemana(date) {
  const d = date instanceof Date ? date : new Date(date + 'T00:00:00')
  return DIAS[d.getDay()]
}

export function nomeMes(i) {
  return MESES[i]
}

// 10 de junho de 2026
export function dataExtenso(date) {
  const d = date instanceof Date ? date : new Date(date + 'T00:00:00')
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}
