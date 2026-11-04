import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { demoMateriais, demoSecoes } from '../data/demo'
import { modoDemo } from '../lib/supabase'
import {
  atualizarMaterial, criarMaterial, criarSecao, listarDados,
} from '../services/materiais'
import {
  statusGrade, statusProducao,
  type Material, type Secao, type StatusGrade, type StatusProducao,
} from '../types/materiais'

type Filtro = 'todos' | 'uso' | 'atualizar' | 'gravar'

const campo = 'w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm text-white outline-none focus:border-blue-500'
const rotulo = 'mb-2 block text-xs text-white/60'

export default function Conteudos() {
  const { perfil } = useAuth()
  const podeEditar = modoDemo || perfil?.papel === 'admin' || perfil?.papel === 'editor'
  const podeCriarSecao = modoDemo || perfil?.papel === 'admin'

  const [secoes, setSecoes] = useState<Secao[]>(modoDemo ? demoSecoes : [])
  const [materiais, setMateriais] = useState<Material[]>(modoDemo ? demoMateriais : [])
  const [abertas, setAbertas] = useState<Record<string, boolean>>({})
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [novaSecao, setNovaSecao] = useState('')
  const [mostrarCadastro, setMostrarCadastro] = useState(false)
  const [carregando, setCarregando] = useState(!modoDemo)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [cadastro, setCadastro] = useState({ secao_id: '', codigo: '', titulo: '', duracao_segundos: '15', link_externo: '' })

  useEffect(() => {
    if (modoDemo) return
    let ativo = true
    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        const dados = await listarDados()
        if (ativo) {
          setSecoes(dados.secoes)
          setMateriais(dados.materiais)
        }
      } catch {
        if (ativo) setErro('Não foi possível carregar os dados. Confira a conexão e as permissões do usuário.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    void carregar()
    return () => { ativo = false }
  }, [])

  const selecaoSecao = secoes.some(s => s.id === cadastro.secao_id)
    ? cadastro.secao_id : (secoes[0]?.id ?? '')

  async function cadastrarSecao(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nome = novaSecao.trim()
    if (!nome || salvando) return
    if (secoes.some(s => s.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))) {
      setErro('Já existe uma seção com esse nome.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      const nova = modoDemo ? { id: crypto.randomUUID(), nome } : await criarSecao(nome)
      setSecoes(atual => [...atual, nova])
      setAbertas(atual => ({ ...atual, [nova.id]: true }))
      setCadastro(atual => ({ ...atual, secao_id: nova.id }))
      setNovaSecao('')
    } catch {
      setErro('Não foi possível criar a seção. Verifique se você tem perfil de administrador.')
    } finally {
      setSalvando(false)
    }
  }

  async function cadastrarMaterial(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (salvando) return
    const codigo = cadastro.codigo.trim()
    const titulo = cadastro.titulo.trim()
    const duracao_segundos = Number(cadastro.duracao_segundos)
    const link_externo = cadastro.link_externo.trim() || null
    const secao_id = selecaoSecao
    if (!secao_id || !/^[a-zA-Z0-9._-]{1,20}$/.test(codigo) || titulo.length < 2 ||
        titulo.length > 180 || !Number.isInteger(duracao_segundos) || duracao_segundos < 1) {
      setErro('Preencha seção, código válido, título e duração inteira em segundos.')
      return
    }
    if (materiais.some(m => m.secao_id === secao_id && m.codigo === codigo)) {
      setErro('Já existe material com esse código nesta seção.')
      return
    }
    if (link_externo) {
      try {
        if (new URL(link_externo).protocol !== 'https:') throw new Error()
      } catch {
        setErro('Por segurança, o link externo deve começar com https://')
        return
      }
    }
    setSalvando(true)
    setErro('')
    try {
      const novo = { secao_id, codigo, titulo, duracao_segundos, link_externo }
      const resultado: Material = modoDemo
        ? {
          ...novo, id: crypto.randomUUID(), status_grade: 'aguardando_entrada',
          status_producao: 'precisa_gravar', observacoes: null,
        }
        : await criarMaterial(novo)
      setMateriais(atual => [...atual, resultado])
      setAbertas(atual => ({ ...atual, [secao_id]: true }))
      setMostrarCadastro(false)
      setCadastro(atual => ({ ...atual, codigo: '', titulo: '', duracao_segundos: '15', link_externo: '' }))
      setBusca('')
      setFiltro('todos')
    } catch {
      setErro('Não foi possível salvar o material. Verifique suas permissões ou se o código já existe.')
    } finally {
      setSalvando(false)
    }
  }

  async function trocarStatus(
    material: Material,
    campoStatus: 'status_grade' | 'status_producao',
    valor: StatusGrade | StatusProducao
  ) {
    if (salvando) return
    setSalvando(true)
    setErro('')
    try {
      if (!modoDemo) await atualizarMaterial(material.id, { [campoStatus]: valor })
      setMateriais(atual => atual.map(m => m.id === material.id ? { ...m, [campoStatus]: valor } : m))
    } catch {
      setErro('Falha ao atualizar o status. A informação anterior foi preservada.')
    } finally {
      setSalvando(false)
    }
  }

  const filtrados = materiais.filter(m => {
    const secao = secoes.find(s => s.id === m.secao_id)
    const pesquisa = `${m.codigo} ${m.titulo} ${secao?.nome ?? ''}`.toLocaleLowerCase('pt-BR')
    const achou = pesquisa.includes(busca.trim().toLocaleLowerCase('pt-BR'))
    return achou && (
      filtro === 'todos' ||
      (filtro === 'uso' && m.status_grade === 'em_utilizacao') ||
      (filtro === 'atualizar' && m.status_producao === 'precisa_atualizar') ||
      (filtro === 'gravar' && m.status_producao === 'precisa_gravar')
    )
  })
  const secoesVisiveis = secoes.filter(s =>
    (filtro === 'todos' && !busca.trim()) || filtrados.some(m => m.secao_id === s.id)
  )

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <Link to="/" className="text-sm text-white/50 hover:text-white">← Voltar ao início</Link>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-blue-400">GERENCIAMENTO SCC SBT</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Central de Materiais</h1>
          <p className="mt-2 text-sm text-white/50">Controle e gerenciamento de conteúdos audiovisuais.</p>
          <p className={`mt-3 text-xs font-semibold ${modoDemo ? 'text-amber-400' : 'text-emerald-400'}`}>
            {modoDemo ? 'DEMONSTRAÇÃO LOCAL — os dados somem ao atualizar a página' : 'SUPABASE DE DESENVOLVIMENTO — dados persistentes'}
          </p>
        </div>
        {podeEditar && <button onClick={() => setMostrarCadastro(x => !x)} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500">{mostrarCadastro ? 'Cancelar' : '+ Novo material'}</button>}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { nome: 'TOTAL', total: materiais.length, cor: 'text-white' },
          { nome: 'EM UTILIZAÇÃO', total: materiais.filter(m => m.status_grade === 'em_utilizacao').length, cor: 'text-green-400' },
          { nome: 'PRECISA ATUALIZAR', total: materiais.filter(m => m.status_producao === 'precisa_atualizar').length, cor: 'text-orange-400' },
          { nome: 'PRECISA GRAVAR', total: materiais.filter(m => m.status_producao === 'precisa_gravar').length, cor: 'text-pink-400' },
        ].map(info => <div key={info.nome} className="rounded-2xl border border-white/10 bg-[#151515] p-5">
          <p className="text-xs font-semibold text-white/50">{info.nome}</p>
          <p className={`mt-4 text-3xl font-black ${info.cor}`}>{info.total}</p>
        </div>)}
      </div>

      {erro && <div role="alert" className="mt-6 rounded-lg border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-300">{erro}</div>}
      {carregando && <p className="mt-5 text-white/60">Carregando dados protegidos...</p>}

      {mostrarCadastro && podeEditar && <form onSubmit={cadastrarMaterial} className="mt-8 rounded-2xl border border-blue-500/40 bg-[#151515] p-6">
        <h2 className="mb-6 text-xl font-bold">Cadastrar novo material</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className={rotulo}>Seção</label><select className={campo} required value={selecaoSecao} onChange={e => setCadastro({ ...cadastro, secao_id: e.target.value })}>
            {secoes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select></div>
          <div><label className={rotulo}>Código</label><input className={campo} required maxLength={20} value={cadastro.codigo} onChange={e => setCadastro({ ...cadastro, codigo: e.target.value })} placeholder="0001" /></div>
          <div><label className={rotulo}>Título</label><input className={campo} required maxLength={180} value={cadastro.titulo} onChange={e => setCadastro({ ...cadastro, titulo: e.target.value })} placeholder="CH SCC MEIO DIA ESPECIAL" /></div>
          <div><label className={rotulo}>Duração (segundos)</label><input className={campo} type="number" min={1} max={36000} step={1} required value={cadastro.duracao_segundos} onChange={e => setCadastro({ ...cadastro, duracao_segundos: e.target.value })} /></div>
          <div className="md:col-span-2"><label className={rotulo}>Link externo HTTPS (opcional)</label><input className={campo} type="url" value={cadastro.link_externo} onChange={e => setCadastro({ ...cadastro, link_externo: e.target.value })} placeholder="https://..." /></div>
        </div>
        <button type="submit" disabled={salvando || !selecaoSecao} className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold disabled:opacity-50">Salvar material</button>
      </form>}

      <div className="mt-10 flex flex-col gap-4 md:flex-row">
        <input className={`${campo} md:flex-1`} placeholder="Pesquisar código, título ou seção..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select className={`${campo} md:w-56`} value={filtro} onChange={e => setFiltro(e.target.value as Filtro)}>
          <option value="todos">Todos os materiais</option><option value="uso">Em utilização</option><option value="atualizar">Precisa atualizar</option><option value="gravar">Precisa gravar</option>
        </select>
      </div>

      {podeCriarSecao && <form onSubmit={cadastrarSecao} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input className={`${campo} sm:max-w-sm`} required minLength={2} maxLength={100} placeholder="Nome da nova seção..." value={novaSecao} onChange={e => setNovaSecao(e.target.value)} />
        <button disabled={salvando} className="rounded-lg border border-white/20 px-5 py-2 text-sm font-bold hover:bg-white/10 disabled:opacity-50">+ Criar seção</button>
      </form>}

      <div className="mt-8 space-y-5">
        {secoesVisiveis.map(secao => {
          const itens = filtrados.filter(m => m.secao_id === secao.id)
          const aberta = abertas[secao.id] !== false
          return <section key={secao.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#151515]">
            <button type="button" className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-white/5" onClick={() => setAbertas(a => ({ ...a, [secao.id]: !aberta }))}>
              <span className="font-bold">▣ {secao.nome} <span className="ml-3 text-xs font-normal text-white/40">{itens.length} materiais</span></span>
              <span className="text-white/50">{aberta ? '−' : '+'}</span>
            </button>
            {aberta && <div className="overflow-x-auto border-t border-white/10"><table className="w-full min-w-237.5 text-left text-sm">
              <thead className="bg-[#202020] text-xs text-white/50"><tr>
                {['CÓDIGO', 'TÍTULO', 'DURAÇÃO', 'SITUAÇÃO NA GRADE', 'PRODUÇÃO', 'ARQUIVO'].map(col => <th key={col} className="px-5 py-4">{col}</th>)}
              </tr></thead>
              <tbody>
                {itens.map(m => <tr key={m.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-5 py-4 font-mono text-blue-400">{m.codigo}</td>
                  <td className="px-5 py-4 font-medium">{m.titulo}</td>
                  <td className="px-5 py-4">{m.duracao_segundos}s</td>
                  <td className="px-5 py-4"><select disabled={!podeEditar || salvando} className={`${campo} min-w-40 disabled:opacity-70`} aria-label={`Situação na grade de ${m.titulo}`} value={m.status_grade} onChange={e => void trocarStatus(m, 'status_grade', e.target.value as StatusGrade)}>
                    {statusGrade.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select></td>
                  <td className="px-5 py-4"><select disabled={!podeEditar || salvando} className={`${campo} min-w-44 disabled:opacity-70`} aria-label={`Situação de produção de ${m.titulo}`} value={m.status_producao} onChange={e => void trocarStatus(m, 'status_producao', e.target.value as StatusProducao)}>
                    {statusProducao.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select></td>
                  <td className="px-5 py-4">{m.link_externo ? <a href={m.link_externo} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Abrir arquivo ↗</a> : <span className="text-white/30">Sem link</span>}</td>
                </tr>)}
                {itens.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-white/40">Nenhum material nesta seção.</td></tr>}
              </tbody>
            </table></div>}
          </section>
        })}
        {!carregando && secoesVisiveis.length === 0 && <div className="rounded-xl border border-white/10 p-10 text-center text-white/50">Nenhuma seção ou material encontrado.</div>}
      </div>
      <p className="mt-8 text-center text-xs text-white/30">SCC Produção · {modoDemo ? 'Protótipo local' : 'Ambiente de desenvolvimento protegido'}</p>
    </div>
  )
}
