import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, LockKeyhole, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { modoDemo } from '../lib/supabase'
import logoBranca from '../assets/SCC SBT BRANCA.png'
import laco from '../assets/LAÇO_COLORIDO.png'
import apresentador from '../assets/APRESENTADOR_AVIÃO.png'
import logoNews from '../assets/SCC-NEWS.png'
import logoMeioDia from '../assets/MEIO-DIA.png'
import logoATarde from '../assets/A-TARDE-E-NOSSA.png'

export default function BoasVindas() {
  const { email, perfil } = useAuth()
  const autorizado = modoDemo || Boolean(email && perfil?.ativo && perfil.troca_senha_pendente === false)
  const destino = autorizado ? '/painel' : '/login'

  return (
    <main className="scc-landing flex min-h-[100svh] flex-col overflow-hidden bg-[#050505] text-white">
      <header className="scc-brand-header relative z-30 flex w-full items-center gap-4">
        <Link to="/" aria-label="Página inicial SCC Produção" className="flex shrink-0 items-center">
          <img src={logoBranca} alt="SCC SBT" className="scc-brand-logo w-auto object-contain" />
        </Link>
        <div className="scc-brand-title mx-auto hidden w-full items-center justify-center rounded-2xl border border-white/[0.05] bg-[#050505] font-extrabold tracking-[.12em] text-white/90 md:flex">
          PRODUÇÃO SCC SBT
        </div>
        <Link to={destino} className="scc-brand-action scc-brand-action-quiet ml-auto inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] text-xs font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/[0.12] hover:text-white">
          {autorizado ? 'ACESSAR PAINEL' : 'EFETUAR LOGIN'} <ArrowUpRight size={15} />
        </Link>
      </header>

      <section className="scc-landing-stage relative isolate w-full flex-1" aria-label="Boas-vindas ao SCC Produção">
        <div className="scc-landing-stage-glow" aria-hidden="true" />
        <img src={laco} alt="" className="scc-landing-ribbon pointer-events-none absolute select-none" draggable={false} />
        <div className="scc-landing-intro absolute z-10">
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

        <div className="scc-landing-programs absolute z-20" aria-label="Programas em destaque">
          <Link to="/conteudos?busca=SCC%20NEWS" className="scc-program-image-link scc-landing-card-news" aria-label="Consultar SCC News">
            <img src={logoNews} alt="SCC News" className="scc-program-image" draggable={false} />
          </Link>
          <Link to="/conteudos?busca=SCC%20MEIO-DIA" className="scc-program-image-link scc-landing-card-meiodia" aria-label="Consultar SCC Meio-Dia">
            <img src={logoMeioDia} alt="SCC Meio-Dia" className="scc-program-image" draggable={false} />
          </Link>
          <Link to="/conteudos?busca=A%20TARDE%20%C3%89%20NOSSA" className="scc-program-image-link scc-landing-card-queso" aria-label="Consultar A Tarde é Nossa">
            <img src={logoATarde} alt="A Tarde é Nossa" className="scc-program-image" draggable={false} />
          </Link>
        </div>

        <img src={apresentador} alt="Personagem ilustrado do SCC SBT" className="scc-landing-host pointer-events-none absolute z-10 select-none" draggable={false} />

        <Link to={destino} className="scc-landing-cta absolute z-20 inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-black/65 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-lg transition hover:border-[#d9fb00]/65 hover:bg-white/[0.05]">
          {autorizado ? <ArrowRight size={17} className="text-[#e7fa00]" /> : <LockKeyhole size={17} className="text-[#e7fa00]" />}
          {autorizado ? 'Continuar para a gestão' : 'Acessar sistema de produção'}
          <ArrowRight size={16} className="text-white/55" />
        </Link>
      </section>
      <footer className="scc-landing-footer relative z-10 flex w-full items-center justify-between gap-3 border-t border-white/[.07] text-[11px] text-white/30">
        <span className="w-full text-center">Todos direitos reservados ao SCC SBT ®</span>
      </footer>
    </main>
  )
}
