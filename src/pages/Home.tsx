import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Clapperboard, Film, Layers3, RefreshCcw, ArchiveX, CheckCircle2 } from 'lucide-react'
import { demoMateriais, demoSecoes } from '../data/demo'
import { modoDemo } from '../lib/supabase'
import { listarDados } from '../services/materiais'
import type { Material, Secao } from '../types/materiais'

export default function Home() {
  const [materiais, setMateriais] = useState<Material[]>(modoDemo ? demoMateriais : [])
  const [secoes, setSecoes] = useState<Secao[]>(modoDemo ? demoSecoes : [])
  const [carregando, setCarregando] = useState(!modoDemo)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (modoDemo) return
    let ativo = true
    listarDados().then(dados => {
      if (!ativo) return
      setMateriais(dados.materiais)
      setSecoes(dados.secoes)
    }).catch(() => {
      if (ativo) setErro('Não foi possível consultar os indicadores da produção.')
    }).finally(() => {
      if (ativo) setCarregando(false)
    })
    return () => { ativo = false }
  }, [])

  const contagem = useMemo(() => ({
    total: materiais.length,
    emGrade: materiais.filter(item => item.status_grade === 'em_utilizacao').length,
    atualizar: materiais.filter(item => item.status_producao === 'precisa_atualizar').length,
    gravar: materiais.filter(item => item.status_producao === 'precisa_gravar').length,
    remover: materiais.filter(item => item.status_grade === 'removido' || item.status_grade === 'fora_da_grade').length,
  }), [materiais])

  return (
    <main>
      <section className="scc-showcase relative isolate mx-auto max-w-[1760px] overflow-hidden" aria-labelledby="boas-vindas">
        <div className="scc-showcase-glow" aria-hidden="true" />
        <svg className="scc-spectrum pointer-events-none absolute" viewBox="0 0 1680 690" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <linearGradient id="faixa-scc" x1="0" y1="0.8" x2="1" y2="0.1">
              <stop offset="0%" stopColor="#f7559f" />
              <stop offset="14%" stopColor="#ff8a00" />
              <stop offset="28%" stopColor="#ee0785" />
              <stop offset="43%" stopColor="#7c22db" />
              <stop offset="56%" stopColor="#2059e8" />
              <stop offset="68%" stopColor="#00a9c9" />
              <stop offset="80%" stopColor="#30c755" />
              <stop offset="92%" stopColor="#bde50e" />
              <stop offset="100%" stopColor="#ffde00" />
            </linearGradient>
            <filter id="faixa-brilho" x="-15%" y="-35%" width="130%" height="170%">
              <feGaussianBlur stdDeviation="27" />
            </filter>
          </defs>
          <path
            d="M -140 455 C -30 590 125 738 258 606 C 365 500 364 341 461 404 C 566 473 591 674 705 637 C 850 592 807 165 987 140 C 1140 119 1120 436 1194 428 C 1312 413 1386 173 1790 269"
            fill="none" stroke="url(#faixa-scc)" strokeWidth="144" strokeLinecap="round" opacity=".35" filter="url(#faixa-brilho)"
          />
          <path
            d="M -140 455 C -30 590 125 738 258 606 C 365 500 364 341 461 404 C 566 473 591 674 705 637 C 850 592 807 165 987 140 C 1140 119 1120 436 1194 428 C 1312 413 1386 173 1790 269"
            fill="none" stroke="url(#faixa-scc)" strokeWidth="113" strokeLinecap="round"
          />
        </svg>

        <div className="scc-showcase-content relative z-10 mx-auto w-full max-w-[1270px] px-7 sm:px-12">
          <p className="scc-showcase-eyebrow">BEM-VINDO AO SEU ESPAÇO DE PRODUÇÃO</p>
          <h1 id="boas-vindas" className="scc-showcase-heading">SEJA BEM-VINDO!</h1>
          <p className="scc-showcase-description">
            Esse espaço foi projetado para o controle de demandas, gestão de conteúdos
            e para melhorar a integração entre os setores do SCC SBT!
          </p>
        </div>

        <div className="scc-showcase-cards relative z-20 mx-auto max-w-[1250px]">
          <Link className="scc-showcase-card scc-news-card" to="/conteudos?busca=SCC%20NEWS" aria-label="Ver materiais de SCC News">
            <span className="scc-news-deco" aria-hidden="true" />
            <span className="scc-news-logo"><strong>SCC</strong><em>NEWS</em></span>
            <span className="scc-card-hint">Explorar materiais <ArrowRight size={14} /></span>
          </Link>
          <Link className="scc-showcase-card scc-meiodia-card" to="/conteudos?busca=SCC%20MEIO-DIA" aria-label="Ver materiais do SCC Meio-Dia">
            <span className="scc-meiodia-top">SCC</span>
            <span className="scc-meiodia-logo">MEI<span className="scc-sol">O</span>DIA</span>
            <span className="scc-card-hint">Explorar materiais <ArrowRight size={14} /></span>
          </Link>
          <Link className="scc-showcase-card scc-queso-card" to="/conteudos?busca=QUESO" aria-label="Buscar materiais de A tarde é Queso">
            <span className="scc-queso-sparks" aria-hidden="true">✦ · ✧</span>
            <span className="scc-queso-top">A TARDE É</span>
            <span className="scc-queso-logo"><b>Q</b><b>U</b><b>E</b><b>S</b><b>O</b></span>
            <span className="scc-card-hint">Explorar materiais <ArrowRight size={14} /></span>
          </Link>
        </div>

        <div className="scc-showcase-signature" aria-hidden="true">
          <div className="scc-showcase-mark">SCC<span>SBT</span></div>
          <div className="scc-showcase-mark-sub">A TV MAIS QUERIDA DE SANTA CATARINA</div>
        </div>
      </section>

      <section className="scc-home-lower mx-auto max-w-[1460px] px-5 pb-20 pt-9 sm:px-9" aria-label="Painel operacional">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-400">CENTRAL OPERACIONAL</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Sua produção em um só lugar.</h2>
            <p className="mt-2 text-sm text-white/45">Indicadores calculados com os materiais que você já cadastrou.</p>
          </div>
          <Link to="/conteudos" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10">
            Abrir central de materiais <ArrowRight size={16} />
          </Link>
        </div>

        {erro && <p className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300" role="alert">{erro}</p>}
        {modoDemo && <p className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">Demonstração local: as alterações não são persistidas.</p>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Materiais cadastrados', numero: contagem.total, Icone: Layers3, cor: 'text-blue-400' },
            { label: 'Em utilização', numero: contagem.emGrade, Icone: CheckCircle2, cor: 'text-green-400' },
            { label: 'Precisam atualizar', numero: contagem.atualizar, Icone: RefreshCcw, cor: 'text-violet-400' },
            { label: 'Precisam gravar', numero: contagem.gravar, Icone: Clapperboard, cor: 'text-orange-400' },
          ].map(indicador => (
            <div key={indicador.label} className="scc-stat-card group">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-white/55">{indicador.label}</p>
                <indicador.Icone size={19} className={indicador.cor} />
              </div>
              <p className="mt-6 text-4xl font-extrabold tracking-tight tabular-nums">{carregando ? '—' : indicador.numero}</p>
              <div className="mt-6 h-1 w-10 rounded-full bg-white/15 transition-all group-hover:w-16 group-hover:bg-blue-400/60" />
            </div>
          ))}
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="scc-stat-card">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold">Programas e seções</h3>
              <Film size={19} className="text-blue-400" />
            </div>
            <p className="mt-2 text-xs text-white/40">Acesse os conteúdos organizados na Central de Materiais.</p>
            {carregando ? <p className="mt-8 text-sm text-white/40">Carregando seções...</p> : secoes.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {secoes.map(secao => (
                  <Link key={secao.id} to={`/conteudos?busca=${encodeURIComponent(secao.nome)}`} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold transition hover:border-blue-400/35 hover:bg-blue-400/10">
                    {secao.nome}
                  </Link>
                ))}
              </div>
            ) : <p className="mt-7 text-sm text-white/35">Nenhuma seção cadastrada ainda.</p>}
          </div>
          <div className="scc-stat-card flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold">Fluxo de produção</h3>
              <p className="mt-2 text-xs text-white/40">Acompanhe gravações, atualizações e remoções.</p>
            </div>
            <div className="mt-6 grid gap-2">
              {[
                { to: '/gravacao', titulo: 'Gravação', Icone: Clapperboard },
                { to: '/atualizacao', titulo: 'Atualização', Icone: RefreshCcw },
                { to: '/remocao', titulo: 'Remoção', Icone: ArchiveX },
              ].map(item => (
                <Link key={item.to} to={item.to} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75 transition hover:bg-white/10">
                  <item.Icone size={17} className="text-blue-400" />
                  <span className="flex-1">{item.titulo}</span>
                  <ArrowRight size={15} className="text-white/40" />
                </Link>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-[11px] text-white/25">SCC Produção · Gestão de conteúdos e demandas</p>
      </section>
    </main>
  )
}
