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
  { key: 'cafe', nome: 'Café da manhã', horario: '05:05–05:15', local: 'casa', obrigatoria: true },
  { key: 'lanche_manha', nome: 'Lanche da manhã', horario: '~10:00', local: 'trabalho', obrigatoria: false },
  { key: 'almoco', nome: 'Almoço', horario: '12:00–12:40', local: 'marmita', obrigatoria: true },
  { key: 'lanche_tarde', nome: 'Lanche da tarde · pré-treino', horario: '16:30', local: 'trabalho', obrigatoria: false },
  { key: 'jantar', nome: 'Jantar', horario: '23:40–23:55', local: 'casa', obrigatoria: true, nota: 'Priorizar proteína + legumes, reduzir carboidrato (refeição tardia).' },
]

// Metas nutricionais diárias (referência para as barras de progresso) — base 2.200 kcal.
export const METAS_NUTRI = {
  calorias: 2200,
  proteinas_g: 186, // 2 g/kg = 744 kcal
  carboidratos_g: 227, // restante = 908 kcal
  gorduras_totais_g: 61, // 25% das calorias = 549 kcal
}

// Dados calóricos base (perfil: M, 20 anos, 175 cm, atividade leve).
export const NUTRI_BASE = {
  idade: 20,
  altura: 175,
  atividade: 'leve (×1,375)',
  objetivo: 'perda de peso + ganho de massa muscular',
  tmb: 1990, // Mifflin-St Jeor
  tdee: 2735,
  deficit: 500,
  metaPadrao: 2200, // seg–sex
  metaSabado: 2400, // futsal — reposição
  metaDomingo: 2000, // descanso, carbo reduzido
  proteinaG: 186, proteinaKcal: 744,
  gorduraG: 61, gorduraKcal: 549,
  carboidratoG: 227, carboidratoKcal: 908,
}

// Meta calórica do dia (sábado reposição, domingo descanso, demais padrão).
export function metaCaloricaDia(date) {
  const dow = (date instanceof Date ? date : new Date(date + 'T00:00:00')).getDay()
  if (dow === 0) return NUTRI_BASE.metaDomingo
  if (dow === 6) return NUTRI_BASE.metaSabado
  return NUTRI_BASE.metaPadrao
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
  whey: {
    nome: 'Whey protein', preco: 110, doseG: 30, embalagemG: 900,
    dosesEmbalagem: 30, duracao: '~1 mês', alertaDoses: 7,
    uso: 'Pré-treino (16:30) seg–sex + pós-futsal no sábado',
  },
  creatina: {
    nome: 'Creatina monohidratada', preco: 30, doseG: '3–5', embalagemG: 300,
    dosesEmbalagem: 100, duracao: '~2 meses', alertaDias: 14,
    uso: 'Diária, em água ou no whey (qualquer horário)',
  },
}

