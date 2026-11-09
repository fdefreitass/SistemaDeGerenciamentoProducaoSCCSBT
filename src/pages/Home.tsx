import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, ArrowUpRight, CheckCircle2, Clapperboard, Clock3, FolderOpen, Layers3, RefreshCcw, Search } from 'lucide-react'
import { demoMateriais, demoSecoes } from '../data/demo'
import { modoDemo } from '../lib/supabase'
import { useCoresSecoes, corDaSecao } from '../lib/coresSecoes'
import { listarDados } from '../services/materiais'
import type { Material, Secao } from '../types/materiais'
import { useAuth } from '../context/AuthContext'

const descricoesStatus: Record<string, string> = {
  em_dia: 'Em dia',
  precisa_atualizar: 'Precisa atualizar',
  precisa_gravar: 'Precisa gravar',
  em_producao: 'Em produção',
  aguardando_aprovacao: 'Aguardando aprovação',
  pronto_para_envio: 'Pronto para envio',
}

export default function Home() {
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const { cores } = useCoresSecoes()
  const [materiais, setMateriais] = useState<Material[]>(modoDemo ? demoMateriais : [])
  const [secoes, setSecoes] = useState<Secao[]>(modoDemo ? demoSecoes : [])
  const [carregando, setCarregando] = useState(!modoDemo)
  const [erro, setErro] = useState('')
  const [pesquisa, setPesquisa] = useState('')

  useEffect(() => {
    if (modoDemo) return
    let ativo = true
    listarDados().then(dados => {
      if (!ativo) return
      setMateriais(dados.materiais)
      setSecoes(dados.secoes)
    }).catch(() => {
      if (ativo) setErro('Não foi possível carregar os indicadores. Confira a conexão e suas permissões.')
    }).finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  const contagem = useMemo(() => ({
    total: materiais.length,
    uso: materiais.filter(m => m.status_grade === 'em_utilizacao').length,
    atualizar: materiais.filter(m => m.status_producao === 'precisa_atualizar').length,
    gravar: materiais.filter(m => m.status_producao === 'precisa_gravar').length,
  }), [materiais])

  function pesquisar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    navigate(`/conteudos?busca=${encodeURIComponent(pesquisa.trim())}`)
  }

  return (
    <main className="scc-fluid-content pb-20 pt-7">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[clamp(34px,4vw,54px)] font-extrabold tracking-[-.055em]">Tudo sob controle<span className="text-[#dfff00]">.</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
            {perfil?.nome ? `Olá, ${perfil.nome}. ` : ''}Uma visão clara dos conteúdos e demandas da programação do SCC SBT.
          </p>
        </div>
        <Link to="/conteudos" className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-[#ddf900] px-6 text-sm font-extrabold text-black transition hover:bg-[#edff71]">
          Abrir central de materiais <ArrowUpRight size={17} />
        </Link>
      </div>

      {modoDemo && <p className="mt-7 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-semibold text-amber-300">Demonstração local: alterações não persistidas no servidor.</p>}
      {erro && <p role="alert" className="mt-7 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{erro}</p>}

      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { nome: 'Materiais cadastrados', numero: contagem.total, cor: '#ddf900', Icone: Layers3, rota: '/conteudos' },
          { nome: 'Em utilização', numero: contagem.uso, cor: '#49d9ad', Icone: CheckCircle2, rota: '/conteudos?filtro=uso' },
          { nome: 'Precisam atualizar', numero: contagem.atualizar, cor: '#b28aff', Icone: RefreshCcw, rota: '/conteudos?filtro=atualizar' },
          { nome: 'Precisam gravar', numero: contagem.gravar, cor: '#ff9861', Icone: Clapperboard, rota: '/conteudos?filtro=gravar' },
        ].map(kpi => (
          <Link key={kpi.nome} to={kpi.rota} className="scc-glass-panel group relative overflow-hidden rounded-[22px] border border-white/[0.085] bg-[#1f1f1f] p-6 transition duration-200 hover:-translate-y-1 hover:border-white/25 hover:bg-[#292929]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold text-white/50">{kpi.nome}</p>
              <kpi.Icone size={19} style={{ color: kpi.cor }} />
            </div>
            <p className="mt-6 text-[44px] font-extrabold leading-none tabular-nums tracking-tight">{carregando ? '—' : kpi.numero}</p>
            <div className="mt-7 flex items-center justify-between">
              <span className="h-[3px] w-12 rounded-full" style={{ backgroundColor: kpi.cor }} />
              <ArrowUpRight size={16} className="text-white/25 transition group-hover:text-white" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-white/35">ORGANIZAÇÃO DE CONTEÚDO</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Programas e seções</h2>
          <p className="mt-1.5 text-xs text-white/45">Cada seção reúne os materiais da sua produção.</p>
        </div>
        <Link to="/conteudos" className="flex items-center gap-2 text-xs font-bold text-[#e2fa4a] hover:text-white">Gerenciar seções <ArrowRight size={15} /></Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {carregando ? <p className="col-span-full py-10 text-sm text-white/45">Carregando seções...</p> : secoes.length ? secoes.map((secao, indice) => {
          const cor = corDaSecao(cores, secao.id, indice)
          const itens = materiais.filter(m => m.secao_id === secao.id)
          const emUso = itens.filter(m => m.status_grade === 'em_utilizacao').length
          return (
            <Link key={secao.id} to={`/conteudos?busca=${encodeURIComponent(secao.nome)}`} className="scc-glass-panel group relative overflow-hidden rounded-[22px] border border-white/[0.085] bg-[#1f1f1f] p-6 transition hover:-translate-y-1 hover:border-white/25">
              <span className="absolute inset-x-0 top-0 h-[5px]" style={{ backgroundColor: cor }} />
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/30" style={{ color: cor }}>
                  <FolderOpen size={22} strokeWidth={1.8}/>
                </span>
                <ArrowUpRight size={18} className="text-white/30 transition group-hover:text-white" />
              </div>
              <h3 className="mt-6 truncate text-[18px] font-bold">{secao.nome}</h3>
              <p className="mt-2 text-xs text-white/40">{itens.length} {itens.length === 1 ? 'material cadastrado' : 'materiais cadastrados'}</p>
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4 text-[11px] text-white/45">
                <span>{emUso} em utilização</span>
                <span className="font-semibold" style={{ color: cor }}>Abrir seção <ArrowRight size={12} className="ml-1 inline" /></span>
              </div>
            </Link>
          )
        }) : (
          <div className="scc-glass-panel col-span-full rounded-2xl border border-dashed border-white/15 bg-[#1f1f1f] px-6 py-12 text-center">
            <FolderOpen size={32} className="mx-auto text-white/25"/>
            <p className="mt-4 text-sm font-semibold">Nenhuma seção cadastrada</p>
            <p className="mt-2 text-xs text-white/40">Crie sua primeira seção na Central de Materiais.</p>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.65fr_1fr]">
        <section className="scc-glass-panel rounded-[24px] border border-white/[.085] bg-[#1f1f1f]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-6 py-5">
            <div>
              <h2 className="text-lg font-bold">Materiais em destaque</h2>
              <p className="mt-1 text-xs text-white/40">Visão rápida dos registros cadastrados.</p>
            </div>
            <Link to="/conteudos" className="flex items-center gap-1 text-xs font-bold text-[#e2fa4a] hover:text-white">Ver todos <ArrowRight size={14}/></Link>
          </div>
          {carregando ? <p className="px-6 py-12 text-sm text-white/45">Carregando materiais...</p> : materiais.length ? (
            <div className="divide-y divide-white/[0.055]">
              {materiais.slice(0, 5).map(material => (
                <div key={material.id} className="flex items-center gap-3 px-6 py-4 transition hover:bg-white/[0.025]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[.05] text-[#e2fa4a]"><Clapperboard size={18}/></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white/85">{material.titulo}</p>
                    <p className="mt-1 text-[11px] text-white/40">{secoes.find(s => s.id === material.secao_id)?.nome ?? 'Seção'} · {material.codigo} · {material.duracao_segundos}s</p>
                  </div>
                  <span className="hidden shrink-0 rounded-lg border border-white/10 bg-black/15 px-2.5 py-2 text-[11px] text-white/60 sm:block">{descricoesStatus[material.status_producao] ?? material.status_producao}</span>
                </div>
              ))}
            </div>
          ) : <p className="px-6 py-12 text-center text-sm text-white/40">Nenhum material cadastrado.</p>}
        </section>
        <section className="scc-glass-panel flex flex-col rounded-[24px] border border-white/[.085] bg-[#1f1f1f] p-6">
          <h2 className="text-lg font-bold">Acesso rápido</h2>
          <p className="mt-1 text-xs text-white/40">Encontre exatamente o que precisa.</p>
          <form onSubmit={pesquisar} className="mt-6 flex gap-2">
            <label htmlFor="pesquisa-dashboard" className="sr-only">Buscar material</label>
            <input id="pesquisa-dashboard" value={pesquisa} onChange={e => setPesquisa(e.target.value)} placeholder="Buscar material..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#050505] px-3.5 py-3 text-sm outline-none focus:border-[#e2fa4a]/50" />
            <button type="submit" aria-label="Pesquisar" className="rounded-xl bg-white px-3.5 text-black transition hover:bg-[#e2fa4a]"><Search size={19}/></button>
          </form>
          <div className="mt-6 space-y-2">
            {[
              { rota: '/gravacao', nome: 'Gravação', Icone: Clapperboard },
              { rota: '/atualizacao', nome: 'Atualização', Icone: RefreshCcw },
              { rota: '/remocao', nome: 'Remoção', Icone: Clock3 },
            ].map(item => (
              <Link key={item.rota} to={item.rota} className="flex items-center gap-3 rounded-xl border border-white/[.08] bg-[#171717] p-3.5 text-sm text-white/70 transition hover:border-white/20 hover:text-white">
                <item.Icone size={17} className="text-[#e2fa4a]"/><span className="flex-1">{item.nome}</span><ArrowRight size={15} className="text-white/30"/>
              </Link>
            ))}
          </div>
          <p className="mt-auto pt-7 text-[11px] leading-5 text-white/30">Os dados exibidos respeitam as permissões do usuário conectado.</p>
        </section>
      </div>
      <footer className="mt-11 flex items-center justify-between border-t border-white/[0.06] pt-6 text-[11px] text-white/25">
        <span>SCC Produção · SCC SBT</span>
        <span>Gestão de conteúdos</span>
      </footer>
    </main>
  )
}
