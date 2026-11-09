import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, CheckCircle2, Clapperboard, FolderOpen, RefreshCcw, ArchiveX } from 'lucide-react'
import { demoMateriais, demoSecoes } from '../data/demo'
import { modoDemo } from '../lib/supabase'
import { listarDados } from '../services/materiais'
import type { Material, Secao } from '../types/materiais'

type ModuloProps = {
  titulo: string
  descricao: string
  cor: string
}

const nomesStatus: Record<string, string> = {
  em_dia: 'Em dia',
  precisa_atualizar: 'Precisa atualizar',
  precisa_gravar: 'Precisa gravar',
  em_producao: 'Em produção',
  aguardando_aprovacao: 'Aguardando aprovação',
  pronto_para_envio: 'Pronto para envio',
  em_utilizacao: 'Em utilização',
  fora_da_grade: 'Fora da grade',
  aguardando_entrada: 'Aguardando entrada',
  removido: 'Removido',
}

export default function Modulo({ titulo, descricao, cor }: ModuloProps) {
  const [materiais, setMateriais] = useState<Material[]>(modoDemo ? demoMateriais : [])
  const [secoes, setSecoes] = useState<Secao[]>(modoDemo ? demoSecoes : [])
  const [carregando, setCarregando] = useState(!modoDemo)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (modoDemo) return
    let ativo = true
    listarDados().then(dados => {
      if (!ativo) return
      setMateriais(dados.materiais)
      setSecoes(dados.secoes)
    }).catch(() => {
      if (ativo) setErro('Não foi possível consultar os materiais deste módulo.')
    }).finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  const Icone = titulo === 'Gravação' ? Clapperboard : titulo === 'Atualização' ? RefreshCcw : ArchiveX

  const itens = useMemo(() => materiais.filter(m => {
    const corresponde = titulo === 'Gravação'
      ? ['precisa_gravar', 'em_producao', 'aguardando_aprovacao'].includes(m.status_producao)
      : titulo === 'Atualização'
        ? m.status_producao === 'precisa_atualizar'
        : m.status_grade === 'removido' || m.status_grade === 'fora_da_grade'
    const secao = secoes.find(s => s.id === m.secao_id)
    const termo = `${m.codigo} ${m.titulo} ${secao?.nome ?? ''}`.toLocaleLowerCase('pt-BR')
    return corresponde && termo.includes(busca.trim().toLocaleLowerCase('pt-BR'))
  }), [materiais, secoes, titulo, busca])

  const rotaCentral = titulo === 'Gravação'
    ? '/conteudos?filtro=gravar'
    : titulo === 'Atualização'
      ? '/conteudos?filtro=atualizar'
      : '/conteudos'

  return (
    <main className="scc-fluid-content pb-20 pt-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-white/45">FLUXO DE PRODUÇÃO · SCC SBT</p>
          <h1 className="mt-4 flex items-center gap-3 text-[clamp(34px,4vw,54px)] font-extrabold tracking-[-.055em]">
            <span style={{ color: cor }}><Icone size={35} strokeWidth={1.8}/></span>{titulo}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/50">{descricao}</p>
        </div>
        <Link to={rotaCentral} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-[#e2fa00]">
          Central de Materiais <ArrowUpRight size={17}/>
        </Link>
      </div>

      {erro && <p role="alert" className="mt-7 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{erro}</p>}
      <div className="mt-9 grid gap-4 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-bg-[#050505] p-6">
          <div className="absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: cor }}/>
          <span className="text-xs font-semibold text-white/50">Materiais nesta etapa</span>
          <p className="mt-5 text-4xl font-extrabold tabular-nums">{carregando ? '—' : itens.length}</p>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-bg-[#050505] p-6">
          <span className="text-xs font-semibold text-white/50">Seções cadastradas</span>
          <p className="mt-5 text-4xl font-extrabold tabular-nums">{carregando ? '—' : secoes.length}</p>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-bg-[#050505] p-6">
          <span className="text-xs font-semibold text-white/50">Materiais na central</span>
          <p className="mt-5 text-4xl font-extrabold tabular-nums">{carregando ? '—' : materiais.length}</p>
        </div>
      </div>

      <section className="mt-8 overflow-hidden rounded-[24px] border border-white/10 bg-bg-[#050505]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[.08] px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">Materiais relacionados</h2>
            <p className="mt-1 text-xs text-white/40">Visualização da etapa atual, com dados da sua Central de Materiais.</p>
          </div>
          <label className="sr-only" htmlFor="busca-modulo">Pesquisar materiais</label>
          <input id="busca-modulo" type="search" placeholder="Pesquisar nesta etapa..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full rounded-xl border border-white/10 bg-bg-[#050505] px-4 py-3 text-sm outline-none focus:border-white/30 sm:max-w-68" />
        </div>
        {carregando ? (
          <p className="p-10 text-center text-sm text-white/45">Carregando dados...</p>
        ) : itens.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <CheckCircle2 size={32} style={{ color: cor }} />
            <h3 className="mt-4 text-sm font-bold">Nenhum material encontrado</h3>
            <p className="mt-2 max-w-sm px-6 text-xs leading-5 text-white/40">Não há materiais correspondentes nesta etapa e pesquisa.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[.065]">
            {itens.map(m => {
              const secao = secoes.find(s => s.id === m.secao_id)
              return (
                <div key={m.id} className="flex flex-wrap items-center gap-4 px-6 py-5 transition hover:bg-white/[.025]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30" style={{ color: cor }}><FolderOpen size={19}/></span>
                  <div className="min-w-0 flex-1 basis-50">
                    <p className="truncate text-sm font-semibold">{m.titulo}</p>
                    <p className="mt-1 text-[11px] text-white/45">{secao?.nome ?? 'Seção'} · {m.codigo} · {m.duracao_segundos}s</p>
                  </div>
                  <span className="rounded-lg border border-white/10 bg-bg-[#050505] px-3 py-2 text-[11px] text-white/65">{nomesStatus[m.status_producao] ?? m.status_producao}</span>
                  <Link to={`/conteudos?busca=${encodeURIComponent(m.codigo)}`} className="flex items-center gap-1.5 text-xs font-semibold hover:text-white" style={{ color: cor }}>Ver na central <ArrowRight size={15}/></Link>
                </div>
              )
            })}
          </div>
        )}
      </section>
      <p className="mt-8 text-xs text-white/35">Os ajustes de status continuam disponíveis na Central de Materiais, conforme as permissões de cada usuário.</p>
    </main>
  )
}
