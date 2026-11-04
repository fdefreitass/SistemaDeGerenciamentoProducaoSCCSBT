
import { obterSupabase } from '../lib/supabase'
import type { Papel } from '../types/materiais'

export type UsuarioResumo = {
  id: string
  nome: string
  papel: Papel
  ativo: boolean
  criado_em: string
}

export async function listarUsuarios(): Promise<UsuarioResumo[]> {
  const { data, error } = await obterSupabase()
    .from('perfis')
    .select('id, nome, papel, ativo, criado_em')
    .order('criado_em', { ascending: false })

  if (error) {
    throw new Error('Não foi possível consultar os usuários.')
  }

  return (data ?? []) as UsuarioResumo[]
}