// ───────── Plano de dieta semanal (somente leitura, editável via IA) ─────────
// Estrutura: dia -> { treino, meta, refeicoes: { nome: [itens] }, obs? }
export const PLANO_DIETA = {
  Segunda: {
    treino: 'Peito + Tríceps',
    refeicoes: {
      'Café da manhã': ['3 ovos mexidos', '2 fatias de pão integral', '1 banana', 'Café sem açúcar'],
      'Lanche da manhã': ['200 g de iogurte natural desnatado', '1 col. de sopa de granola sem açúcar'],
      Almoço: ['150 g de coxa/sobrecoxa de frango grelhada sem pele', '4 col. de sopa de arroz branco', '1 concha de feijão carioca', 'Salada verde à vontade com limão'],
      'Lanche da tarde · pré-treino': ['1 batata-doce média cozida (150 g)', '30 g de whey protein com água'],
      Jantar: ['150 g de tilápia ou sardinha grelhada', '2 xícaras de brócolis e cenoura no vapor', '1 col. de sopa de azeite'],
    },
  },
  Terça: {
    treino: 'Costas + Bíceps',
    refeicoes: {
      'Café da manhã': ['Omelete de 3 ovos com espinafre e tomate', '1 fatia de pão integral', '1 laranja'],
      'Lanche da manhã': ['30 g de amendoim torrado sem sal', '1 maçã'],
      Almoço: ['150 g de coxa/sobrecoxa de frango cozida desfiada', '4 col. de sopa de arroz branco', 'Salada de repolho e cenoura ralada'],
      'Lanche da tarde · pré-treino': ['1 banana', '30 g de whey protein com água'],
      Jantar: ['150 g de frango desfiado', 'Abobrinha e berinjela grelhadas', '1 col. de sopa de azeite'],
    },
  },
  Quarta: {
    treino: 'Pernas',
    refeicoes: {
      'Café da manhã': ['200 g de iogurte natural desnatado', '40 g de aveia em flocos', '1 col. de chá de mel', '1 kiwi ou fruta da estação'],
      'Lanche da manhã': ['2 ovos cozidos'],
      Almoço: ['150 g de frango grelhado', '1 batata-doce média assada (150 g)', '1 concha de feijão', 'Salada verde'],
      'Lanche da tarde · pré-treino': ['40 g de aveia com água e cacau em pó', '1 banana'],
      Jantar: ['2 latas de atum em água escorrido (~170 g)', 'Vagem ou aspargos refogados', '1 col. de sopa de azeite'],
    },
  },
  Quinta: {
    treino: 'Ombro + Trapézio + Core',
    refeicoes: {
      'Café da manhã': ['3 ovos mexidos', '1 tapioca média (30 g) com queijo cottage', '1 fruta da estação'],
      'Lanche da manhã': ['30 g de amendoim torrado', '1 pera ou maçã'],
      Almoço: ['150 g de frango grelhado', '4 col. de sopa de arroz branco', '1 concha de lentilha ou feijão', 'Salada variada'],
      'Lanche da tarde · pré-treino': ['30 g de whey protein com água', '1 banana'],
      Jantar: ['Omelete de 4 claras + 1 ovo inteiro', 'Pimentão e espinafre refogados', 'Salada de rúcula'],
    },
  },
  Sexta: {
    treino: 'Peito + Costas',
    refeicoes: {
      'Café da manhã': ['2 fatias de pão integral', '2 col. de sopa de amendoim torrado', '1 banana', 'Café sem açúcar'],
      'Lanche da manhã': ['200 g de iogurte natural desnatado', '20 g de granola sem açúcar'],
      Almoço: ['150 g de frango grelhado', '150 g de batata-doce cozida', 'Salada variada'],
      'Lanche da tarde · pré-treino': ['1 batata-doce pequena (100 g)', '30 g de whey protein com água'],
      Jantar: ['2 latas de atum em água (~170 g)', 'Brócolis no vapor', 'Salada', '1 col. de sopa de azeite'],
    },
  },
  Sábado: {
    treino: 'Futsal · 08:00',
    obs: 'Almoço e jantar fora de casa — proteína grelhada, arroz, feijão, salada. Porção maior p/ repor glicogênio; evitar frituras e refrigerante.',
    refeicoes: {
      'Café da manhã (06:15 · pré-jogo)': ['3 ovos mexidos', '40 g de aveia com banana amassada', 'Café sem açúcar'],
      'Durante o jogo': ['Água ou água de coco natural'],
      'Pós-jogo (até 60 min)': ['30 g de whey protein com água', '1 fruta'],
      'Almoço (fora de casa)': ['Proteína grelhada + arroz + feijão + salada', 'Porção ligeiramente maior'],
      'Jantar (fora de casa)': ['Proteína magra + salada', 'Evitar frituras e refrigerante'],
    },
  },
  Domingo: {
    treino: 'Descanso',
    meta: 2000,
    obs: 'Alimentação 100% fora de casa · carboidratos reduzidos (~2.000 kcal).',
    refeicoes: {
      'Café da manhã': ['3 ovos (qualquer preparo)', '2 fatias de pão ou 1 tapioca pequena', '1 fruta', 'Café sem açúcar'],
      'Lanche da manhã': ['1 fruta média', 'Punhado de amendoim (~30 g) ou 1 iogurte natural'],
      Almoço: ['~150 g de proteína magra grelhada/assada', '3 col. de sopa de arroz + 1 concha de feijão', 'Salada à vontade', 'Evitar frituras, farofa e refrigerante'],
      'Lanche da tarde': ['1 fruta + 1 iogurte natural', 'ou 1 vitamina de fruta sem açúcar'],
      Jantar: ['Sopa de legumes com frango desfiado', 'ou 130 g de proteína magra + salada + 2 col. de arroz'],
    },
  },
}

