// ════════════════════════════════════════════════════════════════════
// NEXUS · Constantes de domínio (perfil do usuário, planos, eventos fixos)
// Cidade: Ipatinga-MG · Início operacional: 01/07/2026
// ════════════════════════════════════════════════════════════════════

export const INICIO_OPERACIONAL = '2026-07-01'

// ───────── Perfil ─────────
export const PERFIL = {
  cidade: 'Ipatinga-MG',
  pesoInicial: 93,
  pesoMeta: 85,
  salarioLiquido: 4500,
  banco: 'Itaú',
  vrPorDiaUtil: 25,
}

// ───────── Saúde · Peso ─────────
export const PESO_INICIAL = 93
export const PESO_META = 85

// ───────── Refeições do dia (5) ─────────
// obrigatoria: card fica vermelho (--red) quando não preenchido.
export const REFEICOES = [
  { key: 'cafe', nome: 'Café da manhã', obrigatoria: true },
  { key: 'lanche_manha', nome: 'Lanche da manhã', obrigatoria: false },
  { key: 'almoco', nome: 'Almoço', obrigatoria: true },
  { key: 'lanche_tarde', nome: 'Lanche da tarde', obrigatoria: false },
  { key: 'jantar', nome: 'Jantar', obrigatoria: true },
]

// Metas nutricionais diárias (referência para as barras de progresso).
export const METAS_NUTRI = {
  calorias: 2200,
  proteinas_g: 165,
  carboidratos_g: 220,
  gorduras_totais_g: 60,
}

// ───────── Split semanal de treino ─────────
// Índice = getDay() (0=domingo ... 6=sábado)
export const SPLIT_SEMANAL = {
  0: { titulo: 'Descanso', grupo: 'Descanso', descanso: true, exercicios: [] },
  1: {
    titulo: 'Peito + Tríceps', grupo: 'Peito · Tríceps',
    exercicios: [
      'Supino reto com barra', 'Supino inclinado com halteres', 'Crossover',
      'Tríceps testa', 'Tríceps corda', 'Tríceps francês',
    ],
  },
  2: {
    titulo: 'Costas + Bíceps', grupo: 'Costas · Bíceps',
    exercicios: [
      'Puxada frontal', 'Remada curvada', 'Remada unilateral',
      'Rosca direta', 'Rosca alternada', 'Rosca martelo',
    ],
  },
  3: {
    titulo: 'Pernas', grupo: 'Pernas',
    exercicios: [
      'Agachamento livre', 'Leg press 45°', 'Cadeira extensora',
      'Mesa flexora', 'Cadeira adutora', 'Panturrilha em pé',
    ],
  },
  4: {
    titulo: 'Ombro + Trapézio + Core', grupo: 'Ombro · Trapézio · Core',
    exercicios: [
      'Desenvolvimento com halteres', 'Elevação lateral', 'Elevação frontal',
      'Encolhimento com halteres', 'Prancha abdominal', 'Abdominal infra',
    ],
  },
  5: {
    titulo: 'Peito + Costas', grupo: 'Peito · Costas',
    exercicios: [
      'Supino reto', 'Crucifixo máquina', 'Puxada aberta',
      'Remada baixa', 'Pullover', 'Crossover',
    ],
  },
  6: { titulo: 'Futsal', grupo: 'Futsal', futsal: true, exercicios: [] },
}

// ───────── Suplementação ─────────
export const SUPLEMENTOS = {
  whey: { nome: 'Whey protein', preco: 110, alertaDoses: 7 },
  creatina: { nome: 'Creatina', preco: 30, alertaDias: 14 },
}

