import { modoDemo, obterSupabase } from '../lib/supabase'
export type ColaboradorTarefa = { id: string; nome: string; papel: 'admin' | 'editor' | 'leitor' | 'opec' | 'producao' }
export async function listarColaboradoresTarefas(): Promise<ColaboradorTarefa[]> {
  if (modoDemo) return []
  const { data, error } = await obterSupabase().rpc('listar_colaboradores_tarefas')
  if (error) throw error
  return (data ?? []) as ColaboradorTarefa[]
}
export type Prioridade = 'baixa' | 'normal' | 'alta' | 'urgente'
export type EtapaTarefa = string
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

export type ParticipanteTarefa = { tarefa_id:string; usuario_id:string }
export type ItemChecklist = { id:string; tarefa_id:string; titulo:string; concluido:boolean; ordem:number }
export async function listarParticipantes(tarefaId:string):Promise<ParticipanteTarefa[]> {
  if(modoDemo)return []
  const {data,error}=await obterSupabase().from('tarefa_participantes').select('tarefa_id,usuario_id').eq('tarefa_id',tarefaId)
  if(error)throw error
  return data??[]
}
export async function adicionarParticipante(tarefaId:string,usuarioId:string) {
  const {error}=await obterSupabase().from('tarefa_participantes').insert({tarefa_id:tarefaId,usuario_id:usuarioId})
  if(error)throw error
}
export async function removerParticipante(tarefaId:string,usuarioId:string) {
  const {error}=await obterSupabase().from('tarefa_participantes').delete().eq('tarefa_id',tarefaId).eq('usuario_id',usuarioId)
  if(error)throw error
}
export async function listarChecklist(tarefaId:string):Promise<ItemChecklist[]> {
  if(modoDemo)return []
  const {data,error}=await obterSupabase().from('tarefa_checklist').select('id,tarefa_id,titulo,concluido,ordem').eq('tarefa_id',tarefaId).order('ordem').order('criado_em')
  if(error)throw error
  return data??[]
}
export async function criarItemChecklist(tarefaId:string,titulo:string) {
  const {error}=await obterSupabase().from('tarefa_checklist').insert({tarefa_id:tarefaId,titulo:titulo.trim()})
  if(error)throw error
}
export async function marcarItemChecklist(id:string,concluido:boolean) {
  const {error}=await obterSupabase().from('tarefa_checklist').update({concluido}).eq('id',id)
  if(error)throw error
}
export async function removerItemChecklist(id:string) {
  const {error}=await obterSupabase().from('tarefa_checklist').delete().eq('id',id)
  if(error)throw error
}

export type AtividadeTarefa={id:string;tarefa_id:string;autor_id:string|null;tipo:string;detalhe:string;criado_em:string}
export type NotificacaoTarefa={id:string;tarefa_id:string;atividade_id:string;lida_em:string|null;criado_em:string}
export async function listarAtividades(tarefaId:string):Promise<AtividadeTarefa[]> {
 if(modoDemo)return []
 const {data,error}=await obterSupabase().from('tarefa_atividades').select('id,tarefa_id,autor_id,tipo,detalhe,criado_em').eq('tarefa_id',tarefaId).order('criado_em',{ascending:false}).limit(100)
 if(error)throw error
 return data??[]
}
export async function listarNotificacoes():Promise<NotificacaoTarefa[]> {
 if(modoDemo)return []
 const {data,error}=await obterSupabase().from('tarefa_notificacoes').select('id,tarefa_id,atividade_id,lida_em,criado_em').order('criado_em',{ascending:false}).limit(50)
 if(error)throw error
 return data??[]
}
export async function marcarNotificacaoLida(id:string):Promise<void> {
 const {error}=await obterSupabase().from('tarefa_notificacoes').update({lida_em:new Date().toISOString()}).eq('id',id)
 if(error)throw error
}

export type ConfigEtapa={id:string;nome:string;cor:string;ordem:number;concluida:boolean}
const etapasPadrao:ConfigEtapa[]=[{id:'backlog',nome:'A fazer',cor:'#9ca3af',ordem:0,concluida:false},{id:'andamento',nome:'Em produção',cor:'#0089ff',ordem:1,concluida:false},{id:'revisao',nome:'Em revisão',cor:'#ffb020',ordem:2,concluida:false},{id:'aprovado',nome:'Aprovado',cor:'#65d69b',ordem:3,concluida:true}]
export async function listarEtapas():Promise<ConfigEtapa[]>{
 if(modoDemo)return etapasPadrao
 const {data,error}=await obterSupabase().from('tarefa_etapas').select('id,nome,cor,ordem,concluida').order('ordem').order('criado_em')
 if(error)throw error
 return data??[]
}
export async function criarEtapa(entrada:Omit<ConfigEtapa,'concluida'>):Promise<void>{
 const {error}=await obterSupabase().from('tarefa_etapas').insert(entrada)
 if(error)throw error
}
export async function atualizarEtapaConfig(id:string,dados:Pick<ConfigEtapa,'nome'|'cor'>):Promise<void>{
 const {error}=await obterSupabase().from('tarefa_etapas').update(dados).eq('id',id)
 if(error)throw error
}
export async function excluirEtapaConfig(id:string):Promise<void>{
 const {error}=await obterSupabase().from('tarefa_etapas').delete().eq('id',id)
 if(error)throw error
}

export async function definirEtapaConclusao(id:string):Promise<void>{
 const {error}=await obterSupabase().rpc('definir_etapa_conclusao',{p_id:id})
 if(error)throw error
}
export async function reordenarEtapas(etapas:ConfigEtapa[]):Promise<void>{
 for(let i=0;i<etapas.length;i++){
  const {error}=await obterSupabase().from('tarefa_etapas').update({ordem:i}).eq('id',etapas[i].id)
  if(error)throw error
 }
}

export type ProgressoChecklist={total:number;concluidos:number}
export async function listarProgressoChecklists(tarefaIds:string[]):Promise<Record<string,ProgressoChecklist>>{
 if(modoDemo||tarefaIds.length===0)return {}
 const resultado:Record<string,ProgressoChecklist>={}
 // Consultas em lotes para evitar limites de tamanho da URL.
 for(let inicio=0;inicio<tarefaIds.length;inicio+=100){
  const ids=tarefaIds.slice(inicio,inicio+100)
  const {data,error}=await obterSupabase().from('tarefa_checklist').select('tarefa_id,concluido').in('tarefa_id',ids)
  if(error)throw error
  for(const item of data??[]){
   const atual=resultado[item.tarefa_id]??{total:0,concluidos:0}
   atual.total+=1
   if(item.concluido)atual.concluidos+=1
   resultado[item.tarefa_id]=atual
  }
 }
 return resultado
}

export async function listarParticipantesKanban(tarefaIds:string[]):Promise<Record<string,string[]>>{
 if(modoDemo||tarefaIds.length===0)return {}
 const resultado:Record<string,string[]>={}
 // Paginação evita o limite padrão de linhas do PostgREST.
 for(let i=0;i<tarefaIds.length;i+=80){
  const ids=tarefaIds.slice(i,i+80)
  let inicio=0
  while(true){
   const {data,error}=await obterSupabase().from('tarefa_participantes').select('tarefa_id,usuario_id').in('tarefa_id',ids).order('tarefa_id').order('usuario_id').range(inicio,inicio+999)
   if(error)throw error
   for(const item of data??[]){
    if(!resultado[item.tarefa_id])resultado[item.tarefa_id]=[]
    resultado[item.tarefa_id].push(item.usuario_id)
   }
   if((data??[]).length<1000)break
   inicio+=1000
  }
 }
 return resultado
}
