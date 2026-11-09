
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { obterSupabase } from '../lib/supabase'

type Etapa =
  | 'sem-link'
  | 'aguardando'
  | 'verificando'
  | 'pronto'
  | 'salvando'
  | 'concluido'
  | 'erro'

export default function DefinirSenha() {
  const [token] = useState(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('type') !== 'invite') return null

    return params.get('token_hash')
  })

  const [etapa, setEtapa] = useState<Etapa>(
    token ? 'aguardando' : 'sem-link'
  )

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (token) {
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname
      )
    }
  }, [token])

  async function verificarConvite() {
    if (!token || etapa !== 'aguardando') return

    setErro('')
    setEtapa('verificando')

    try {
      const supabase = obterSupabase()

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'invite',
      })

      if (error || !data.session) {
        throw new Error('Convite inválido ou expirado.')
      }

      const { data: usuario, error: erroUsuario } =
        await supabase.auth.getUser()

      if (erroUsuario || !usuario.user) {
        throw new Error('Não foi possível confirmar a conta.')
      }

      setEmail(usuario.user.email ?? '')
      setEtapa('pronto')
    } catch {
      setErro(
        'Não foi possível validar o convite. Solicite um novo link ao administrador.'
      )
      setEtapa('erro')
    }
  }

  async function definirSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')

    if (etapa !== 'pronto') return

    if (senha.length < 12) {
      setErro('A senha deve ter pelo menos 12 caracteres.')
      return
    }

    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.')
      return
    }

    setEtapa('salvando')

    try {
      const supabase = obterSupabase()

      const { data, error: erroUsuario } =
        await supabase.auth.getUser()

      if (erroUsuario || !data.user) {
        throw new Error('A sessão de ativação expirou.')
      }

      const { error: erroSenha } =
        await supabase.auth.updateUser({
          password: senha,
        })

      if (erroSenha) {
        throw new Error(
          'Não foi possível definir a senha.'
        )
      }

      setSenha('')
      setConfirmacao('')

      const { error: erroSaida } =
        await supabase.auth.signOut({ scope: 'local' })

      if (erroSaida) {
        setErro(
          'Senha definida, mas não foi possível encerrar a sessão. Saia do sistema antes de continuar.'
        )
      }

      setEtapa('concluido')
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Erro na ativação.'
      )
      setEtapa('pronto')
    }
  }

  const campo =
    'mt-2 w-full rounded-lg border border-white/10 bg-[#050505] px-4 py-3 text-white outline-none focus:border-blue-500'

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-[#050505] px-5 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-bg-[#050505] p-8">
        <p className="text-xs font-black tracking-widest text-blue-400">
          SCC PRODUÇÃO
        </p>

        <h1 className="mt-5 text-3xl font-black">
          {etapa === 'concluido'
            ? 'Conta ativada!'
            : 'Ativar minha conta'}
        </h1>

        {etapa === 'sem-link' && (
          <p className="mt-5 text-sm text-white/60">
            Para ativar sua conta, utilize o link individual
            recebido no e-mail de convite.
          </p>
        )}

        {etapa === 'aguardando' && (
          <div className="mt-6 space-y-5">
            <p className="text-sm text-white/60">
              Recebemos seu link de convite.
              Clique abaixo para verificar sua validade.
            </p>

            <button
              type="button"
              onClick={() => void verificarConvite()}
              className="w-full rounded-lg bg-blue-600 py-3 font-bold hover:bg-blue-500"
            >
              Validar meu convite
            </button>
          </div>
        )}

        {etapa === 'verificando' && (
          <p role="status" className="mt-5 text-white/60">
            Verificando convite...
          </p>
        )}

        {(etapa === 'pronto' || etapa === 'salvando') && (
          <form
            onSubmit={definirSenha}
            className="mt-6 space-y-5"
          >
            <p className="text-sm text-green-400">
              Convite validado com sucesso.
            </p>

            {email && (
              <p className="break-all text-sm text-white/60">
                Conta: {email}
              </p>
            )}

            <div>
              <label htmlFor="nova-senha" className="text-sm">
                Nova senha
              </label>

              <input
                id="nova-senha"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={campo}
              />
            </div>

            <div>
              <label htmlFor="confirmar-senha" className="text-sm">
                Confirmar senha
              </label>

              <input
                id="confirmar-senha"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                className={campo}
              />
            </div>

            {erro && (
              <p role="alert" className="text-sm text-red-400">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={etapa === 'salvando'}
              className="w-full rounded-lg bg-blue-600 py-3 font-bold disabled:opacity-50"
            >
              {etapa === 'salvando'
                ? 'Salvando...'
                : 'Definir minha senha'}
            </button>
          </form>
        )}

        {etapa === 'erro' && (
          <p role="alert" className="mt-5 text-sm text-red-400">
            {erro}
          </p>
        )}

        {etapa === 'concluido' && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-green-400">
              Sua senha foi definida com sucesso.
            </p>
            {erro && (
              <p role="alert" className="text-sm text-amber-400">
                {erro}
              </p>
            )}
          </div>
        )}

        {['sem-link', 'erro', 'concluido'].includes(etapa) && (
          <Link
            to="/"
            className="mt-6 inline-block text-sm text-blue-400 hover:underline"
          >
            Ir para o login
          </Link>
        )}
      </section>
    </main>
  )
}
