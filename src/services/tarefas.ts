import { modoDemo, obterSupabase } from '../lib/supabase'
export type ColaboradorTarefa = { id: string; nome: string; papel: 'admin' | 'editor' | 'leitor' | 'opec' | 'producao' }
export async function listarColaboradoresTarefas(): Promise<ColaboradorTarefa[]> {
  if (modoDemo) return []
  const { data, error } = await obterSupabase().rpc('listar_colaboradores_tarefas')
  if (error) throw error
  return (data ?? []) as ColaboradorTarefa[]
}
export type Prioridade = 'baixa' | 'normal' | 'alta' | 'urgente'
export type EtapaTarefa = 'backlog' | 'andamento' | 'revisao' | 'aprovado'
export type Tarefa = { id: string; titulo: string; programa: string; responsavel: string; responsavel_id?: string | null; prazo: string | null; inicio?: string | null; descricao?: string; prioridade?: Prioridade; etapa: EtapaTarefa }
const demo: Tarefa[] = [{ id: 'demo-1', titulo: 'Chamada institucional — 30s', programa: 'SCC Meio-Dia', responsavel: 'Equipe de produção', prazo: null, etapa: 'backlog' }]
export async function listarTarefas(): Promise<Tarefa[]> {
  if (modoDemo) return [...demo]
  const { data, error } = await obterSupabase().from('tarefas_producao').select('id,titulo,programa,responsavel,responsavel_id,prazo,inicio,descricao,prioridade,etapa').order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []) as Tarefa[]
}
export async function criarTarefa(entrada: { titulo: string; programa: string; responsavel: string; responsavel_id: string | null; prazo: string | null; inicio?: string | null; descricao?: string; prioridade?: Prioridade }): Promise<Tarefa> {
  if (modoDemo) return { id: crypto.randomUUID(), ...entrada, etapa: 'backlog' }
  const { data, error } = await obterSupabase().from('tarefas_producao').insert(entrada).select('id,titulo,programa,responsavel,responsavel_id,prazo,inicio,descricao,prioridade,etapa').single()
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

export async function salvarDetalhes(id: string, dados: Partial<Pick<Tarefa,'titulo'|'programa'|'responsavel'|'responsavel_id'|'prazo'|'inicio'|'descricao'|'prioridade'>>) {
  if (modoDemo) return
  const { data, error } = await obterSupabase().from('tarefas_producao').update(dados).eq('id',id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Atualização não autorizada.')
}
export type Comentario = { id: string; tarefa_id: string; autor_id: string; mensagem: string; criado_em: string }
export async function listarComentarios(tarefaId: string): Promise<Comentario[]> {
  if (modoDemo) return []
  const { data,error } = await obterSupabase().from('tarefa_comentarios').select('*').eq('tarefa_id',tarefaId).order('criado_em',{ascending:true})
  if (error) throw error
  return data ?? []
}
export async function comentar(tarefaId:string,mensagem:string) {
  const { error } = await obterSupabase().from('tarefa_comentarios').insert({tarefa_id:tarefaId,mensagem})
  if (error) throw error
}
export type RegistroTempo = { id:string; tarefa_id:string; usuario_id:string; inicio:string; fim:string|null }
export async function listarTempos(tarefaId:string): Promise<RegistroTempo[]> {
  if (modoDemo) return []
  const {data,error}=await obterSupabase().from('tarefa_tempos').select('*').eq('tarefa_id',tarefaId).order('inicio',{ascending:false})
  if(error) throw error
  return data ?? []
}
export async function iniciarTempo(tarefaId:string) {
  const {error}=await obterSupabase().from('tarefa_tempos').insert({tarefa_id:tarefaId})
  if(error) throw error
}
export async function pararTempo(registroId:string) {
  const {error}=await obterSupabase().from('tarefa_tempos').update({fim:new Date().toISOString()}).eq('id',registroId).is('fim',null)
  if(error) throw error
}
export type AnexoTarefa={id:string;tarefa_id:string;nome:string;caminho:string;criado_em:string}
export async function listarAnexos(tarefaId:string):Promise<AnexoTarefa[]> {
  if(modoDemo) return []
  const {data,error}=await obterSupabase().from('tarefa_anexos').select('*').eq('tarefa_id',tarefaId).order('criado_em',{ascending:false})
  if(error) throw error
  return data ?? []
}
export async function anexarArquivo(tarefaId:string,arquivo:File) {
  if(arquivo.size>10*1024*1024) throw new Error('O limite por arquivo é 10 MB.')
  const caminho=`${tarefaId}/${crypto.randomUUID()}-${arquivo.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
  const db=obterSupabase()
  const {error:erroUpload}=await db.storage.from('scc-tarefas').upload(caminho,arquivo,{upsert:false})
  if(erroUpload) throw erroUpload
  const {error}=await db.from('tarefa_anexos').insert({tarefa_id:tarefaId,caminho,nome:arquivo.name})
  if(error) {await db.storage.from('scc-tarefas').remove([caminho]);throw error}
}
export async function urlAnexo(caminho:string) {
  const {data,error}=await obterSupabase().storage.from('scc-tarefas').createSignedUrl(caminho,60)
  if(error) throw error
  return data.signedUrl
}