// ───────── Plano de dieta semanal (somente leitura, editável via IA) ─────────
// Estrutura: dia da semana -> refeição -> descrição.
export const PLANO_DIETA = {
  Segunda: {
    'Café da manhã': '3 ovos mexidos, 2 fatias de pão integral, 1 banana, café',
    'Lanche da manhã': 'Iogurte natural + 1 scoop de whey',
    Almoço: '150g frango grelhado, arroz, feijão, brócolis, salada',
    'Lanche da tarde': '1 maçã + 30g de castanhas',
    Jantar: '150g patinho, batata doce, legumes no vapor',
  },
  Terça: {
    'Café da manhã': 'Omelete de 3 ovos, aveia com banana, café',
    'Lanche da manhã': 'Vitamina de whey com leite',
    Almoço: '150g frango, arroz integral, feijão, salada verde',
    'Lanche da tarde': 'Iogurte + granola',
    Jantar: '2 ovos, batata doce, brócolis',
  },
  Quarta: {
    'Café da manhã': 'Tapioca com ovo, café, 1 fruta',
    'Lanche da manhã': 'Whey + 1 banana',
    Almoço: '150g carne moída magra, arroz, feijão, legumes',
    'Lanche da tarde': 'Mix de castanhas',
    Jantar: 'Frango desfiado, batata doce, salada',
  },
  Quinta: {
    'Café da manhã': '3 ovos, pão integral, café, mamão',
    'Lanche da manhã': 'Iogurte + whey',
    Almoço: '150g frango grelhado, arroz, feijão, brócolis',
    'Lanche da tarde': '1 maçã + castanhas',
    Jantar: 'Tilápia grelhada, batata doce, legumes',
  },
  Sexta: {
    'Café da manhã': 'Aveia com whey e banana, café',
    'Lanche da manhã': 'Vitamina de frutas com whey',
    Almoço: '150g patinho, arroz integral, feijão, salada',
    'Lanche da tarde': 'Iogurte natural',
    Jantar: '3 ovos, batata doce, brócolis',
  },
  Sábado: {
    'Café da manhã': 'Café reforçado, ovos, pão integral, fruta',
    'Lanche da manhã': 'Whey + castanhas (pré-futsal)',
    Almoço: 'Refeição livre equilibrada + salada',
    'Lanche da tarde': 'Fruta + iogurte',
    Jantar: 'Frango, arroz, legumes',
  },
  Domingo: {
    'Café da manhã': 'Café da manhã reforçado',
    'Lanche da manhã': 'Fruta + whey',
    Almoço: 'Refeição livre (controlada)',
    'Lanche da tarde': 'Castanhas',
    Jantar: 'Refeição leve, ovos e salada',
  },
}

// ───────── Lista de compras semanal ─────────
// Semanas 1 e 3: COM granola (+R$18) → total R$176
// Semanas 2 e 4: SEM granola → total R$158
export const COMPRAS_BASE = [
  { item: 'Frango (kg)', valor: 28 },
  { item: 'Patinho / carne moída', valor: 32 },
  { item: 'Ovos (2 dúzias)', valor: 18 },
  { item: 'Arroz integral 5kg', valor: 25 },
  { item: 'Feijão 1kg', valor: 9 },
  { item: 'Batata doce', valor: 10 },
  { item: 'Banana', valor: 8 },
  { item: 'Maçã', valor: 10 },
  { item: 'Brócolis / legumes', valor: 10 },
  { item: 'Leite / iogurte', valor: 8 },
]
export const COMPRAS_GRANOLA = { item: 'Granola', valor: 18 }
export const COMPRAS_TOTAL_COM = 176
export const COMPRAS_TOTAL_SEM = 158

// Retorna a lista (e total) da semana, considerando granola nas semanas ímpares.
export function listaComprasSemana(semana) {
  const comGranola = semana % 2 === 1 // semanas 1 e 3
  const itens = comGranola ? [...COMPRAS_BASE, COMPRAS_GRANOLA] : [...COMPRAS_BASE]
  const total = comGranola ? COMPRAS_TOTAL_COM : COMPRAS_TOTAL_SEM
  return { itens, total, comGranola }
}

// ───────── Categorias de gasto ─────────
export const CATEGORIAS_GASTO = [
  'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer',
  'Vestuário', 'Religião', 'Imprevistos', 'Outros',
]
export const ORIGENS_GASTO = ['Conta', 'VR', 'Cartão']
export const TIPOS_ENTRADA = [
  'Salário', 'Proventos FIIs', 'Renda extra', 'Rendimento investimento', 'Estorno', 'Outros',
]
export const DESTINOS_ENTRADA = ['Conta', 'VR']

