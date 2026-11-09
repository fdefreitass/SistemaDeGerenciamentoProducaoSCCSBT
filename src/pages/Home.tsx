import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight, ArrowUpRight, ArchiveX, CheckCircle2, Clapperboard,
  Clock3, LibraryBig, RefreshCcw, ShieldCheck, Activity, Layers3,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { demoMateriais, demoSecoes } from '../data/demo'
import { modoDemo } from '../lib/supabase'
import { listarDados } from '../services/materiais'
import type { Material, Secao } from '../types/materiais'

const modulos = [
  { rota: '/conteudos', titulo: 'Central de materiais', descricao: 'Organize e acompanhe os conteúdos', cor: 'blue', Icone: LibraryBig },
  { rota: '/gravacao', titulo: 'Gravações', descricao: 'Demandas e produções em andamento', cor: 'orange', Icone: Clapperboard },
  { rota: '/atualizacao', titulo: 'Atualizações', descricao: 'Mantenha as chamadas sempre atuais', cor: 'purple', Icone: RefreshCcw },
  { rota: '/remocao', titulo: 'Remoções', descricao: 'Controle o que saiu da grade', cor: 'pink', Icone: ArchiveX },
] as const

const nomeStatus: Record<string, string> = {
  em_utilizacao: 'Em utilização',
  fora_da_grade: 'Fora da grade',
  aguardando_entrada: 'Aguardando entrada',
  removido: 'Removido',
  em_dia: 'Em dia',
  precisa_atualizar: 'Precisa atualizar',
  precisa_gravar: 'Precisa gravar',
  em_producao: 'Em produção',
  aguardando_aprovacao: 'Aguardando aprovação',
  pronto_para_envio: 'Pronto para envio',
}