// Lookup do plano por data (getDay → nome do dia).
const DIAS_PLANO = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export function planoDoDia(date) {
  const d = date instanceof Date ? date : new Date(date + 'T00:00:00')
  return PLANO_DIETA[DIAS_PLANO[d.getDay()]] || null
}
// Itens sugeridos para uma refeição específica do dia (ou null).
export function sugestaoRefeicao(date, nome) {
  const plano = planoDoDia(date)
  if (!plano) return null
  return plano.refeicoes?.[nome] || null
}

// ───────── Meal prep (sábado 10:30–13:30) ─────────
export const MEAL_PREP = {
  janela: 'Sábado · 10:30–13:30',
  itens: [
    'Frango cozido/grelhado em lote (2,5 kg)',
    'Batata-doce cozida e porcionada (1,5 kg)',
    'Feijão ou lentilha cozidos',
    'Ovos cozidos (descascar na hora)',
    'Legumes branqueados (brócolis, cenoura, abobrinha)',
  ],
  organizacao: [
    '5 marmitas de almoço (seg–sex)',
    '5 marmitas de jantar (seg–sex)',
    'Etiquetar com o dia da semana',
  ],
}

// ───────── Regras de ajuste automático (apenas alertam; usuário decide) ─────────
export const REAJUSTE_DIETA = [
  'Peso registrado toda segunda de manhã (em jejum).',
  'Queda de 0,5–1 kg/semana → manter o plano atual.',
  'Estagnação por 2 semanas → cortar 150–200 kcal dos carboidratos.',
  'Queda acima de 1,5 kg/semana → aumentar 150–200 kcal (preservar massa).',
  'A cada 5 kg perdidos → recalcular TMB, TDEE e macros com o novo peso.',
  'A cada 4 semanas → relatório de evolução com sugestão de ajuste.',
  'Nunca alterar automaticamente — apenas alertar e sugerir.',
]

// ───────── Lista de compras semanal (seg–sex + manhã do sábado) ─────────
// Itens já existentes em casa (excluídos): azeite, arroz.
// Semanas 1 e 3: COM granola (+R$18) → total R$176
// Semanas 2 e 4: SEM granola → total R$158
export const COMPRAS_BASE = [
  { item: 'Coxa/sobrecoxa de frango (2,5 kg)', valor: 27.5 },
  { item: 'Ovos (bandeja 30 un)', valor: 30 },
  { item: 'Atum em lata 170 g (4 latas)', valor: 26 },
  { item: 'Sardinha em lata 125 g (2 latas)', valor: 8 },
  { item: 'Feijão carioca (0,5 kg)', valor: 4 },
  { item: 'Batata-doce (1,5 kg)', valor: 10.5 },
  { item: 'Aveia em flocos 500 g', valor: 9 },
  { item: 'Pão integral 500 g', valor: 9 },
  { item: 'Iogurte natural desnatado (2 potes 500 g)', valor: 8 },
  { item: 'Banana (1,5 kg)', valor: 6 },
  { item: 'Frutas da estação (1 kg)', valor: 6 },
  { item: 'Legumes e verduras variados (1,5 kg)', valor: 6 },
  { item: 'Amendoim torrado a granel 500 g', valor: 8 },
]
export const COMPRAS_GRANOLA = { item: 'Granola sem açúcar 400 g', valor: 18 }
export const COMPRAS_TOTAL_COM = 176
export const COMPRAS_TOTAL_SEM = 158
// Custos mensais de referência
export const CUSTO_MENSAL = { alimentacao: 668, suplementacao: 140, total: 808 }

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
