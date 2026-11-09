import { withSupabase } from '@supabase/server'

// Convites reais por link de ativação, sem depender de SMTP.
// Somente administradores ativos, com senha inicial já trocada, podem gerar links.
const responder = (dados: Record<string, unknown>, status = 200) =>
  Response.json(dados, { status, headers: { 'Cache-Control': 'no-store' } })

const APP = 'https://producaosccsbt.pages.dev'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return responder({ erro: 'Método não permitido.' }, 405)
    const usuarioId = ctx.userClaims?.id
    if (!usuarioId) return responder({ erro: 'Não autenticado.' }, 401)

    const { data: administrador, error: erroAutorizacao } = await ctx.supabaseAdmin
      .from('perfis').select('papel, ativo, troca_senha_pendente')
      .eq('id', usuarioId).maybeSingle()
    if (erroAutorizacao || administrador?.papel !== 'admin' ||
        administrador.ativo !== true || administrador.troca_senha_pendente !== false) {
      return responder({ erro: 'Apenas administradores podem convidar.' }, 403)
    }

    const dados: unknown = await req.json().catch(() => null)
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
      return responder({ erro: 'Dados inválidos.' }, 400)
    }
    const form = dados as Record<string, unknown>
    const nome = typeof form.nome === 'string' ? form.nome.trim().replace(/\s+/g, ' ') : ''
    const email = typeof form.email === 'string' ? form.email.trim().toLowerCase() : ''
    const papel = form.papel

    if (nome.length < 2 || nome.length > 100 || email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        (papel !== 'leitor' && papel !== 'editor')) {
      return responder({ erro: 'Confira nome, e-mail e perfil (Leitor ou Editor).' }, 400)
    }

    // Não reutilizar um convite para uma conta existente.
    const { data: lista, error: erroLista } =
      await ctx.supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (erroLista) return responder({ erro: 'Não foi possível conferir os usuários.' }, 503)
    if (lista.users.some(u => u.email?.toLowerCase() === email)) {
      return responder({ erro: 'Já existe uma conta com este e-mail.' }, 409)
    }

    const { data, error } = await ctx.supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { data: { name: nome }, redirectTo: APP + '/definir-senha' },
    })
    if (error || !data.user?.id || !data.properties?.hashed_token) {
      return responder({ erro: 'Não foi possível gerar o link de ativação.' }, 502)
    }

    // O gatilho da base cria automaticamente perfil inativo e pendente.
    // A conta não pode acessar conteúdo enquanto a senha não é definida.
    const { data: perfil, error: erroPerfil } = await ctx.supabaseAdmin
      .from('perfis')
      .update({ nome, papel, ativo: true, troca_senha_pendente: true })
      .eq('id', data.user.id)
      .eq('ativo', false)
      .eq('troca_senha_pendente', true)
      .select('id')
      .maybeSingle()
    if (erroPerfil || !perfil) {
      // A conta recém-criada não pode ficar parcialmente configurada.
      await ctx.supabaseAdmin.auth.admin.deleteUser(data.user.id)
      return responder({ erro: 'Não foi possível configurar a conta. Nenhum convite foi liberado.' }, 500)
    }

    const url = APP + '/definir-senha?token_hash=' +
      encodeURIComponent(data.properties.hashed_token) + '&type=invite'

    // Link contém credencial temporária: exibir uma só vez e nunca registrá-lo em logs.
    return responder({
      ok: true,
      usuario_id: data.user.id,
      nome, email, papel,
      link_ativacao: url,
      mensagem: 'Conta criada. Compartilhe o link em canal privado.',
    }, 201)
  }),
}
