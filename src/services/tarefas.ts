import { modoDemo, obterSupabase } from '../lib/supabase'
export type ColaboradorTarefa = { id: string; nome: string; papel: 'admin' | 'editor' | 'leitor' | 'opec' | 'producao' }
export async function listarColaboradoresTarefas(): Promise<ColaboradorTarefa[]> {
  if (modoDemo) return []
  const { data, error } = await obterSupabase().rpc('listar_colaboradores_tarefas')
  if (error) throw error
  return (data ?? []) as ColaboradorTarefa[]
}
export type EtapaTarefa = 'backlog' | 'andamento' | 'revisao' | 'aprovado'
export type Tarefa = { id: string; titulo: string; programa: string; responsavel: string; responsavel_id?: string | null; prazo: string | null; etapa: EtapaTarefa }
const demo: Tarefa[] = [{ id: 'demo-1', titulo: 'Chamada institucional — 30s', programa: 'SCC Meio-Dia', responsavel: 'Equipe de produção', prazo: null, etapa: 'backlog' }]
export async function listarTarefas(): Promise<Tarefa[]> {
  if (modoDemo) return [...demo]
  const { data, error } = await obterSupabase().from('tarefas_producao').select('id,titulo,programa,responsavel,responsavel_id,prazo,etapa').order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []) as Tarefa[]
}
export async function criarTarefa(entrada: { titulo: string; programa: string; responsavel: string; responsavel_id: string | null; prazo: string | null }): Promise<Tarefa> {
  if (modoDemo) return { id: crypto.randomUUID(), ...entrada, etapa: 'backlog' }
  const { data, error } = await obterSupabase().from('tarefas_producao').insert(entrada).select('id,titulo,programa,responsavel,prazo,etapa').single()
  if (error) throw error
  return data as Tarefa
}
export async function atualizarEtapa(id: string, etapa: EtapaTarefa): Promise<void> {
  if (modoDemo) return
  const { data, error } = await obterSupabase().from('tarefas_producao').update({ etapa }).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('A tarefa não foi atualizada. Verifique suas permissões.')
}
export async function excluirTarefa(id: string): Promise<void> {
  if (modoDemo) return
  const { data, error } = await obterSupabase().from('tarefas_producao').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('A exclusão não foi autorizada.')
}