// ───────── Contas fixas / eventos financeiros recorrentes ─────────
export const SALARIO = 4500
export const DIZIMO = 450

export const CONTAS_FIXAS = [
  { nome: 'Consórcio', valor: 870, dia: 10, tipo: 'manual', origem: 'Conta', categoria: 'Imprevistos' },
  { nome: 'FIES', valor: 750, dia: 15, tipo: 'manual', origem: 'Conta', categoria: 'Educação' },
  { nome: 'Spotify', valor: 13, dia: 15, tipo: 'automatico', origem: 'Cartão', categoria: 'Lazer' },
  { nome: 'Vivo', valor: 65, dia: 20, tipo: 'automatico', origem: 'Cartão', categoria: 'Outros' },
]

// ───────── Cartão de crédito ─────────
export const CARTAO = {
  viradaDia: 11,
  vencimentoDia: 17,
  limite: 1000,
  alertaPercentual: 0.8, // alerta acima de 80% (R$800)
}

// ───────── VR ─────────
export const VR = {
  porDiaUtil: 25,
  taxaFixaAte100: 2.5, // ≤ R$100 → taxa fixa R$2,50
  taxaPercentualAcima: 0.025, // > R$100 → 2,5%
}

// Calcula taxa e valor líquido de uma transferência VR → Conta.
export function calcTransferenciaVR(valorBruto) {
  const v = Number(valorBruto) || 0
  const taxa = v <= 100 ? VR.taxaFixaAte100 : +(v * VR.taxaPercentualAcima).toFixed(2)
  const liquido = +(v - taxa).toFixed(2)
  return { taxa, liquido }
}

// ───────── Investimentos ─────────
export const INVEST_INICIAL = {
  reserva_emergencia: 9500,
  fundo_casamento: 4000,
  fiis: 2238.04,
}

export const INVEST_METAS = {
  reserva_emergencia: 18000,
  fundo_casamento: 35000,
}

export const APORTES = {
  reserva: 700, // /mês até reserva atingida (mar/2027)
  fiis: 451, // /mês
}

export const CDI_PADRAO = 0.1225 // 12,25% a.a.
export const RENDIMENTO_RESERVA = 1.0 // 100% CDI
export const RENDIMENTO_CASAMENTO = 1.04 // 104% CDI (LCI/LCA)
export const RENDIMENTO_FIIS_AA = 0.12 // 12% a.a.

// Fases do aporte do fundo casamento.
export const FASES_CASAMENTO = [
  { ate: '2026-11-30', valor: 900, label: 'Até nov/2026' },
  { ate: '2027-02-28', valor: 1381.55, label: 'Dez/2026–fev/2027' },
  { ate: '2028-06-30', valor: 2081.55, label: 'Mar/2027–jun/2028' },
]

// Retorna o valor do aporte do casamento para uma data (ISO ou Date).
export function aporteCasamentoNaData(date) {
  const iso = typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10)
  for (const fase of FASES_CASAMENTO) {
    if (iso <= fase.ate) return fase.valor
  }
  return FASES_CASAMENTO[FASES_CASAMENTO.length - 1].valor
}

// Marcos (apenas alertas — usuário confirma manualmente).
export const MARCOS = [
  { data: '2026-12-01', tipo: 'amber', texto: 'Parcelas CEF quitadas — +R$481,55/mês disponíveis' },
  { data: '2027-03-01', tipo: 'green', texto: 'Reserva atingida — +R$700/mês liberados' },
]

export const DATA_CASAMENTO_PADRAO = '2028-06-01'

// Destinos de aporte (mapeados para os campos de investimentos_saldos).
export const DESTINOS_APORTE = [
  { label: 'Reserva de emergência', campo: 'reserva_emergencia' },
  { label: 'Fundo casamento', campo: 'fundo_casamento' },
  { label: 'FIIs', campo: 'fiis' },
]
