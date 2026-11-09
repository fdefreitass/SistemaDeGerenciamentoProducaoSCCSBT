import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { obterSupabase } from '../lib/supabase'
import logoBranca from '../assets/SCC SBT BRANCA.png'
import laco from '../assets/LAÇO_COLORIDO.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    setErro('')
    try {
      const { error } = await obterSupabase().auth.signInWithPassword({ email, password: senha })
      if (error) throw error
      setSenha('')
      // App.tsx reconhecerá a sessão e encaminhará o usuário ao painel.
    } catch {
      setErro('Não foi possível entrar. Confira suas credenciais e a confirmação da conta.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#030303] text-white">
      <img src={laco} alt="" className="scc-login-ribbon pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center" draggable={false} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/50" />
      <header className="relative z-10 mx-auto flex h-[88px] w-full max-w-[1640px] items-center gap-4 px-5 sm:px-10 lg:px-14">
        <Link to="/" aria-label="Voltar à página inicial">
          <img src={logoBranca} alt="SCC SBT" className="h-[42px] w-auto max-w-[112px] object-contain" />
        </Link>
        <div className="mx-auto hidden h-[46px] w-full max-w-[910px] items-center justify-center rounded-2xl border border-white/5 bg-[#161616]/95 text-xs font-extrabold tracking-[.1em] md:flex">
          ACESSO AO SCC PRODUÇÃO
        </div>
        <Link to="/" className="ml-auto inline-flex h-[44px] items-center gap-2 rounded-xl bg-white px-5 text-xs font-extrabold text-black transition hover:bg-white/85">
          <ArrowLeft size={15} /> INÍCIO
        </Link>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-20 pt-10">
        <section className="scc-login-panel w-full max-w-[480px] rounded-[28px] border border-white/15 bg-[#131313]/95 p-7 shadow-[0_35px_110px_rgba(0,0,0,.62)] backdrop-blur-2xl sm:p-11" aria-labelledby="titulo-login">
          <div className="mx-auto flex w-fit flex-col items-center">
            <img src={logoBranca} alt="SCC SBT" className="h-13 w-auto max-w-37 object-contain" />
            <span className="mt-4 text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Plataforma de gestão de conteúdos</span>
          </div>
          <div className="mt-9 text-center">
            <h1 id="titulo-login" className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">Bem-vindo de volta.</h1>
            <p className="mt-2 text-sm text-white/50">Entre com sua conta autorizada para continuar.</p>
          </div>
          <form onSubmit={entrar} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-semibold text-white/75">E-mail corporativo</label>
              <input id="email" type="email" autoComplete="username" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
                className="h-13 w-full rounded-xl border border-white/10 bg-[#090909] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
            <div>
              <label htmlFor="senha" className="mb-2 block text-xs font-semibold text-white/75">Senha</label>
              <div className="relative">
                <input id="senha" type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password" required value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="h-13 w-full rounded-xl border border-white/10 bg-[#090909] px-4 pr-12 text-sm text-white outline-none transition focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/10"
                />
                <button type="button" onClick={() => setMostrarSenha(v => !v)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/45 transition hover:text-white">
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {erro && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{erro}</p>}
            <button type="submit" disabled={enviando} className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-white font-extrabold text-black transition hover:bg-[#e4f900] disabled:cursor-not-allowed disabled:opacity-50">
              {enviando ? 'Entrando...' : 'Acessar painel'} <ArrowRight size={17} />
            </button>
          </form>
          <div className="mt-7 flex items-center justify-center gap-2 text-center text-xs leading-5 text-white/40">
            <LockKeyhole size={14} /> Acesso exclusivo a colaboradores autorizados.
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/10 pt-6 text-[11px] text-white/35">
            <ShieldCheck size={15} className="text-[#e2f500]" /> Sua sessão é protegida pelo SCC Produção.
          </div>
        </section>
      </div>
    </main>
  )
}
