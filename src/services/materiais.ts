import { obterSupabase } from '../lib/supabase'
import type { Material, Secao } from '../types/materiais'

export async function listarDados() {
  const client = obterSupabase()
  const [resultadoSecoes, resultadoMateriais] = await Promise.all([
    client.from('secoes').select('id, nome').order('nome'),
    client.from('materiais')
      .select('id, secao_id, codigo, titulo, duracao_segundos, status_grade, status_producao, link_externo, observacoes')
      .order('codigo'),
  ])
  if (resultadoSecoes.error) throw resultadoSecoes.error
  if (resultadoMateriais.error) throw resultadoMateriais.error
  return {
    secoes: (resultadoSecoes.data ?? []) as Secao[],
    materiais: (resultadoMateriais.data ?? []) as Material[],
  }
}

export async function criarSecao(nome: string): Promise<Secao> {
  const { data, error } = await obterSupabase()
    .from('secoes').insert({ nome }).select('id, nome').single()
  if (error) throw error
  return data as Secao
}

export async function criarMaterial(
  novo: Pick<Material, 'secao_id' | 'codigo' | 'titulo' | 'duracao_segundos' | 'link_externo'>
): Promise<Material> {
  const { data, error } = await obterSupabase()
    .from('materiais').insert(novo)
    .select('id, secao_id, codigo, titulo, duracao_segundos, status_grade, status_producao, link_externo, observacoes')
    .single()
  if (error) throw error
  return data as Material
}

export async function atualizarMaterial(
  id: string,
  alteracoes: Partial<Pick<Material, 'titulo' | 'duracao_segundos' | 'status_grade' | 'status_producao' | 'link_externo' | 'observacoes'>>
): Promise<void> {
  const { data, error } = await obterSupabase()
    .from('materiais').update(alteracoes).eq('id', id).select('id').single()
  if (error) throw error
  if (!data) throw new Error('Material não localizado ou operação não permitida.')
}
