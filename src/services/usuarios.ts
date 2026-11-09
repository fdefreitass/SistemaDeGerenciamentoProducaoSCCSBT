
import { obterSupabase } from '../lib/supabase'
import type { Papel } from '../types/materiais'

export type UsuarioResumo = {
  id: string
  nome: string
  papel: Papel
  ativo: boolean
  criado_em: string
  troca_senha_pendente: boolean
}

export async function listarUsuarios(): Promise<UsuarioResumo[]> {
  const { data, error } = await obterSupabase()
    .from('perfis')
    .select('id, nome, papel, ativo, criado_em, troca_senha_pendente')
    .order('criado_em', { ascending: false })

  if (error) {
    throw new Error('Não foi possível consultar os usuários.')
  }

  return (data ?? []) as UsuarioResumo[]
}


export async function redefinirSenhaUsuario(usuarioId: string): Promise<string> {
  const { data, error } = await obterSupabase().functions.invoke<{
    ok?: boolean
    erro?: string
    senha_provisoria?: string
  }>('redefinir-senha-usuario', {
    body: { usuario_id: usuarioId },
  })
  if (error || !data?.ok || !data.senha_provisoria) {
    const status = error?.context instanceof Response ? error.context.status : 0
    throw new Error(
      status === 403 ? 'Ação não autorizada. A redefinição de contas administrativas é proibida.' :
      status === 404 ? 'Colaborador não encontrado.' :
      'Não foi possível redefinir a senha. Verifique a função administrativa.'
    )
  }
  return data.senha_provisoria
}
