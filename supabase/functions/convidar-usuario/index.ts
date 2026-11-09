
import { withSupabase } from '@supabase/server'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return Response.json(
        { erro: 'Método não permitido' },
        { status: 405 }
      )
    }

    // Identidade validada pelo Supabase Auth.
    const usuarioId = ctx.userClaims?.id

    if (!usuarioId) {
      return Response.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    // A autorização deve ser consultada no banco,
    // nunca recebida do navegador.
    const { data: perfil, error: erroPerfil } =
      await ctx.supabase
        .from('perfis')
        .select('papel, ativo, troca_senha_pendente')
        .eq('id', usuarioId)
        .single()

    if (
      erroPerfil ||
      !perfil?.ativo ||
      perfil.papel !== 'admin' ||
      perfil.troca_senha_pendente !== false
    ) {
      return Response.json(
        { erro: 'Acesso exclusivo de administradores' },
        { status: 403 }
      )
    }

    let entrada: unknown

    try {
      entrada = await req.json()
    } catch {
      return Response.json(
        { erro: 'JSON inválido' },
        { status: 400 }
      )
    }

    if (!entrada || typeof entrada !== 'object') {
      return Response.json(
        { erro: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const dados = entrada as Record<string, unknown>
    const nome =
      typeof dados.nome === 'string'
        ? dados.nome.trim()
        : ''

    const email =
      typeof dados.email === 'string'
        ? dados.email.trim().toLowerCase()
        : ''

    if (
      nome.length < 2 ||
      nome.length > 120 ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return Response.json(
        { erro: 'Confira nome e e-mail' },
        { status: 400 }
      )
    }

    // Nesta fase, somente e-mails de teste autorizados.
    const permitidos = (
      Deno.env.get('INVITE_ALLOWED_EMAILS') ?? ''
    )
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)

    if (!permitidos.includes(email)) {
      return Response.json(
        { erro: 'E-mail não autorizado para testes' },
        { status: 403 }
      )
    }

    // Modo de segurança: não cria usuários nem envia e-mails.
    if (Deno.env.get('INVITES_ENABLED') !== 'true') {
      return Response.json({
        ok: true,
        simulacao: true,
        mensagem: 'Autorização e dados validados',
      })
    }

    const redirectTo = Deno.env.get('INVITE_REDIRECT_URL')

    if (!redirectTo) {
      return Response.json(
        { erro: 'URL de ativação não configurada' },
        { status: 503 }
      )
    }

    // Operação privilegiada, somente após verificar admin.
    const { data: convite, error: erroConvite } =
      await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: { nome },
          redirectTo,
        }
      )

    if (erroConvite) {
      console.error('Falha no convite:', erroConvite.message)

      return Response.json(
        { erro: 'Não foi possível enviar o convite' },
        { status: 502 }
      )
    }

    // Atualiza o nome no perfil criado pelo trigger.
    let perfilSincronizado = false

    if (convite.user?.id) {
      const { data: atualizado, error: erroNome } =
        await ctx.supabaseAdmin
          .from('perfis')
          .update({ nome })
          .eq('id', convite.user.id)
          .select('id')

      perfilSincronizado =
        !erroNome && atualizado?.length === 1

      if (!perfilSincronizado) {
        console.error(
          'Convite criado, mas o perfil precisa de revisão.'
        )
      }
    }

    return Response.json({
      ok: true,
      simulacao: false,
      perfilSincronizado,
      mensagem: 'Convite solicitado com sucesso',
    })
  }),
}
