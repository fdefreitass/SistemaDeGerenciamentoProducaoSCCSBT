import { withSupabase } from '@supabase/server'

type Papel = 'admin' | 'editor' | 'leitor'
type Acao = 'alterar_papel' | 'excluir' | 'desativar' | 'reativar'

const resposta = (dados: Record<string, unknown>, status = 200) =>
  Response.json(dados, { status, headers: { 'Cache-Control': 'no-store' } })

function papelValido(papel: unknown): papel is Papel {
  return papel === 'admin' || papel === 'editor' || papel === 'leitor'
}
function uuidValido(id: unknown): id is string {
  return typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return resposta({ erro: 'Método não permitido.' }, 405)

    const administradorId = ctx.userClaims?.id
    if (!uuidValido(administradorId)) return resposta({ erro: 'Sessão inválida.' }, 401)

    const { data: administrador, error: erroAdministrador } = await ctx.supabaseAdmin
      .from('perfis').select('papel, ativo, troca_senha_pendente')
      .eq('id', administradorId).maybeSingle()

    if (erroAdministrador || administrador?.papel !== 'admin' ||
        administrador.ativo !== true || administrador.troca_senha_pendente !== false) {
      return resposta({ erro: 'Somente administradores ativos podem gerenciar contas.' }, 403)
    }

    const entrada: unknown = await req.json().catch(() => null)
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
      return resposta({ erro: 'Requisição inválida.' }, 400)
    }
    const dados = entrada as Record<string, unknown>
    const usuario_id = dados.usuario_id
    const acao = dados.acao
    if (!uuidValido(usuario_id) ||
        (acao !== 'alterar_papel' && acao !== 'excluir' && acao !== 'desativar' && acao !== 'reativar')) {
      return resposta({ erro: 'Ação ou usuário inválido.' }, 400)
    }

    if (usuario_id === administradorId) {
      return resposta({ erro: 'Não é permitido alterar ou excluir a própria conta administrativa.' }, 403)
    }

    const { data: usuario, error: erroUsuario } = await ctx.supabaseAdmin
      .from('perfis')
      .select('id, nome, papel, ativo, troca_senha_pendente')
      .eq('id', usuario_id)
      .maybeSingle()

    if (erroUsuario || !usuario) return resposta({ erro: 'Conta não encontrada.' }, 404)

    // O último administrador ativo jamais pode perder o acesso. O banco possui
    // uma segunda camada de proteção por trigger (migração 06).
    if (usuario.papel === 'admin' &&
      (acao === 'excluir' || acao === 'desativar' ||
        (acao === 'alterar_papel' && dados.papel !== 'admin'))) {
      const { count, error } = await ctx.supabaseAdmin.from('perfis')
        .select('id', { count: 'exact', head: true })
        .eq('papel', 'admin').eq('ativo', true).eq('troca_senha_pendente', false)
      if (error || (count ?? 0) <= 1) {
        return resposta({ erro: 'Não é possível remover o último administrador ativo.' }, 409)
      }
    }

    if (acao === 'alterar_papel') {
      const papel = dados.papel
      if (!papelValido(papel) || papel === usuario.papel) {
        return resposta({ erro: 'Selecione um perfil de acesso diferente.' }, 400)
      }
      if (papel === 'admin' && (!usuario.ativo || usuario.troca_senha_pendente)) {
        return resposta({ erro: 'Ative e conclua o primeiro acesso antes de conceder administrador.' }, 409)
      }
      const confirmacao = papel === 'admin' ? 'CONCEDER ADMIN' : 'ALTERAR PERMISSAO'
      if (dados.confirmacao !== confirmacao) return resposta({ erro: 'Confirmação não recebida.' }, 400)

      const { data: atualizado, error } = await ctx.supabaseAdmin.from('perfis')
        .update({ papel })
        .eq('id', usuario_id)
        .eq('papel', usuario.papel)
        .select('id, papel')
        .maybeSingle()
      if (error || !atualizado) return resposta({ erro: 'A permissão não foi alterada. Recarregue a lista.' }, 409)
      return resposta({ ok: true, mensagem: 'Permissão atualizada.', usuario_id, papel: atualizado.papel })
    }

    if (acao === 'desativar' || acao === 'reativar') {
      if (dados.confirmacao !== (acao === 'desativar' ? 'DESATIVAR' : 'REATIVAR')) {
        return resposta({ erro: 'Confirmação necessária.' }, 400)
      }
      const ativo = acao === 'reativar'
      if (usuario.ativo === ativo) return resposta({ erro: 'O usuário já está nesta situação.' }, 409)
      const { data: atualizado, error } = await ctx.supabaseAdmin.from('perfis')
        .update({ ativo })
        .eq('id', usuario_id)
        .eq('ativo', !ativo)
        .select('id, ativo').maybeSingle()
      if (error || !atualizado) return resposta({ erro: 'Não foi possível atualizar a situação.' }, 409)
      return resposta({ ok: true, mensagem: ativo ? 'Conta reativada.' : 'Acesso da conta desativado.', usuario_id, ativo })
    }

    // EXCLUSÃO DEFINITIVA: sempre exigir nome exato digitado pelo administrador.
    if (acao === 'excluir') {
      if (dados.confirmacao !== usuario.nome) {
        return resposta({ erro: 'Digite o nome exato do usuário para confirmar a exclusão.' }, 400)
      }

      // Bloquear a exclusão quando o usuário é autor de materiais/seções
      // ou consta na trilha de auditoria: preservar autoria e histórico.
      const consultas = await Promise.all([
        ctx.supabaseAdmin.from('materiais').select('id', { count: 'exact', head: true }).eq('criado_por', usuario_id),
        ctx.supabaseAdmin.from('secoes').select('id', { count: 'exact', head: true }).eq('criado_por', usuario_id),
        ctx.supabaseAdmin.from('historico_materiais').select('id', { count: 'exact', head: true }).eq('usuario_id', usuario_id),
      ])
      if (consultas.some(item => item.error)) {
        return resposta({ erro: 'Não foi possível conferir a autoria dos registros. Exclusão cancelada.' }, 503)
      }
      const vinculados = consultas.map(item => item.count ?? 0)
      if (vinculados.some(n => n > 0)) {
        return resposta({
          erro: 'Este usuário possui materiais, seções ou ações registradas. Para preservar a auditoria, desative a conta em vez de excluí-la.',
          possui_registros: true,
        }, 409)
      }

      // Qualquer sessão prévia perde acesso a dados privados imediatamente.
      // Se a exclusão no Auth falhar, a conta permanece bloqueada, sem dano a materiais.
      const { error: erroBloqueio } = await ctx.supabaseAdmin.from('perfis')
        .update({ ativo: false }).eq('id', usuario_id).eq('ativo', usuario.ativo)
      if (erroBloqueio) return resposta({ erro: 'Não foi possível bloquear a conta antes da exclusão.' }, 500)

      // O Storage requer a remoção de arquivos pertencentes ao usuário para
      // excluir a conta Auth. Somente o avatar do próprio usuário é atingido.
      const { error: erroAvatar } = await ctx.supabaseAdmin.storage
        .from('scc-avatars').remove([`${usuario_id}/avatar`])
      if (erroAvatar) {
        return resposta({ erro: 'Conta bloqueada, mas a remoção da foto falhou. Revise e tente novamente.' }, 500)
      }

      const { error: erroExclusao } = await ctx.supabaseAdmin.auth.admin.deleteUser(usuario_id)
      if (erroExclusao) {
        return resposta({
          erro: 'Não foi possível concluir a exclusão (possível vínculo externo). A conta já está desativada; revise as referências antes de tentar novamente.',
        }, 409)
      }

      return resposta({ ok: true, mensagem: 'Usuário excluído definitivamente.', usuario_id })
    }

    return resposta({ erro: 'Ação não suportada.' }, 400)
  }),
}
