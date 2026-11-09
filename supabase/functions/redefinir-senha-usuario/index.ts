import { withSupabase } from '@supabase/server'

const resposta = (dados: Record<string, unknown>, status = 200) =>
  Response.json(dados, { status, headers: { 'Cache-Control': 'no-store' } })

function senhaForte(): string {
  // 32 chars aleatórios, com complexidade obrigatória.
  const simbolos = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return 'Aa1!' + Array.from(bytes, byte => simbolos[byte % simbolos.length]).join('')
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return resposta({ erro: 'Método não permitido.' }, 405)
    const adminId = ctx.userClaims?.id
    if (!adminId) return resposta({ erro: 'Sessão não identificada.' }, 401)

    // Dupla verificação: não confiar em papel, ID ou status enviados pelo browser.
    const { data: admin, error: erroAdmin } = await ctx.supabaseAdmin.from('perfis')
      .select('papel, ativo, troca_senha_pendente').eq('id', adminId).maybeSingle()
    if (erroAdmin || admin?.papel !== 'admin' || admin.ativo !== true ||
        admin.troca_senha_pendente !== false) {
      return resposta({ erro: 'Operação exclusiva de administradores.' }, 403)
    }

    const entrada: unknown = await req.json().catch(() => null)
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
      return resposta({ erro: 'Dados inválidos.' }, 400)
    }
    const usuario_id = (entrada as Record<string, unknown>).usuario_id
    if (typeof usuario_id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuario_id)) {
      return resposta({ erro: 'Usuário inválido.' }, 400)
    }
    if (usuario_id === adminId) {
      return resposta({ erro: 'Use Meu Perfil para alterar sua própria senha.' }, 403)
    }

    const { data: alvo, error: erroAlvo } = await ctx.supabaseAdmin.from('perfis')
      .select('id, papel, ativo, troca_senha_pendente').eq('id', usuario_id).maybeSingle()
    if (erroAlvo || !alvo) return resposta({ erro: 'Usuário não encontrado.' }, 404)
    if (alvo.papel === 'admin') return resposta({ erro: 'Não é permitido redefinir a senha de outro administrador.' }, 403)

    // Trava imediatamente o acesso aos dados por RLS, inclusive em sessões existentes.
    const { data: bloqueado, error: erroBloqueio } = await ctx.supabaseAdmin
      .from('perfis')
      .update({ troca_senha_pendente: true }).eq('id', usuario_id)
      .select('id').maybeSingle()
    if (erroBloqueio || !bloqueado) return resposta({ erro: 'Não foi possível preparar a troca de senha.' }, 500)

    const provisoria = senhaForte()
    const { error: erroSenha } = await ctx.supabaseAdmin.auth.admin.updateUserById(usuario_id, {
      password: provisoria,
    })
    if (erroSenha) {
      // Falha fechada: acesso segue bloqueado até nova redefinição.
      return resposta({ erro: 'Falha ao redefinir. Acesso suspenso até repetir a operação.' }, 500)
    }

    // A senha não é armazenada no banco do SCC nem em logs, só retorna nesta resposta.
    return resposta({
      ok: true,
      usuario_id,
      senha_provisoria: provisoria,
      mensagem: 'Senha provisória gerada. A troca será exigida no próximo login.',
    })
  }),
}
