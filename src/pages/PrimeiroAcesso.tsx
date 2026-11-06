
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { obterSupabase } from '../lib/supabase'

export default function PrimeiroAcesso() {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [processando, setProcessando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  async function trocarSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (processando) return

    setErro('')
    setMensagem('')

    if (senhaNova.length < 12 || senhaNova.length > 128) {
      setErro('A senha deve ter entre 12 e 128 caracteres.')
      return
    }

    if (senhaNova !== confirmacao) {
      setErro('As novas senhas não coincidem.')
      return
    }

    if (senhaAtual === senhaNova) {
      setErro('A nova senha deve ser diferente da provisória.')
      return
    }

    setProcessando(true)

    try {
      const supabase = obterSupabase()

      const { data, error } = await supabase.functions.invoke(
        'trocar-senha-inicial',
        {
          body: { senhaAtual, senhaNova },
        }
      )

      if (error) {
        throw new Error('Não foi possível validar a troca de senha.')
      }

      if (data?.simulacao === true) {
        setMensagem(
          'Simulação aprovada. Nenhuma senha foi alterada.'
        )
        return
      }

      if (data?.ok !== true || data?.simulacao !== false) {
        throw new Error('Resposta inesperada do servidor.')
      }

      setSenhaAtual('')
      setSenhaNova('')
      setConfirmacao('')

      await supabase.auth.signOut({ scope: 'local' })

      setConcluido(true)
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Ocorreu um erro inesperado.'
      )
    } finally {
      setProcessando(false)
    }
  }

  const campo =
    'mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-500'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151515] p-8">

        <p className="text-xs font-black tracking-widest text-blue-400">
          SCC PRODUÇÃO
        </p>

        <h1 className="mt-5 text-3xl font-black">
          {concluido ? 'Senha definida!' : 'Primeiro acesso'}
        </h1>

        {concluido ? (
          <div className="mt-6 space-y-5">
            <p className="text-sm text-green-400">
              Sua senha foi atualizada. Entre novamente
              com sua senha pessoal.
            </p>

            <Link
              to="/"
              className="block rounded-lg bg-blue-600 px-4 py-3 text-center font-bold"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-white/60">
              Para sua segurança, defina uma senha pessoal
              antes de acessar o SCC Produção.
            </p>

            <form
              onSubmit={trocarSenha}
              className="mt-6 space-y-5"
            >
              <div>
                <label htmlFor="senha-atual" className="text-sm">
                  Senha provisória
                </label>
                <input
                  id="senha-atual"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className={campo}
                />
              </div>

              <div>
                <label htmlFor="senha-nova" className="text-sm">
                  Nova senha pessoal
                </label>
                <input
                  id="senha-nova"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  value={senhaNova}
                  onChange={(e) => setSenhaNova(e.target.value)}
                  className={campo}
                />
                <p className="mt-2 text-xs text-white/40">
                  Utilize pelo menos 12 caracteres.
                </p>
              </div>

              <div>
                <label htmlFor="confirmar" className="text-sm">
                  Confirmar nova senha
                </label>
                <input
                  id="confirmar"
                  type="password"
                  autoComplete="new-password"
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

              {mensagem && (
                <p role="status" className="text-sm text-amber-400">
                  {mensagem}
                </p>
              )}

              <button
                type="submit"
                disabled={processando}
                className="w-full rounded-lg bg-blue-600 py-3 font-bold hover:bg-blue-500 disabled:opacity-50"
              >
                {processando
                  ? 'Verificando...'
                  : 'Definir minha senha'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}
