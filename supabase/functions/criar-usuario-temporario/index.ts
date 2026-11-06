
import { withSupabase } from '@supabase/server'

const resposta = (
  dados: Record<string, unknown>,
  status = 200
) =>
  Response.json(dados, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })

function gerarSenhaProvisoria(): string {
  const caracteres =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

  const bytes = crypto.getRandomValues(new Uint8Array(32))

  // 192 bits de aleatoriedade, com caracteres adicionais
  // para atender politicas usuais de complexidade.
  return 'Aa1!' +
    Array.from(bytes, (byte) => caracteres[byte % 64]).join('')
}

export default {
  fetch: withSupabase(
    { auth: 'user' },
    async (req, ctx) => {
      if (req.method !== 'POST') {
        return resposta({ erro: 'Metodo nao permitido' }, 405)
      }

      const usuarioId = ctx.userClaims?.id

      if (!usuarioId) {
        return resposta({ erro: 'Nao autenticado' }, 401)
      }

      // A autorizacao vem do banco, nunca do navegador.
      const { data: perfil, error: erroPerfil } =
        await ctx.supabase
          .from('perfis')
          .select('papel, ativo, troca_senha_pendente')
          .eq('id', usuarioId)
          .maybeSingle()

      if (erroPerfil) {
        return resposta(
          { erro: 'Erro ao verificar autorizacao' },
          500
        )
      }

      if (
        perfil?.papel !== 'admin' ||
        perfil.ativo !== true ||
        perfil.troca_senha_pendente !== false
      ) {
        return resposta({ erro: 'Acesso negado' }, 403)
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

      const nome =
        typeof dados.nome === 'string'
          ? dados.nome.trim()
          : ''

      const email =
        typeof dados.email === 'string'
          ? dados.email.trim().toLowerCase()
          : ''

      const papel = dados.papel

      if (nome.length < 3 || nome.length > 120) {
        return resposta({ erro: 'Nome invalido' }, 400)
      }

      if (
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return resposta({ erro: 'Email invalido' }, 400)
      }

      if (papel !== 'leitor' && papel !== 'editor') {
        return resposta({ erro: 'Perfil nao permitido' }, 400)
      }

      // TRAVA 1: cadastro real desativado por padrao.
      const habilitado =
        Deno.env.get('TEMP_USERS_ENABLED') === 'true'

      if (!habilitado) {
        return resposta({
          ok: true,
          simulacao: true,
          mensagem: 'Cadastro validado. Nenhuma conta criada.',
          nome,
          email,
          papel,
        })
      }

      // TRAVA 2: somente emails autorizados para testes.
      const permitidos = (
        Deno.env.get('TEMP_USERS_ALLOWED_EMAILS') ?? ''
      )
        .split(',')
        .map((valor) => valor.trim().toLowerCase())
        .filter(Boolean)

      if (!permitidos.includes(email)) {
        return resposta(
          { erro: 'Email nao autorizado para testes' },
          403
        )
      }

      const senhaProvisoria = gerarSenhaProvisoria()

      // Operacao privilegiada, executada apenas no servidor.
      // O gatilho existente cria o perfil inicialmente inativo.
      const { data: criado, error: erroCriacao } =
        await ctx.supabaseAdmin.auth.admin.createUser({
          email,
          password: senhaProvisoria,
          email_confirm: true,
          user_metadata: { nome },
        })

      if (erroCriacao || !criado.user) {
        return resposta(
          { erro: 'Nao foi possivel criar a conta' },
          409
        )
      }

      // O perfil ja foi criado pelo gatilho.
      // Atualizamos apenas o registro dessa nova conta.
      const { data: atualizado, error: erroAtualizacao } =
        await ctx.supabaseAdmin
          .from('perfis')
          .update({
            papel,
            ativo: true,
            troca_senha_pendente: true,
          })
          .eq('id', criado.user.id)
          .eq('ativo', false)
          .eq('troca_senha_pendente', true)
          .select('id')
          .maybeSingle()

      if (erroAtualizacao || !atualizado) {
        // Tenta desfazer a conta se a configuracao falhar.
        const { error: erroExclusao } =
          await ctx.supabaseAdmin.auth.admin.deleteUser(
            criado.user.id
          )

        if (erroExclusao) {
          console.error(
            'Falha na reversao do cadastro:',
            criado.user.id
          )
        }

        return resposta(
          { erro: 'Cadastro incompleto. Revisao necessaria.' },
          500
        )
      }

      // Nunca registrar a senha em logs.
      return resposta({
        ok: true,
        simulacao: false,
        usuario_id: criado.user.id,
        nome,
        email,
        papel,
        senha_provisoria: senhaProvisoria,
      }, 201)
    }
  ),
}
