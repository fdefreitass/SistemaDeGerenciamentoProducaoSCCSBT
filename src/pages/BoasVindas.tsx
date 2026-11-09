import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, LockKeyhole, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { modoDemo } from '../lib/supabase'
import logoBranca from '../assets/SCC SBT BRANCA.png'
import laco from '../assets/LAÇO_COLORIDO.png'
import apresentador from '../assets/APRESENTADOR_AVIÃO.png'

export default function BoasVindas() {
  const { email, perfil } = useAuth()
  const autorizado = modoDemo || Boolean(email && perfil?.ativo && perfil.troca_senha_pendente === false)
  const destino = autorizado ? '/painel' : '/login'

  return (
    <main className="scc-landing min-h-screen overflow-hidden bg-[#030303] text-white">
      <header className="relative z-30 mx-auto flex h-[88px] max-w-[1640px] items-center gap-4 px-5 sm:px-10 lg:px-14">
        <Link to="/" aria-label="Página inicial SCC Produção" className="flex shrink-0 items-center">
          <img src={logoBranca} alt="SCC SBT" className="h-[42px] w-auto max-w-[112px] object-contain" />
        </Link>
        <div className="mx-auto hidden h-[46px] w-full max-w-[920px] items-center justify-center rounded-2xl border border-white/[0.05] bg-[#161616] text-[12px] font-extrabold tracking-[.12em] text-white/90 md:flex">
          PRODUÇÃO SCC SBT
        </div>
        <Link to={destino} className="ml-auto inline-flex h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-extrabold text-black transition hover:bg-white/85 sm:px-7">
          {autorizado ? 'ACESSAR PAINEL' : 'EFETUAR LOGIN'} <ArrowUpRight size={15} />
        </Link>
      </header>

      <section className="scc-landing-stage relative mx-auto max-w-[1640px]" aria-label="Boas-vindas ao SCC Produção">
        <div className="scc-landing-stage-glow" aria-hidden="true" />
        <img src={laco} alt="" className="scc-landing-ribbon pointer-events-none absolute select-none" draggable={false} />
        <div className="scc-landing-intro relative z-10">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.23em] text-white/60">
            <Sparkles size={14} className="text-[#e8f500]" /> Um novo jeito de produzir
          </div>
          <h1 className="max-w-[720px] text-[clamp(38px,4.9vw,78px)] font-black leading-[1.02] tracking-[-.065em]">
            SEJA BEM-VINDO<span className="text-[#e7fa00]">!</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-[clamp(13px,1.18vw,16px)] leading-relaxed text-white/65">
            Seu espaço para o controle de demandas, a gestão de conteúdos
            e a integração entre os setores do SCC SBT.
          </p>
        </div>

        <div className="scc-landing-programs relative z-20" aria-label="Programas em destaque">
          <Link to="/conteudos?busca=SCC%20NEWS" className="scc-showcase-card scc-news-card scc-landing-card-news" aria-label="Consultar SCC News">
            <span className="scc-news-deco" aria-hidden="true" />
            <span className="scc-news-logo"><strong>SCC</strong><em>NEWS</em></span>
            <span className="scc-card-hint">Ver conteúdos <ArrowRight size={14}/></span>
          </Link>
          <Link to="/conteudos?busca=SCC%20MEIO-DIA" className="scc-showcase-card scc-meiodia-card scc-landing-card-meiodia" aria-label="Consultar SCC Meio-Dia">
            <span className="scc-meiodia-top">SCC</span>
            <span className="scc-meiodia-logo">MEI<span className="scc-sol">O</span>DIA</span>
            <span className="scc-card-hint">Ver conteúdos <ArrowRight size={14}/></span>
          </Link>
          <Link to="/conteudos?busca=QUESO" className="scc-showcase-card scc-queso-card scc-landing-card-queso" aria-label="Consultar A Tarde é Queso">
            <span className="scc-queso-sparks" aria-hidden="true">✦ · ✧</span>
            <span className="scc-queso-top">A TARDE É</span>
            <span className="scc-queso-logo"><b>Q</b><b>U</b><b>E</b><b>S</b><b>O</b></span>
            <span className="scc-card-hint">Ver conteúdos <ArrowRight size={14}/></span>
          </Link>
        </div>

        <img src={apresentador} alt="Personagem ilustrado do SCC SBT" className="scc-landing-host pointer-events-none absolute z-10 select-none" draggable={false} />

        <Link to={destino} className="scc-landing-cta absolute z-20 inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-black/65 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-lg transition hover:border-[#d9fb00]/65 hover:bg-[#161616]">
          {autorizado ? <ArrowRight size={17} className="text-[#e7fa00]" /> : <LockKeyhole size={17} className="text-[#e7fa00]" />}
          {autorizado ? 'Continuar para a gestão' : 'Acessar sistema de produção'}
          <ArrowRight size={16} className="text-white/55" />
        </Link>
      </section>
      <footer className="relative z-10 mx-auto flex max-w-[1640px] items-center justify-between gap-3 border-t border-white/[.07] px-6 py-5 text-[11px] text-white/30 sm:px-12">
        <span>SCC Produção · Tecnologia a serviço da nossa equipe.</span>
        <span className="hidden sm:inline">SCC SBT · Santa Catarina</span>
      </footer>
    </main>
  )
}