export default function Home() {
  const { perfil } = useAuth()
  const [materiais, setMateriais] = useState<Material[]>(modoDemo ? demoMateriais : [])
  const [secoes, setSecoes] = useState<Secao[]>(modoDemo ? demoSecoes : [])
  const [carregando, setCarregando] = useState(!modoDemo)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (modoDemo) return
    let ativo = true
    listarDados()
      .then(dados => {
        if (!ativo) return
        setMateriais(dados.materiais)
        setSecoes(dados.secoes)
      })
      .catch(() => { if (ativo) setErro('Não foi possível carregar os indicadores. Confira sua conexão e suas permissões.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  const totais = useMemo(() => ({
    todos: materiais.length,
    grade: materiais.filter(m => m.status_grade === 'em_utilizacao').length,
    atualizacao: materiais.filter(m => m.status_producao === 'precisa_atualizar').length,
    gravacao: materiais.filter(m => m.status_producao === 'precisa_gravar').length,
    remocao: materiais.filter(m => m.status_grade === 'removido' || m.status_grade === 'fora_da_grade').length,
  }), [materiais])

  const recentes = materiais.slice(-5).reverse()
  const taxa = totais.todos ? Math.round(totais.grade / totais.todos * 100) : 0

  return (
    <div className="scc-page mx-auto max-w-[1500px] px-5 py-8 md:px-9 md:py-11">
      <div className="mb-9 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,.5)]" />
            <span className="scc-eyebrow">CENTRAL DE PRODUÇÃO · SCC SBT</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-[42px]">
            Visão geral<span className="text-blue-400">.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/45 md:text-base">
            Acompanhe a situação dos materiais, identifique pendências e mantenha a operação organizada em um só lugar.
          </p>
          {perfil?.nome && <p className="mt-3 text-xs text-white/35">Bem-vindo, {perfil.nome}.</p>}
        </div>
        <Link to="/conteudos" className="scc-primary flex items-center gap-2">
          Explorar materiais <ArrowUpRight size={16} />
        </Link>
      </div>

      {modoDemo && <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs font-semibold text-amber-300">Demonstração local: dados de exemplo não persistidos.</div>}
      {erro && <div role="alert" className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{erro}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { titulo: 'Total de materiais', valor: totais.todos, Icone: Layers3, tom: 'blue' },
          { titulo: 'Em utilização', valor: totais.grade, Icone: CheckCircle2, tom: 'green' },
          { titulo: 'Precisam atualizar', valor: totais.atualizacao, Icone: RefreshCcw, tom: 'purple' },
          { titulo: 'Precisam gravar', valor: totais.gravacao, Icone: Clapperboard, tom: 'orange' },
        ].map(info => (
          <div key={info.titulo} className="scc-panel group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:border-white/20 md:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/50">{info.titulo}</span>
              <span className={`scc-icon scc-icon-${info.tom}`}><info.Icone size={18} strokeWidth={1.8} /></span>
            </div>
            <div className="mt-4 text-[38px] font-extrabold tracking-tight tabular-nums">{carregando ? '—' : info.valor}</div>
            <div className="mt-4 h-px bg-white/[0.07]" />
            <p className="mt-3 text-[11px] text-white/35">Informações dos materiais cadastrados</p>
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="scc-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-6 py-6">
            <div>
              <p className="scc-eyebrow">CONTROLE OPERACIONAL</p>
              <h2 className="mt-2 text-lg font-bold">Visão dos materiais</h2>
            </div>
            <Link to="/conteudos" className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300">
              Ver todos <ArrowRight size={15} />
            </Link>
          </div>
          {carregando ? (
            <p className="px-6 py-10 text-sm text-white/40">Carregando materiais...</p>
          ) : recentes.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <LibraryBig className="mx-auto mb-4 text-white/25" size={34} />
              <p className="font-semibold text-white/75">Nenhum material cadastrado</p>
              <p className="mt-2 text-xs text-white/40">Os materiais aparecerão aqui quando forem adicionados à central.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.055]">
              {recentes.map(material => (
                <div key={material.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.025]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300"><Clapperboard size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white/85">{material.titulo}</p>
                    <p className="mt-1 truncate text-[11px] text-white/40">
                      {secoes.find(s => s.id === material.secao_id)?.nome ?? 'Seção'} · {material.codigo} · {material.duracao_segundos}s
                    </p>
                  </div>
                  <span className="hidden rounded-lg border border-white/[0.09] bg-white/[0.035] px-2.5 py-1.5 text-[10px] font-semibold text-white/60 sm:inline">
                    {nomeStatus[material.status_producao] ?? material.status_producao}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="scc-panel flex flex-col p-6">
          <p className="scc-eyebrow">PANORAMA DA GRADE</p>
          <h2 className="mt-2 text-lg font-bold">Situação operacional</h2>
          <div className="mt-8 flex items-center gap-5">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#4d8bff ${taxa}%,rgba(255,255,255,.07) ${taxa}% 100%)` }}>
              <div className="flex h-23 w-23 flex-col items-center justify-center rounded-full bg-[#121925]">
                <strong className="text-2xl font-extrabold">{carregando ? '—' : `${taxa}%`}</strong>
                <small className="text-[10px] text-white/40">em uso</small>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Materiais na grade</p>
              <p className="mt-2 text-xs leading-5 text-white/40">Proporção dos materiais cadastrados que estão em utilização.</p>
            </div>
          </div>
          <div className="mt-8 space-y-4 border-t border-white/[0.07] pt-6">
            {[
              { nome: 'Em utilização', valor: totais.grade, cor: 'bg-blue-400' },
              { nome: 'Fora da grade / removidos', valor: totais.remocao, cor: 'bg-pink-400' },
              { nome: 'Total de seções', valor: secoes.length, cor: 'bg-violet-400' },
            ].map(item => (
              <div key={item.nome} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2.5 text-white/55"><i className={`h-2 w-2 rounded-full ${item.cor}`} />{item.nome}</span>
                <strong className="tabular-nums text-white/85">{carregando ? '—' : item.valor}</strong>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-9">
            <p className="flex items-center gap-2 text-[11px] text-white/35"><ShieldCheck size={14} /> Indicadores calculados com base nos registros acessíveis.</p>
          </div>
        </section>
      </div>

      <section className="mt-7">
        <div className="mb-5 flex items-center gap-3">
          <Activity size={17} className="text-blue-400" />
          <h2 className="text-base font-bold">Acesso rápido</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modulos.map(({ rota, titulo, descricao, cor, Icone }) => (
            <Link key={rota} to={rota} className="scc-panel group flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-white/20">
              <span className={`scc-icon scc-icon-${cor}`}><Icone size={20} strokeWidth={1.8} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white/90">{titulo}</p>
                <p className="mt-2 text-xs leading-5 text-white/40">{descricao}</p>
              </div>
              <ArrowUpRight size={15} className="mt-1 shrink-0 text-white/25 transition-colors group-hover:text-blue-400" />
            </Link>
          ))}
        </div>
      </section>
      <footer className="mt-12 flex items-center justify-between border-t border-white/[0.06] pt-6 text-[11px] text-white/25">
        <span>SCC Produção · SCC SBT</span><span className="flex items-center gap-1.5"><Clock3 size={12} /> Gestão de materiais</span>
      </footer>
    </div>
  )
}
