import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import { obterSupabase } from '../lib/supabase'
import logoBranca from '../assets/SCC SBT BRANCA.png'
import laco from '../assets/LAÇO_COLORIDO.png'

type Estado = 'formulario' | 'enviando' | 'concluido'
type Resposta = { ok?: boolean; erro?: string }

export default function DefinirSenha() {
  const [token] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('type') !== 'invite') return ''
    return params.get('token_hash') ?? ''
  })
  const [etapa, setEtapa] = useState<Estado>('formulario')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (token) {
      // Evita que o segredo de ativação fique exposto no histórico do navegador.
      window.history.replaceState(window.history.state, '', window.location.pathname)
    }
  }, [token])

  async function ativar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (etapa !== 'formulario') return
    setErro('')
    if (!token) { setErro('Link de ativação inválido. Solicite outro ao administrador.'); return }
    if (senha.length < 12 || senha.length > 128 ||
        !/[a-z]/.test(senha) || !/[A-Z]/.test(senha) ||
        !/[0-9]/.test(senha) || !/[^a-zA-Z0-9]/.test(senha)) {
      setErro('Use de 12 a 128 caracteres, incluindo maiúscula, minúscula, número e símbolo.')
      return
    }
    if (senha !== confirmacao) { setErro('As senhas não coincidem.'); return }
    setEtapa('enviando')
    try {
      const client = obterSupabase()
      // A troca por um JWT de uso único autentica a pessoa convidada.
      const { data: validado, error: erroConvite } = await client.auth.verifyOtp({
        token_hash: token,
        type: 'invite',
      })
      if (erroConvite || !validado.session) {
        throw new Error('Convite inválido ou expirado. Solicite um novo link ao administrador.')
      }
      // O servidor exige ainda o hash original registrado no momento do convite.
      const { data, error } = await client.functions.invoke<Resposta>('concluir-ativacao', {
        body: { token_hash: token, senhaNova: senha },
      })
      if (error || !data?.ok) {
        throw new Error('Não foi possível concluir a ativação. Contate o administrador para recuperar o acesso.')
      }
      await client.auth.signOut({ scope: 'local' })
      setSenha('')
      setConfirmacao('')
      setEtapa('concluido')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ativar a conta.')
      setEtapa('formulario')
    }
  }

  const campo = 'scc-login-input w-full rounded-xl border border-white/10 bg-[#050505] px-4 pr-12 text-white outline-none transition focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/10'

  return (
    <main className="scc-login-layout relative flex min-h-[100svh] flex-col overflow-hidden bg-[#050505] text-white">
      <img src={laco} alt="" draggable={false} className="scc-login-ribbon pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />
      <header className="scc-brand-header relative z-10 flex w-full items-center gap-4">
        <Link to="/" aria-label="Voltar para início">
          <img src={logoBranca} alt="SCC SBT" className="scc-brand-logo w-auto object-contain" />
        </Link>
        <div className="scc-brand-title mx-auto hidden w-full items-center justify-center rounded-2xl border border-white/5 bg-[#050505]/95 font-extrabold tracking-[.1em] md:flex">
          ATIVAÇÃO SCC PRODUÇÃO
        </div>
        <Link to="/login" className="scc-brand-action ml-auto inline-flex items-center gap-2 rounded-xl bg-white font-extrabold text-black transition hover:bg-white/85">
          <ArrowLeft size={15}/> LOGIN
        </Link>
      </header>

      <div className="scc-login-content relative z-10 flex flex-1 items-center justify-center">
        <section aria-labelledby="titulo-ativacao" className="scc-login-panel w-full rounded-[28px] border border-white/15 bg-[#050505]/95 shadow-[0_35px_110px_rgba(0,0,0,.62)] backdrop-blur-2xl">
          <div className="mx-auto flex w-fit flex-col items-center">
            <img src={logoBranca} alt="SCC SBT" className="scc-login-logo w-auto object-contain" />
            <span className="mt-4 text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Plataforma de gestão de conteúdos</span>
          </div>

          {etapa === 'concluido' ? (
            <div className="scc-login-heading mt-9 text-center">
              <CheckCircle2 size={45} className="mx-auto text-emerald-400"/>
              <h1 id="titulo-ativacao" className="scc-login-title mt-5 font-extrabold tracking-tight">Sua conta está ativa!</h1>
              <p className="mt-3 text-sm leading-6 text-white/60">Senha configurada com sucesso. Entre com seu e-mail e a senha que acabou de criar.</p>
              <Link to="/login" className="scc-login-submit mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white font-extrabold text-black transition hover:bg-[#e4f900]">
                Acessar SCC Produção <ArrowRight size={18}/>
              </Link>
            </div>
          ) : (
            <>
              <div className="scc-login-heading mt-9 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.045]"><KeyRound size={22} className="text-[#e2fa00]"/></div>
                <h1 id="titulo-ativacao" className="scc-login-title mt-5 font-extrabold tracking-tight">Ative sua conta.</h1>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  Defina uma senha segura para começar a utilizar o SCC Produção.
                </p>
              </div>
              {!token ? (
                <div role="alert" className="mt-7 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                  Este endereço não contém um convite válido. Solicite um novo link ao administrador.
                </div>
              ) : (
                <form onSubmit={e => void ativar(e)} className="scc-login-fields mt-8 space-y-5">
                  <div>
                    <label htmlFor="ativacao-senha" className="mb-2 block text-xs font-semibold text-white/75">Nova senha</label>
                    <div className="relative">
                      <input id="ativacao-senha" type={mostrar ? 'text' : 'password'} autoComplete="new-password" required minLength={12} maxLength={128}
                        value={senha} onChange={e => setSenha(e.target.value)} disabled={etapa === 'enviando'} className={campo} />
                      <button type="button" aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setMostrar(v => !v)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/45 transition hover:text-white">
                        {mostrar ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-white/40">No mínimo 12 caracteres, com maiúscula, minúscula, número e símbolo.</p>
                  </div>
                  <div>
                    <label htmlFor="ativacao-confirmar" className="mb-2 block text-xs font-semibold text-white/75">Confirmar nova senha</label>
                    <input id="ativacao-confirmar" type={mostrar ? 'text' : 'password'} autoComplete="new-password" required minLength={12} maxLength={128}
                      value={confirmacao} onChange={e => setConfirmacao(e.target.value)} disabled={etapa === 'enviando'} className={campo} />
                  </div>
                  {erro && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{erro}</p>}
                  <button type="submit" disabled={etapa === 'enviando'}
                    className="scc-login-submit flex w-full items-center justify-center gap-2 rounded-xl bg-white font-extrabold text-black transition hover:bg-[#e4f900] disabled:cursor-not-allowed disabled:opacity-50">
                    {etapa === 'enviando' ? 'Ativando conta...' : 'Definir senha e ativar'} <ArrowRight size={17}/>
                  </button>
                </form>
              )}
              <div className="mt-7 flex items-center justify-center gap-2 border-t border-white/10 pt-6 text-center text-[11px] text-white/40">
                <ShieldCheck size={15} className="text-[#e2fa00]"/> Ativação protegida por convite individual.
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
