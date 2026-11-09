import { useEffect, useState, type FormEvent } from 'react'
import {
  Plus, Search, Palette, Pencil, Check, X, FolderOpen, Copy, Trash2,
  FileVideo2, ShieldAlert, ChevronDown, ArrowUpRight,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'
import laco from '../assets/LAÇO_COLORIDO.png'
import { useCoresSecoes, corDaSecao, paletaSecoes } from '../lib/coresSecoes'
import { useAuth } from '../context/AuthContext'
import { demoMateriais, demoSecoes } from '../data/demo'
import { modoDemo } from '../lib/supabase'
import {
  atualizarMaterial, criarMaterial, criarSecao, excluirMaterial, listarDados, renomearSecao,
} from '../services/materiais'
import {
  statusGrade, statusProducao,
  type Material, type Secao, type StatusGrade, type StatusProducao,
} from '../types/materiais'

type Filtro = 'todos' | 'uso' | 'atualizar' | 'gravar'
type ModoFormulario = 'novo' | 'editar' | 'duplicar'
type Formulario = {
  secao_id: string
  codigo: string
  titulo: string
  duracao_segundos: string
  status_grade: StatusGrade
  status_producao: StatusProducao
  link_externo: string
  observacoes: string
}
type Dialogo = { modo: ModoFormulario; original?: Material }
type Exclusao = { material: Material; etapa: 1 | 2 }

const campo = 'w-full min-w-0 rounded-xl border border-white/15 bg-[#0c0c0d] px-4 py-3 text-sm text-white outline-none transition focus:border-[#ddfa00]/60 disabled:opacity-40'
const rotulo = 'mb-2 block text-xs font-semibold text-white/60'

const formularioInicial = (secao_id: string): Formulario => ({
  secao_id, codigo: '', titulo: '', duracao_segundos: '15',
  status_grade: 'aguardando_entrada', status_producao: 'precisa_gravar',
  link_externo: '', observacoes: '',
})

function contraste(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return r * .299 + g * .587 + b * .114 > 155 ? '#0c0c0c' : '#ffffff'
}

function sugerirCodigo(original: Material, materiais: Material[]) {
  const existentes = new Set(materiais.filter(m => m.secao_id === original.secao_id).map(m => m.codigo))
  for (let n = 2; n < 10000; n++) {
    const sufixo = '-' + n
    const candidato = original.codigo.slice(0, 20 - sufixo.length) + sufixo
    if (!existentes.has(candidato)) return candidato
  }
  return ''
}

function erroAmigavel(erro: unknown, mensagem: string) {
  if (erro && typeof erro === 'object' && 'code' in erro && erro.code === '23505') {
    return 'Esse código já está cadastrado na seção escolhida.'
  }
  return mensagem
}

export default function Conteudos() {
  const { search } = useLocation()
  const { perfil } = useAuth()
  const { cores, definirCor } = useCoresSecoes()
  const podeEditar = modoDemo || perfil?.papel === 'admin' || perfil?.papel === 'editor'
  const administrador = modoDemo || perfil?.papel === 'admin'
  const [secoes, setSecoes] = useState<Secao[]>(modoDemo ? demoSecoes : [])
  const [materiais, setMateriais] = useState<Material[]>(modoDemo ? demoMateriais : [])
  const [abertas, setAbertas] = useState<Record<string, boolean>>({})
  const [busca, setBusca] = useState(() => new URLSearchParams(search).get('busca') ?? '')
  const [filtro, setFiltro] = useState<Filtro>(() => {
    const valor = new URLSearchParams(search).get('filtro')
    return valor === 'uso' || valor === 'atualizar' || valor === 'gravar' ? valor : 'todos'
  })
  const [novaSecao, setNovaSecao] = useState('')
  const [secaoEditando, setSecaoEditando] = useState<string | null>(null)
  const [nomeSecaoEditando, setNomeSecaoEditando] = useState('')
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [formulario, setFormulario] = useState<Formulario>(formularioInicial(''))
  const [exclusao, setExclusao] = useState<Exclusao | null>(null)
  const [confirmacao, setConfirmacao] = useState('')
  const [carregando, setCarregando] = useState(!modoDemo)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(search)
    setBusca(params.get('busca') ?? '')
    const f = params.get('filtro')
    setFiltro(f === 'uso' || f === 'atualizar' || f === 'gravar' ? f : 'todos')
  }, [search])

  useEffect(() => {
    if (modoDemo) return
    let ativo = true
    listarDados().then(dados => {
      if (!ativo) return
      setSecoes(dados.secoes)
      setMateriais(dados.materiais)
    }).catch(() => {
      if (ativo) setErro('Não foi possível carregar os materiais. Verifique sua conexão e permissões.')
    }).finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    if (!dialogo && !exclusao) return
    const aoTeclar = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !salvando) {
        setDialogo(null)
        setExclusao(null)
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [dialogo, exclusao, salvando])

  const mudar = <K extends keyof Formulario>(chave: K, valor: Formulario[K]) => {
    setFormulario(atual => ({ ...atual, [chave]: valor }))
  }

  function novoMaterial() {
    if (!podeEditar || !secoes.length) return
    setFormulario(formularioInicial(secoes[0].id))
    setDialogo({ modo: 'novo' })
    setErro('')
    setSucesso('')
  }

  function abrirMaterial(modo: 'editar' | 'duplicar', material: Material) {
    if (!podeEditar) return
    setFormulario({
      secao_id: material.secao_id,
      codigo: modo === 'duplicar' ? sugerirCodigo(material, materiais) : material.codigo,
      titulo: material.titulo,
      duracao_segundos: String(material.duracao_segundos),
      status_grade: modo === 'duplicar' ? 'aguardando_entrada' : material.status_grade,
      status_producao: modo === 'duplicar' ? 'precisa_gravar' : material.status_producao,
      link_externo: material.link_externo ?? '',
      observacoes: material.observacoes ?? '',
    })
    setDialogo({ modo, original: material })
    setErro('')
    setSucesso('')
  }

  function solicitarExclusao(material: Material) {
    if (!administrador) return
    setExclusao({ material, etapa: 1 })
    setConfirmacao('')
    setErro('')
    setSucesso('')
  }

  async function salvarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!podeEditar || !dialogo || salvando) return
    const entrada = formulario
    const codigo = entrada.codigo.trim()
    const titulo = entrada.titulo.trim()
    const duracao = Number(entrada.duracao_segundos)
    const link = entrada.link_externo.trim() || null
    const observacoes = entrada.observacoes.trim() || null
    if (!secoes.some(s => s.id === entrada.secao_id) ||
        !/^[a-zA-Z0-9._-]{1,20}$/.test(codigo) ||
        titulo.length < 2 || titulo.length > 180 ||
        !Number.isInteger(duracao) || duracao < 1 || duracao > 36000 ||
        (observacoes?.length ?? 0) > 4000) {
      setErro('Revise a seção, o código (até 20 caracteres), o título e a duração.')
      return
    }
    if (link) {
      try {
        if (link.length > 2048 || new URL(link).protocol !== 'https:') throw new Error('invalid URL')
      } catch {
        setErro('O link precisa ser HTTPS e ter até 2048 caracteres.')
        return
      }
    }
    if (materiais.some(m => m.secao_id === entrada.secao_id &&
      m.codigo === codigo && m.id !== (dialogo.modo === 'editar' ? dialogo.original?.id : undefined))) {
      setErro('Já existe um material com esse código na seção escolhida.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      const campos = {
        secao_id: entrada.secao_id, codigo, titulo,
        duracao_segundos: duracao, link_externo: link, observacoes,
        status_grade: entrada.status_grade, status_producao: entrada.status_producao,
      }
      if (dialogo.modo === 'editar' && dialogo.original) {
        const atualizado = modoDemo
          ? { ...dialogo.original, ...campos }
          : await atualizarMaterial(dialogo.original.id, campos)
        setMateriais(atual => atual.map(m => m.id === atualizado.id ? atualizado : m))
        setSucesso('Material atualizado com sucesso.')
      } else {
        const novo: Material = modoDemo
          ? { ...campos, id: crypto.randomUUID() }
          : await criarMaterial(campos)
        setMateriais(atual => [...atual, novo])
        setSucesso(dialogo.modo === 'duplicar' ? 'Material duplicado com um novo código.' : 'Material cadastrado.')
      }
      setAbertas(atual => ({ ...atual, [campos.secao_id]: true }))
      setDialogo(null)
      setBusca('')
      setFiltro('todos')
    } catch (e) {
      setErro(erroAmigavel(e, 'Não foi possível salvar. Verifique as permissões e tente novamente.'))
    } finally {
      setSalvando(false)
    }
  }

  async function atualizarStatus(
    material: Material, chave: 'status_grade' | 'status_producao',
    valor: StatusGrade | StatusProducao,
  ) {
    if (!podeEditar || salvando) return
    setSalvando(true)
    setErro('')
    setSucesso('')
    try {
      const atualizado = modoDemo
        ? { ...material, [chave]: valor }
        : await atualizarMaterial(material.id, { [chave]: valor })
      setMateriais(atual => atual.map(m => m.id === atualizado.id ? atualizado : m))
    } catch {
      setErro('Não foi possível atualizar o status; o valor anterior foi mantido.')
    } finally { setSalvando(false) }
  }

  async function confirmarExclusao() {
    if (!administrador || !exclusao || exclusao.etapa !== 2 || salvando ||
        confirmacao !== exclusao.material.codigo) return
    setSalvando(true)
    setErro('')
    try {
      if (!modoDemo) await excluirMaterial(exclusao.material.id)
      setMateriais(atual => atual.filter(m => m.id !== exclusao.material.id))
      setExclusao(null)
      setConfirmacao('')
      setSucesso('Material excluído. O histórico de auditoria foi preservado.')
    } catch {
      setErro('Não foi possível excluir. É necessário aplicar a migração de exclusão auditável no Supabase e possuir perfil administrador.')
    } finally { setSalvando(false) }
  }

  async function cadastrarSecao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!administrador || salvando) return
    const nome = novaSecao.trim()
    if (nome.length < 2 || nome.length > 100) {
      setErro('O nome da seção deve ter entre 2 e 100 caracteres.')
      return
    }
    if (secoes.some(s => s.nome.toLowerCase() === nome.toLowerCase())) {
      setErro('Já existe uma seção com esse nome.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      const criada = modoDemo ? { id: crypto.randomUUID(), nome } : await criarSecao(nome)
      setSecoes(atual => [...atual, criada])
      setNovaSecao('')
      setAbertas(atual => ({ ...atual, [criada.id]: true }))
      setSucesso('Seção criada com sucesso.')
    } catch {
      setErro('Não foi possível cadastrar a seção. Confira suas permissões.')
    } finally { setSalvando(false) }
  }

  async function salvarNomeSecao(event: FormEvent<HTMLFormElement>, secao: Secao) {
    event.preventDefault()
    if (!administrador || salvando) return
    const nome = nomeSecaoEditando.trim()
    if (nome.length < 2 || nome.length > 100 ||
        secoes.some(s => s.id !== secao.id && s.nome.toLowerCase() === nome.toLowerCase())) {
      setErro('Escolha um nome válido e diferente dos nomes já cadastrados.')
      return
    }
    if (nome === secao.nome) { setSecaoEditando(null); return }
    setSalvando(true)
    setErro('')
    try {
      const resultado = modoDemo ? { ...secao, nome } : await renomearSecao(secao.id, nome)
      setSecoes(atual => atual.map(s => s.id === secao.id ? resultado : s))
      setSecaoEditando(null)
      setSucesso('Seção renomeada.')
    } catch {
      setErro('Não foi possível alterar o nome. Verifique sua permissão administrativa.')
    } finally { setSalvando(false) }
  }

  const filtrados = materiais.filter(m => {
    const secao = secoes.find(s => s.id === m.secao_id)
    const texto = (m.codigo + ' ' + m.titulo + ' ' + (secao?.nome ?? '')).toLocaleLowerCase('pt-BR')
    const achou = texto.includes(busca.trim().toLocaleLowerCase('pt-BR'))
    return achou && (
      filtro === 'todos' ||
      (filtro === 'uso' && m.status_grade === 'em_utilizacao') ||
      (filtro === 'atualizar' && m.status_producao === 'precisa_atualizar') ||
      (filtro === 'gravar' && m.status_producao === 'precisa_gravar')
    )
  })
  const secoesVisiveis = secoes.filter(secao =>
    (!busca.trim() && filtro === 'todos') || filtrados.some(m => m.secao_id === secao.id)
  )
  const totalUso = materiais.filter(m => m.status_grade === 'em_utilizacao').length
  const totalAtualizar = materiais.filter(m => m.status_producao === 'precisa_atualizar').length
  const totalGravar = materiais.filter(m => m.status_producao === 'precisa_gravar').length
  const nomeSecaoExclusao = exclusao ? secoes.find(s => s.id === exclusao.material.secao_id)?.nome : ''

  return (
    <main className="scc-materials-page scc-fluid-content relative isolate min-h-[calc(100vh-90px)] pb-20 pt-7">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-55"
        style={{ backgroundImage: 'linear-gradient(180deg, rgba(5,5,5,.45), rgba(5,5,5,.65)), url("' + laco + '")' }} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#e2fa00]">GERENCIAMENTO DE CONTEÚDOS · SCC SBT</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Central de Materiais</h1>
          <p className="mt-2 text-sm text-white/55">Tudo organizado por seção, com informações e ações sempre alinhadas.</p>
        </div>
        {podeEditar && <button type="button" onClick={novoMaterial} disabled={!secoes.length || salvando}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e2fa00] px-5 py-3 text-sm font-extrabold text-black transition hover:bg-[#f1ff7c] disabled:cursor-not-allowed disabled:opacity-50">
          <Plus size={18} /> Novo material
        </button>}
      </div>

      <div className="scc-kpi-band grid grid-cols-2 gap-3 rounded-[20px] border border-white/10 bg-[#151515]/95 p-3 lg:grid-cols-4">
        {[
          { titulo: 'TOTAL DE MATERIAIS', total: materiais.length },
          { titulo: 'EM UTILIZAÇÃO', total: totalUso },
          { titulo: 'PRECISA ATUALIZAR', total: totalAtualizar },
          { titulo: 'PRECISA GRAVAR', total: totalGravar },
        ].map(kpi => <div key={kpi.titulo} className="min-w-0 text-center">
          <p className="truncate px-1 py-2 text-[11px] font-extrabold tracking-[.035em] text-white/85 sm:text-xs">{kpi.titulo}</p>
          <div className="flex min-h-[78px] items-center justify-center rounded-xl bg-[#0b0b0d] px-2 text-[clamp(29px,2.6vw,62px)] font-extrabold tabular-nums tracking-tight">
            {carregando ? '—' : String(kpi.total).padStart(2, '0')}
          </div>
        </div>)}
      </div>

      <div className="mt-4 rounded-[18px] border border-white/10 bg-[#151515]/95 p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
            <input aria-label="Pesquisar materiais" type="search" placeholder="Pesquisar código, título ou seção..." value={busca}
              onChange={e => setBusca(e.target.value)} className={campo + ' h-11 pl-11'} />
          </div>
          <label className="sr-only" htmlFor="filtro-materiais">Filtrar materiais</label>
          <select id="filtro-materiais" className={campo + ' h-11 sm:w-52'} value={filtro}
            onChange={e => setFiltro(e.target.value as Filtro)}>
            <option value="todos">Todos os materiais</option>
            <option value="uso">Em utilização</option>
            <option value="atualizar">Precisa atualizar</option>
            <option value="gravar">Precisa gravar</option>
          </select>
        </div>
        {administrador && <form onSubmit={cadastrarSecao} className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input aria-label="Nome da nova seção" required minLength={2} maxLength={100} value={novaSecao}
            onChange={e => setNovaSecao(e.target.value)} placeholder="Nome da nova seção..."
            className={campo + ' h-11 min-w-0 flex-1'} />
          <button type="submit" disabled={salvando} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-bold transition hover:bg-white/15 disabled:opacity-40">
            <Plus size={16} /> Criar seção
          </button>
        </form>}
      </div>

      {erro && <div role="alert" className="mt-4 rounded-xl border border-red-400/25 bg-[#301719] p-4 text-sm text-red-200">{erro}</div>}
      {sucesso && <div role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-[#103025] p-4 text-sm text-emerald-200">{sucesso}</div>}
      {carregando && <p className="mt-5 text-sm text-white/60">Carregando materiais...</p>}

      <div className="mt-4 space-y-4">
        {secoesVisiveis.map((secao, indice) => {
          const itens = filtrados.filter(m => m.secao_id === secao.id)
            .sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true }))
          const aberta = abertas[secao.id] !== false
          const cor = corDaSecao(cores, secao.id, Math.max(0, secoes.findIndex(s => s.id === secao.id)))
          const corTexto = contraste(cor)
          const editandoSecao = secaoEditando === secao.id
          return <section key={secao.id} className="overflow-hidden rounded-[17px] border border-white/10 bg-[#141414]/95 shadow-xl shadow-black/20">
            <div className="relative flex items-center gap-3 px-3 py-2 sm:px-5" style={{ backgroundColor: cor, color: corTexto }}>
              <button type="button" className="flex min-w-0 flex-1 items-center justify-center gap-3 py-1 text-center"
                onClick={() => setAbertas(atual => ({ ...atual, [secao.id]: !aberta }))}
                aria-expanded={aberta} aria-label={(aberta ? 'Recolher ' : 'Expandir ') + secao.nome}>
                <strong className="min-w-0 truncate text-[clamp(15px,1.2vw,24px)] font-black uppercase tracking-tight">{secao.nome}</strong>
                <span className="shrink-0 text-[clamp(12px,.95vw,18px)] font-medium italic">— {itens.length} {itens.length === 1 ? 'material' : 'materiais'}</span>
                <ChevronDown size={17} className={'shrink-0 transition-transform ' + (aberta ? 'rotate-180' : '')} />
              </button>
              {administrador && <button type="button" title="Personalizar seção" aria-label={'Personalizar ' + secao.nome}
                onClick={() => { setSecaoEditando(editandoSecao ? null : secao.id); setNomeSecaoEditando(secao.nome) }}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-current/20 px-2.5 py-2 text-xs font-bold transition hover:bg-black/10">
                <Palette size={15} /><span className="hidden sm:inline">Personalizar</span>
              </button>}
            </div>

            {editandoSecao && administrador && <div className="border-b border-white/10 bg-[#181818] px-5 py-5">
              <form onSubmit={e => void salvarNomeSecao(e, secao)} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1">
                  <label htmlFor={'nome-' + secao.id} className={rotulo}>Nome da seção</label>
                  <input id={'nome-' + secao.id} className={campo} required minLength={2} maxLength={100}
                    value={nomeSecaoEditando} onChange={e => setNomeSecaoEditando(e.target.value)} />
                </div>
                <button disabled={salvando} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-black disabled:opacity-40"><Check size={15} /> Salvar nome</button>
                <button type="button" onClick={() => setSecaoEditando(null)} className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-xs text-white/70"><X size={15} /> Fechar</button>
              </form>
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-white/65">Cor da seção</p>
                <div className="flex flex-wrap items-center gap-2">
                  {paletaSecoes.map(tom => <button key={tom} type="button" style={{ backgroundColor: tom }}
                    title={'Usar cor ' + tom} aria-label={'Usar cor ' + tom} aria-pressed={cor.toLowerCase() === tom.toLowerCase()}
                    onClick={() => definirCor(secao.id, tom)}
                    className={'h-9 w-9 rounded-full border-[3px] transition hover:scale-105 ' + (cor.toLowerCase() === tom.toLowerCase() ? 'border-white' : 'border-transparent')} />)}
                  <label className="ml-3 flex items-center gap-2 text-xs text-white/65">Outra cor
                    <input type="color" aria-label="Escolher cor personalizada" value={cor} onChange={e => definirCor(secao.id, e.target.value)} className="h-9 w-10 cursor-pointer bg-transparent" />
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-white/40">A cor é salva neste navegador. O nome é sincronizado com o banco.</p>
              </div>
            </div>}

            {aberta && <div className="overflow-x-auto">
              <table className="scc-material-table min-w-[1120px] w-full table-fixed border-collapse text-left" aria-label={'Materiais da seção ' + secao.nome}>
                <colgroup>
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '27%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead><tr className="bg-[#191919] text-[11px] font-bold uppercase tracking-wide text-white/65">
                  {['Código', 'Título', 'Duração', 'Situação na grade', 'Status produção', 'Arquivo', 'Ações'].map(nome => <th key={nome} scope="col" className="px-4 py-3.5">{nome}</th>)}
                </tr></thead>
                <tbody>
                  {itens.map(m => <tr key={m.id} className="border-t border-white/[0.07] bg-[#141414] transition hover:bg-[#202020]">
                    <td className="px-4 py-3 font-mono text-[12px] font-bold" style={{ color: cor }}>{m.codigo}</td>
                    <td className="truncate px-4 py-3 text-[12px] font-semibold text-white/90" title={m.titulo}>{m.titulo}</td>
                    <td className="px-4 py-3 text-xs tabular-nums text-white/75">{m.duracao_segundos}s</td>
                    <td className="px-4 py-3">
                      <select aria-label={'Situação na grade: ' + m.titulo} value={m.status_grade}
                        disabled={!podeEditar || salvando} onChange={e => void atualizarStatus(m, 'status_grade', e.target.value as StatusGrade)}
                        className="w-full min-w-0 rounded-lg border border-white/10 bg-[#0d0d0e] px-2 py-2 text-xs text-white/85 outline-none focus:border-[#e2fa00]/50 disabled:opacity-55">
                        {statusGrade.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select aria-label={'Status de produção: ' + m.titulo} value={m.status_producao}
                        disabled={!podeEditar || salvando} onChange={e => void atualizarStatus(m, 'status_producao', e.target.value as StatusProducao)}
                        className="w-full min-w-0 rounded-lg border border-white/10 bg-[#0d0d0e] px-2 py-2 text-xs text-white/85 outline-none focus:border-[#e2fa00]/50 disabled:opacity-55">
                        {statusProducao.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {m.link_externo
                        ? <a href={m.link_externo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-[#e2fa00] hover:underline">Abrir arquivo <ArrowUpRight size={13} /></a>
                        : <span className="text-white/35">Sem link</span>}
                    </td>
                    <td className="px-3 py-3">
                      {podeEditar ? <div className="flex items-center justify-end gap-1.5">
                        <button type="button" disabled={salvando} onClick={() => abrirMaterial('editar', m)}
                          title={'Editar ' + m.titulo} aria-label={'Editar ' + m.titulo}
                          className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:border-blue-400/50 hover:bg-blue-400/10 hover:text-blue-200 disabled:opacity-40"><Pencil size={15} /></button>
                        <button type="button" disabled={salvando} onClick={() => abrirMaterial('duplicar', m)}
                          title={'Duplicar ' + m.titulo} aria-label={'Duplicar ' + m.titulo}
                          className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:border-[#e2fa00]/50 hover:bg-[#e2fa00]/10 hover:text-[#e2fa00] disabled:opacity-40"><Copy size={15} /></button>
                        {administrador && <button type="button" disabled={salvando} onClick={() => solicitarExclusao(m)}
                          title={'Excluir ' + m.titulo} aria-label={'Excluir ' + m.titulo}
                          className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:border-red-400/50 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"><Trash2 size={15} /></button>}
                      </div> : <span className="text-xs text-white/35">Leitura</span>}
                    </td>
                  </tr>)}
                  {!itens.length && <tr><td colSpan={7} className="px-5 py-9 text-center text-sm text-white/45">Nenhum material nesta seção.</td></tr>}
                </tbody>
              </table>
            </div>}
          </section>
        })}
        {!carregando && !secoesVisiveis.length && <div className="rounded-xl border border-white/10 bg-[#151515] p-10 text-center text-sm text-white/50">Nenhuma seção ou material encontrado.</div>}
      </div>
      <p className="mt-8 text-center text-xs text-white/40">SCC Produção · {modoDemo ? 'Protótipo local' : 'Ambiente de desenvolvimento protegido'}</p>

      {dialogo && <div className="scc-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 px-4 py-8 backdrop-blur-md sm:items-center" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="titulo-formulario" className="w-full max-w-[780px] rounded-[22px] border border-white/15 bg-[#191919] p-5 shadow-2xl sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-[11px] font-bold tracking-widest text-[#e2fa00]">CENTRAL DE MATERIAIS</p>
              <h2 id="titulo-formulario" className="text-2xl font-extrabold">{dialogo.modo === 'novo' ? 'Novo material' : dialogo.modo === 'editar' ? 'Editar material' : 'Duplicar material'}</h2>
              {dialogo.modo === 'duplicar' && <p className="mt-2 text-xs leading-5 text-white/55">Os dados foram copiados. Escolha um código exclusivo. A nova cópia começa aguardando entrada e gravação.</p>}
            </div>
            <button type="button" aria-label="Fechar formulário" disabled={salvando} onClick={() => { setDialogo(null); setErro('') }} className="rounded-lg border border-white/15 p-2 text-white/60 hover:text-white"><X size={20} /></button>
          </div>
          <form onSubmit={e => void salvarFormulario(e)} className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="material-secao" className={rotulo}>Seção</label>
              <select id="material-secao" className={campo} required value={formulario.secao_id} onChange={e => mudar('secao_id', e.target.value)}>
                {secoes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div><label htmlFor="material-codigo" className={rotulo}>Código</label>
              <input id="material-codigo" className={campo} required maxLength={20} value={formulario.codigo} onChange={e => mudar('codigo', e.target.value)} placeholder="0001" />
            </div>
            <div className="sm:col-span-2"><label htmlFor="material-titulo" className={rotulo}>Título</label>
              <input id="material-titulo" className={campo} required minLength={2} maxLength={180} value={formulario.titulo} onChange={e => mudar('titulo', e.target.value)} />
            </div>
            <div><label htmlFor="material-duracao" className={rotulo}>Duração em segundos</label>
              <input id="material-duracao" className={campo} type="number" min={1} max={36000} step={1} required value={formulario.duracao_segundos} onChange={e => mudar('duracao_segundos', e.target.value)} />
            </div>
            <div><label htmlFor="material-grade" className={rotulo}>Situação na grade</label>
              <select id="material-grade" className={campo} value={formulario.status_grade} onChange={e => mudar('status_grade', e.target.value as StatusGrade)}>
                {statusGrade.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div><label htmlFor="material-producao" className={rotulo}>Status de produção</label>
              <select id="material-producao" className={campo} value={formulario.status_producao} onChange={e => mudar('status_producao', e.target.value as StatusProducao)}>
                {statusProducao.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div><label htmlFor="material-link" className={rotulo}>Link do arquivo (HTTPS)</label>
              <input id="material-link" type="url" className={campo} placeholder="https://..." value={formulario.link_externo} onChange={e => mudar('link_externo', e.target.value)} />
            </div>
            <div className="sm:col-span-2"><label htmlFor="material-observacoes" className={rotulo}>Observações</label>
              <textarea id="material-observacoes" rows={3} maxLength={4000} className={campo} value={formulario.observacoes} onChange={e => mudar('observacoes', e.target.value)} />
            </div>
            {erro && <p role="alert" className="sm:col-span-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{erro}</p>}
            <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5 sm:col-span-2">
              <button type="button" disabled={salvando} onClick={() => { setDialogo(null); setErro('') }} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/70">Cancelar</button>
              <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-xl bg-[#e2fa00] px-6 py-3 text-sm font-extrabold text-black disabled:opacity-50">
                <Check size={16} /> {salvando ? 'Salvando...' : dialogo.modo === 'editar' ? 'Salvar alterações' : dialogo.modo === 'duplicar' ? 'Criar cópia' : 'Cadastrar material'}
              </button>
            </div>
          </form>
        </section>
      </div>}

      {exclusao && <div className="scc-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
        <section role="alertdialog" aria-modal="true" aria-labelledby="titulo-excluir" aria-describedby="descricao-excluir"
          className="w-full max-w-[530px] rounded-[22px] border border-red-500/35 bg-[#1b1718] p-6 shadow-2xl sm:p-8">
          <ShieldAlert size={34} className="text-red-400" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-red-300">CONFIRMAÇÃO {exclusao.etapa} DE 2</p>
          <h2 id="titulo-excluir" className="mt-2 text-2xl font-extrabold">Excluir permanentemente?</h2>
          <p id="descricao-excluir" className="mt-4 text-sm leading-6 text-white/65">
            {exclusao.etapa === 1
              ? 'Você está prestes a excluir este material do banco. A ação é irreversível. O histórico de auditoria será preservado.'
              : 'Para confirmar, digite exatamente o código do material abaixo.'}
          </p>
          <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="break-words text-sm font-semibold text-white">{exclusao.material.titulo}</p>
            <p className="mt-2 text-xs text-white/55">Seção: {nomeSecaoExclusao ?? '—'}</p>
            <p className="mt-1 font-mono text-sm font-bold text-red-300">Código: {exclusao.material.codigo}</p>
          </div>
          {exclusao.etapa === 2 && <div className="mt-5">
            <label className={rotulo} htmlFor="confirmacao-exclusao">Digite o código: {exclusao.material.codigo}</label>
            <input id="confirmacao-exclusao" autoComplete="off" spellCheck={false}
              value={confirmacao} onChange={e => setConfirmacao(e.target.value)} className={campo} />
          </div>}
          {erro && <p role="alert" className="mt-4 rounded-xl bg-red-400/10 p-3 text-xs text-red-200">{erro}</p>}
          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <button type="button" disabled={salvando} onClick={() => { setExclusao(null); setConfirmacao(''); setErro('') }}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/75">Cancelar</button>
            {exclusao.etapa === 1
              ? <button type="button" onClick={() => setExclusao({ ...exclusao, etapa: 2 })}
                  className="rounded-xl border border-red-400/45 px-5 py-3 text-sm font-bold text-red-200 hover:bg-red-400/10">Continuar para confirmação</button>
              : <button type="button" disabled={salvando || confirmacao !== exclusao.material.codigo}
                  onClick={() => void confirmarExclusao()}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-35">
                  <Trash2 size={16}/>{salvando ? 'Excluindo...' : 'Excluir definitivamente'}
                </button>}
          </div>
        </section>
      </div>}
    </main>
  )
}
