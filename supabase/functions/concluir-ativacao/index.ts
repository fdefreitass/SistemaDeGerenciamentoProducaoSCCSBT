import { withSupabase } from '@supabase/server'

// Requer um JWT válido (obtido da verificação do OTP pelo usuário) e
// o hash de seu convite original cadastrado em convites_ativacao.
const resposta = (dados: Record<string, unknown>, status = 200) =>
  Response.json(dados, { status, headers: { 'Cache-Control': 'no-store' } })

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return resposta({ erro: 'Método não permitido.' }, 405)

    const usuarioId = ctx.userClaims?.id
    if (!usuarioId) return resposta({ erro: 'Sessão de ativação não identificada.' }, 401)

    const entrada: unknown = await req.json().catch(() => null)
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
      return resposta({ erro: 'Dados inválidos.' }, 400)
    }
    const valores = entrada as Record<string, unknown>
    const token_hash = valores.token_hash
    const senhaNova = valores.senhaNova

    if (typeof token_hash !== 'string' || token_hash.length < 20 || token_hash.length > 1024 ||
        typeof senhaNova !== 'string' || senhaNova.length < 12 || senhaNova.length > 128 ||
        !/[A-Z]/.test(senhaNova) || !/[a-z]/.test(senhaNova) ||
        !/[0-9]/.test(senhaNova) || !/[^a-zA-Z0-9]/.test(senhaNova)) {
      return resposta({ erro: 'Convite inválido ou senha fora dos requisitos.' }, 400)
    }

    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token_hash))
    const hash = Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, '0')).join('')

    const { data: convite, error: erroConvite } = await ctx.supabaseAdmin
      .from('convites_ativacao')
      .select('token_sha256, expira_em')
      .eq('usuario_id', usuarioId)
      .maybeSingle()

    if (erroConvite || !convite || convite.token_sha256 !== hash ||
        Date.parse(convite.expira_em) < Date.now()) {
      return resposta({ erro: 'Convite expirado ou não correspondente à sua conta.' }, 403)
    }

    const { data: perfil, error: erroPerfil } = await ctx.supabaseAdmin
      .from('perfis').select('ativo, papel, troca_senha_pendente')
      .eq('id', usuarioId).maybeSingle()
    if (erroPerfil || !perfil || perfil.ativo !== true ||
        perfil.troca_senha_pendente !== true ||
        (perfil.papel !== 'leitor' && perfil.papel !== 'editor')) {
      return resposta({ erro: 'A conta não está autorizada para ativação.' }, 403)
    }

    // Alterar apenas o usuário da sessão vinculada ao convite.
    const { error: erroSenha } = await ctx.supabaseAdmin.auth.admin.updateUserById(usuarioId, {
      password: senhaNova,
    })
    if (erroSenha) {
      return resposta({ erro: 'Não foi possível definir a senha. Contate o administrador.' }, 502)
    }

    const { data: liberado, error: erroLiberacao } = await ctx.supabaseAdmin
      .from('perfis').update({ troca_senha_pendente: false })
      .eq('id', usuarioId).eq('ativo', true).eq('troca_senha_pendente', true)
      .select('id').maybeSingle()
    if (erroLiberacao || !liberado) {
      return resposta({ erro: 'Senha definida, mas liberação pendente. Contate o administrador.' }, 500)
    }

    await ctx.supabaseAdmin.from('convites_ativacao').delete().eq('usuario_id', usuarioId)
    return resposta({ ok: true, mensagem: 'Conta ativada. Acesse com seu e-mail e senha.' })
  }),
}
