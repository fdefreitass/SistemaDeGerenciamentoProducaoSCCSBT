
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { obterSupabase } from '../lib/supabase'

type Estado = 'verificando' | 'sem-sessao' | 'pronto' | 'concluido'

export default function DefinirSenha() {
  const [estado, setEstado] = useState<Estado>('verificando')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    const supabase = obterSupabase()

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_evento, sessao) => {
        if (ativo) {
          setEstado(atual =>
            atual === 'concluido'
              ? atual
              : sessao ? 'pronto' : 'sem-sessao'
          )
        }
      })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (ativo) {
        setEstado(error || !data.session ? 'sem-sessao' : 'pronto')
      }
    })

    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [])

  async function definirSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')

    if (senha.length < 12) {
      setErro('A senha deve possuir pelo menos 12 caracteres.')
      return
    }

    if (senha !== confirmacao) {
      setErro('As senhas informadas não coincidem.')
      return
    }

    setSalvando(true)

    try {
      const supabase = obterSupabase()

      const { error } = await supabase.auth.updateUser({
        password: senha,
      })

      if (error) throw error

      await supabase.auth.signOut({ scope: 'local' })
      setEstado('concluido')
      setSenha('')
      setConfirmacao('')
    } catch {
      setErro('Não foi possível definir a senha. Verifique o convite ou solicite um novo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151515] p-8">
        <p className="text-sm font-black tracking-wider text-blue-400">
          SCC PRODUÇÃO
        </p>

        <h1 className="mt-5 text-3xl font-black">
          {estado === 'concluido' ? 'Senha definida!' : 'Ativar minha conta'}
        </h1>

        {estado === 'verificando' && (
          <p className="mt-5 text-white/60">
            Verificando sua sessão...
          </p>
        )}

        {estado === 'sem-sessao' && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-white/60">
              Não encontramos uma sessão válida para ativação.
              Abra esta página pelo link recebido no e-mail.
            </p>
            <Link to="/login" className="text-blue-400">
              Ir para o login
            </Link>
          </div>
        )}

        {estado === 'pronto' && (
          <form onSubmit={definirSenha} className="mt-8 space-y-5">
            <p className="text-sm text-white/60">
              Defina uma senha segura para acessar o sistema.
            </p>

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
                onChange={e => setSenha(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3"
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
                onChange={e => setConfirmacao(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3"
              />
            </div>

            {erro && (
              <p role="alert" className="text-sm text-red-400">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={salvando}
              className="w-full rounded-lg bg-blue-600 py-3 font-bold disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Definir minha senha'}
            </button>
          </form>
        )}

        {estado === 'concluido' && (
          <div className="mt-6 space-y-5">
            <p className="text-sm text-green-400">
              Sua senha foi configurada. Agora você pode acessar o SCC Produção.
            </p>

            <Link
              to="/login"
              className="block rounded-lg bg-blue-600 px-5 py-3 text-center font-bold"
            >
              Acessar sistema
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
