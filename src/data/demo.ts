import type { Material, Secao } from '../types/materiais'

// Estes registros são 100% fictícios. Nunca são enviados automaticamente ao Supabase.
export const demoSecoes: Secao[] = [
  { id: 'demo-meio', nome: 'SCC MEIO-DIA' },
  { id: 'demo-news', nome: 'SCC NEWS' },
]
export const demoMateriais: Material[] = [
  { id:'demo-1', secao_id:'demo-meio', codigo:'0001', titulo:'CH SCC MEIO DIA ESPECIAL', duracao_segundos:15, status_grade:'em_utilizacao', status_producao:'em_dia', link_externo:null, observacoes:null },
  { id:'demo-2', secao_id:'demo-meio', codigo:'0002', titulo:'CH SCC MEIO DIA INSTITUCIONAL', duracao_segundos:45, status_grade:'em_utilizacao', status_producao:'precisa_atualizar', link_externo:null, observacoes:null },
  { id:'demo-3', secao_id:'demo-news', codigo:'0001', titulo:'CH SCC NEWS ESPECIAL', duracao_segundos:15, status_grade:'em_utilizacao', status_producao:'em_dia', link_externo:null, observacoes:null },
  { id:'demo-4', secao_id:'demo-news', codigo:'0002', titulo:'CH SCC NEWS INSTITUCIONAL', duracao_segundos:45, status_grade:'em_utilizacao', status_producao:'precisa_atualizar', link_externo:null, observacoes:null },
]
