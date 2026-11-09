
import { withSupabase } from '@supabase/server'

function resposta(
  dados: Record<string, unknown>,
  status = 200
) {
  return Response.json(dados, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export default {
  fetch: withSupabase(
    { auth: 'user' },
    async (req, ctx) => {
      if (req.method !== 'POST') {
        return resposta(
          { erro: 'Metodo nao permitido' },
          405
        )
      }

      const usuarioId = ctx.userClaims?.id
      const email = ctx.userClaims?.email

      if (!usuarioId || !email) {
        return resposta(
          { erro: 'Nao autenticado' },
          401
        )
      }

      // Verifica somente o perfil do usuario autenticado.
      const { data: perfil, error: erroPerfil } =
        await ctx.supabaseAdmin
          .from('perfis')
          .select('ativo, troca_senha_pendente')
          .eq('id', usuarioId)
          .maybeSingle()

      if (erroPerfil) {
        return resposta(
          { erro: 'Falha ao consultar perfil' },
          500
        )
      }

      if (
        !perfil ||
        perfil.ativo !== true ||
        perfil.troca_senha_pendente !== true
      ) {
        return resposta(
          { erro: 'Troca inicial nao autorizada' },
          403
        )
      }

      const entrada: unknown =
        await req.json().catch(() => null)

      if (
        !entrada ||
        typeof entrada !== 'object' ||
        Array.isArray(entrada)
      ) {
        return resposta({ erro: 'Dados invalidos' }, 400)
      }

      const dados = entrada as Record<string, unknown>
      const senhaAtual = dados.senhaAtual
      const senhaNova = dados.senhaNova

      if (
        typeof senhaAtual !== 'string' ||
        typeof senhaNova !== 'string'
      ) {
        return resposta({ erro: 'Senhas invalidas' }, 400)
      }

      if (senhaNova.length < 12 || senhaNova.length > 128) {
        return resposta(
          { erro: 'A nova senha deve ter de 12 a 128 caracteres' },
          400
        )
      }

      if (senhaNova === senhaAtual) {
        return resposta(
          { erro: 'A nova senha deve ser diferente da provisoria' },
          400
        )
      }

      // Confirmar a posse da senha provisoria.
      const { data: login, error: erroLogin } =
        await ctx.supabase.auth.signInWithPassword({
          email,
          password: senhaAtual,
        })

      if (
        erroLogin ||
        login.user?.id !== usuarioId
      ) {
        return resposta(
          { erro: 'Senha provisoria invalida' },
          403
        )
      }

      // Alterar a senha somente da conta autenticada.
      const { error: erroSenha } =
        await ctx.supabaseAdmin.auth.admin.updateUserById(
          usuarioId,
          { password: senhaNova }
        )

      if (erroSenha) {
        return resposta(
          { erro: 'Nao foi possivel atualizar a senha' },
          500
        )
      }

      // Liberar o perfil apos atualizar a senha.
      const { data: atualizado, error: erroAtualizacao } =
        await ctx.supabaseAdmin
          .from('perfis')
          .update({ troca_senha_pendente: false })
          .eq('id', usuarioId)
          .eq('ativo', true)
          .eq('troca_senha_pendente', true)
          .select('id')
          .maybeSingle()

      if (erroAtualizacao || !atualizado) {
        return resposta(
          {
            erro: 'Senha atualizada, mas liberacao pendente. Contate o administrador.',
          },
          500
        )
      }

      return resposta({
        ok: true,
        simulacao: false,
        mensagem: 'Senha atualizada com sucesso.',
      })
    }
  ),
}
