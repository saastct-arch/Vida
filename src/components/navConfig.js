import { Home, Heart, Wallet, LineChart } from 'lucide-react'

// Itens de navegação compartilhados entre a sidebar (desktop) e a barra inferior (mobile).
// `cor` define o acento do item ativo por módulo.
export const NAV_ITENS = [
  { to: '/home', label: 'Home', Icon: Home, cor: 'blue' },
  { to: '/saude', label: 'Saúde', Icon: Heart, cor: 'green' },
  { to: '/financeiro', label: 'Financeiro', Icon: Wallet, cor: 'blue' },
  { to: '/investimentos', label: 'Investir', Icon: LineChart, cor: 'violet' },
]
