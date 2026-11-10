import { useState, type FormEvent } from 'react'
import { Check, Copy, Link2, MailPlus, ShieldCheck, X } from 'lucide-react'
import { obterSupabase } from '../lib/supabase'
import type { Papel } from '../types/materiais'

type RespostaConvite = {
  ok?: boolean
  erro?: string
  link_ativacao?: string
  mensagem?: string
  papel?: Papel
}

export default function ConviteUsuario({ aoConvidar }: { aoConvidar?: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [modoCriacao, setModoCriacao] = useState<'convite' | 'direto'>('convite')
  const [senhaProvisoria, setSenhaProvisoria] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [papel, setPapel] = useState<Exclude<Papel, 'admin'>>('leitor')
  const [enviando, setEnviando] = useState(false)
  const [link, setLink] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setErro('')
    setLink('')
    setSenhaProvisoria('')
    setCopiado(false)
    setEnviando(true)
    try {
      const { data, error } = await obterSupabase().functions.invoke<RespostaConvite & { senha_provisoria?: string }>(modoCriacao === 'direto' ? 'criar-usuario-direto' : 'convidar-usuario', {
        body: { nome: nome.trim(), email: email.trim().toLowerCase(), papel, origem: window.location.origin },
      })
      if (error || !data?.ok || (modoCriacao === 'convite' && !data.link_ativacao) || (modoCriacao === 'direto' && !data.senha_provisoria)) {
        const status = error?.context instanceof Response ? error.context.status : 0
        throw new Error(
          status === 409 ? 'Já existe uma conta com este e-mail.' :
          status === 403 ? 'Sua sessão não possui autorização para esta operação.' :
          modoCriacao === 'direto' ? 'Não foi possível criar o usuário. Confira os dados e tente novamente.' : 'Não foi possível criar o convite. Verifique a função administrativa.'
        )
      }
      if (modoCriacao === 'direto') setSenhaProvisoria(data.senha_provisoria ?? '')
      else setLink(data.link_ativacao ?? '')
      setNome('')
      setEmail('')
      setPapel('leitor')
      aoConvidar?.()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar o convite.')
    } finally {
      setEnviando(false)
    }
  }

  async function copiar() {
    if (!link && !senhaProvisoria) return
    try {
      await navigator.clipboard.writeText(senhaProvisoria || link)
      setCopiado(true)
    } catch {
      setErro('Não foi possível copiar automaticamente. Selecione e copie o conteúdo manualmente.')
    }
  }

  function fechar() {
    if (enviando) return
    setAberto(false)
    setLink('')
    setSenhaProvisoria('')
    setCopiado(false)
    setErro('')
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-[#1f1f1f] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Cadastro de usuários</h2>
          <p className="mt-2 text-sm text-white/50">
            Convide colaboradores ou crie contas diretamente para testes e operação.
          </p>
        </div>
        <button type="button"
          onClick={() => { if (aberto) fechar(); else setAberto(true) }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold transition hover:bg-blue-500">
          {aberto ? <X size={17} /> : <MailPlus size={17} />}
          {aberto ? 'Fechar' : 'Adicionar usuário'}
        </button>
      </div>

      {aberto && !link && !senhaProvisoria && (
        <form onSubmit={e => void enviar(e)} className="mt-6 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-2">
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => setModoCriacao('convite')} className={modoCriacao === 'convite' ? 'rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold' : 'rounded-xl border border-white/20 px-4 py-2 text-sm'}>Enviar convite</button>
            <button type="button" onClick={() => setModoCriacao('direto')} className={modoCriacao === 'direto' ? 'rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold' : 'rounded-xl border border-white/20 px-4 py-2 text-sm'}>Criar usuário</button>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-blue-400/15 bg-blue-400/5 p-4 text-sm leading-relaxed text-white/65">
            <ShieldCheck size={17} className="mr-2 inline text-blue-300" />
            {modoCriacao === 'convite' ? 'Compartilhe o link de ativação em canal privado.' : 'Criação imediata, sem envio de e-mail. A senha provisória será exibida uma única vez e deverá ser trocada no primeiro acesso.'}
          </div>
          <div>
            <label htmlFor="convite-nome" className="mb-2 block text-xs font-semibold text-white/75">Nome completo</label>
            <input id="convite-nome" required minLength={2} maxLength={100} value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Nome do colaborador" className="w-full rounded-xl border border-white/15 bg-[#050505] px-4 py-3 text-sm outline-none focus:border-blue-400" />
          </div>
          <div>
            <label htmlFor="convite-email" className="mb-2 block text-xs font-semibold text-white/75">E-mail de acesso</label>
            <input id="convite-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder={modoCriacao === "direto" ? "teste01@example.test" : "colaborador@empresa.com.br"} className="w-full rounded-xl border border-white/15 bg-[#050505] px-4 py-3 text-sm outline-none focus:border-blue-400" />
          </div>
          <div>
            <label htmlFor="convite-papel" className="mb-2 block text-xs font-semibold text-white/75">Perfil de acesso</label>
            <select id="convite-papel" value={papel} onChange={e => setPapel(e.target.value as Exclude<Papel, 'admin'>)}
              className="w-full rounded-xl border border-white/15 bg-[#050505] px-4 py-3 text-sm outline-none focus:border-blue-400">
              <option value="leitor">Leitor — somente consulta</option>
              <option value="editor">Editor — gerencia materiais</option>
              <option value="opec">OPEC — gerencia a grade</option>
              <option value="producao">PRODUÇÃO — tarefas e padronização</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={enviando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold transition hover:bg-blue-500 disabled:opacity-45">
              <Link2 size={17} /> {enviando ? 'Processando...' : modoCriacao === 'direto' ? 'Criar usuário' : 'Criar link de ativação'}
            </button>
          </div>
        </form>
      )}

      {(link || senhaProvisoria) && aberto && (
        <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400"><Check size={18} /> {senhaProvisoria ? 'Usuário criado com sucesso!' : 'Convite criado com sucesso!'}</div>
          <p className="text-sm leading-relaxed text-white/55">
            {senhaProvisoria ? 'Copie a senha provisória agora: ela não será exibida novamente. A troca será exigida no primeiro acesso.' : 'Compartilhe este link individual por canal privado. Ele é temporário e não será salvo aqui.'}
          </p>
          {link && (link.startsWith('http://localhost:') || link.startsWith('http://127.0.0.1:')) ? (
            <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">
              Link de teste local: funciona apenas no computador onde o projeto está executando. Para compartilhar com colaboradores, utilize a versão online após a publicação.
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input aria-label={senhaProvisoria ? "Senha provisória" : "Link de ativação"} readOnly value={senhaProvisoria || link}
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#050505] px-4 py-3 text-xs text-white/75" />
            <button type="button" onClick={() => void copiar()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-black">
              {copiado ? <Check size={16}/> : <Copy size={16}/>} {copiado ? 'Copiado!' : senhaProvisoria ? 'Copiar senha' : 'Copiar link'}
            </button>
          </div>
          <button type="button" onClick={() => { setLink(''); setSenhaProvisoria(''); setErro('') }}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/70">{senhaProvisoria ? 'Criar outro usuário' : 'Criar outro convite'}</button>
        </div>
      )}

      {erro && <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">{erro}</p>}
    </section>
  )
}
