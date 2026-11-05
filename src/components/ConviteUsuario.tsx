
import { useState, type FormEvent } from 'react'
import { obterSupabase } from '../lib/supabase'

export default function ConviteUsuario() {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (enviando) return

    setErro('')
    setMensagem('')
    setEnviando(true)

    try {
      const { data, error } = await obterSupabase()
        .functions.invoke('convidar-usuario', {
          body: {
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
          },
        })

      if (error) {
        const status =
          error.context instanceof Response
            ? error.context.status
            : null

        if (status === 403) {
          throw new Error(
            'Acesso negado ou e-mail não autorizado para testes.'
          )
        }

        if (status === 401) {
          throw new Error(
            'Sessão não autorizada. Faça login novamente.'
          )
        }

        throw new Error(
          'Não foi possível validar o convite.'
        )
      }

      if (data?.ok === true && data?.simulacao === true) {
        setMensagem(
          'Simulação aprovada! Nenhum usuário foi criado e nenhum e-mail foi enviado.'
        )
        setNome('')
        setEmail('')
      } else {
        throw new Error(
          'Resposta inesperada. Verifique se os convites reais continuam desativados.'
        )
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro desconhecido.'
      )
    } finally {
      setEnviando(false)
    }
  }

  const campo =
    'w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-sm text-white outline-none focus:border-blue-500'

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-[#151515] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            Convites de usuários
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Valide o cadastro de novos colaboradores.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setAberto(!aberto)
            setErro('')
            setMensagem('')
          }}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500"
        >
          {aberto ? 'Fechar' : '+ Convidar usuário'}
        </button>
      </div>

      {aberto && (
        <form onSubmit={enviar} className="mt-8 space-y-5">
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
            Ambiente de teste — envio de convites desativado.
          </p>

          <div>
            <label
              htmlFor="convite-nome"
              className="mb-2 block text-sm text-white/70"
            >
              Nome completo
            </label>
            <input
              id="convite-nome"
              className={campo}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do colaborador"
              minLength={2}
              maxLength={120}
              required
            />
          </div>

          <div>
            <label
              htmlFor="convite-email"
              className="mb-2 block text-sm text-white/70"
            >
              E-mail de teste autorizado
            </label>
            <input
              id="convite-email"
              type="email"
              className={campo}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teste@exemplo.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold disabled:opacity-50 hover:bg-blue-500"
          >
            {enviando ? 'Validando...' : 'Simular convite'}
          </button>

          {mensagem && (
            <p role="status" className="text-sm text-green-400">
              {mensagem}
            </p>
          )}

          {erro && (
            <p role="alert" className="text-sm text-red-400">
              {erro}
            </p>
          )}
        </form>
      )}
    </section>
  )
}
