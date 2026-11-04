
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

type StatusGrade =
  | 'Em utilização'
  | 'Fora da grade'
  | 'Aguardando entrada'
  | 'Removido'

type StatusProducao =
  | 'Em dia'
  | 'Precisa atualizar'
  | 'Precisa gravar'
  | 'Em produção'
  | 'Aguardando aprovação'
  | 'Pronto para envio'

type Secao = {
  id: string
  nome: string
}

type Material = {
  id: string
  secaoId: string
  codigo: string
  titulo: string
  duracao: number
  grade: StatusGrade
  producao: StatusProducao
  link: string
}

type Filtro = 'todos' | 'uso' | 'atualizar' | 'gravar'

const secoesIniciais: Secao[] = [
  { id: 'meio-dia', nome: 'SCC MEIO-DIA' },
  { id: 'news', nome: 'SCC NEWS' },
]

const materiaisIniciais: Material[] = [
  {
    id: 'material-1',
    secaoId: 'meio-dia',
    codigo: '0001',
    titulo: 'CH SCC MEIO DIA ESPECIAL',
    duracao: 15,
    grade: 'Em utilização',
    producao: 'Em dia',
    link: '',
  },
  {
    id: 'material-2',
    secaoId: 'meio-dia',
    codigo: '0002',
    titulo: 'CH SCC MEIO DIA INSTITUCIONAL',
    duracao: 45,
    grade: 'Em utilização',
    producao: 'Precisa atualizar',
    link: '',
  },
  {
    id: 'material-3',
    secaoId: 'news',
    codigo: '0001',
    titulo: 'CH SCC NEWS ESPECIAL',
    duracao: 15,
    grade: 'Em utilização',
    producao: 'Em dia',
    link: '',
  },
  {
    id: 'material-4',
    secaoId: 'news',
    codigo: '0002',
    titulo: 'CH SCC NEWS INSTITUCIONAL',
    duracao: 45,
    grade: 'Em utilização',
    producao: 'Precisa atualizar',
    link: '',
  },
]

const opcoesGrade: StatusGrade[] = [
  'Em utilização',
  'Fora da grade',
  'Aguardando entrada',
  'Removido',
]

const opcoesProducao: StatusProducao[] = [
  'Em dia',
  'Precisa atualizar',
  'Precisa gravar',
  'Em produção',
  'Aguardando aprovação',
  'Pronto para envio',
]

const campo =
  'w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm text-white outline-none focus:border-blue-500'

const rotulo = 'mb-2 block text-xs font-medium text-white/60'

export default function Conteudos() {
  const [secoes, setSecoes] = useState(secoesIniciais)
  const [materiais, setMateriais] = useState(materiaisIniciais)

  const [abertas, setAbertas] = useState<Record<string, boolean>>({
    'meio-dia': true,
    news: true,
  })

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [novaSecao, setNovaSecao] = useState('')
  const [mostrarCadastro, setMostrarCadastro] = useState(false)

  const [cadastro, setCadastro] = useState({
    secaoId: 'meio-dia',
    codigo: '',
    titulo: '',
    duracao: '15',
    link: '',
  })

  function criarSecao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const nome = novaSecao.trim()

    if (!nome) return

    const existe = secoes.some(
      (s) => s.nome.toLowerCase() === nome.toLowerCase()
    )

    if (existe) {
      alert('Já existe uma seção com esse nome.')
      return
    }

    const id = crypto.randomUUID()

    setSecoes((atual) => [...atual, { id, nome }])
    setAbertas((atual) => ({ ...atual, [id]: true }))
    setCadastro((atual) => ({ ...atual, secaoId: id }))
    setNovaSecao('')
  }

  function cadastrarMaterial(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const codigo = cadastro.codigo.trim()
    const titulo = cadastro.titulo.trim()
    const duracao = Number(cadastro.duracao)
    const link = cadastro.link.trim()

    if (!codigo || !titulo || !Number.isInteger(duracao) || duracao <= 0) {
      alert('Confira o código, o título e a duração.')
      return
    }

    const duplicado = materiais.some(
      (m) => m.secaoId === cadastro.secaoId && m.codigo === codigo
    )

    if (duplicado) {
      alert('Este código já existe dentro da seção selecionada.')
      return
    }

    if (link) {
      try {
        const url = new URL(link)
        if (url.protocol !== 'https:') throw new Error()
      } catch {
        alert('Informe um link HTTPS válido.')
        return
      }
    }

    const novoMaterial: Material = {
      id: crypto.randomUUID(),
      secaoId: cadastro.secaoId,
      codigo,
      titulo,
      duracao,
      link,
      grade: 'Aguardando entrada',
      producao: 'Precisa gravar',
    }

    setMateriais((atual) => [...atual, novoMaterial])
    setAbertas((atual) => ({
      ...atual,
      [cadastro.secaoId]: true,
    }))

    setCadastro((atual) => ({
      ...atual,
      codigo: '',
      titulo: '',
      duracao: '15',
      link: '',
    }))

    setBusca('')
    setFiltro('todos')
    setMostrarCadastro(false)
  }

  function editarMaterial<K extends keyof Material>(
    id: string,
    propriedade: K,
    valor: Material[K]
  ) {
    setMateriais((atual) =>
      atual.map((material) =>
        material.id === id
          ? { ...material, [propriedade]: valor }
          : material
      )
    )
  }

  const materiaisFiltrados = materiais.filter((material) => {
    const secao = secoes.find((s) => s.id === material.secaoId)

    const texto = [
      material.codigo,
      material.titulo,
      secao?.nome ?? '',
    ].join(' ').toLowerCase()

    const correspondeBusca = texto.includes(busca.toLowerCase().trim())

    const correspondeFiltro =
      filtro === 'todos' ||
      (filtro === 'uso' && material.grade === 'Em utilização') ||
      (filtro === 'atualizar' && material.producao === 'Precisa atualizar') ||
      (filtro === 'gravar' && material.producao === 'Precisa gravar')

    return correspondeBusca && correspondeFiltro
  })

  const secoesVisiveis = secoes.filter(
    (secao) =>
      (filtro === 'todos' && busca.trim() === '') ||
      materiaisFiltrados.some((m) => m.secaoId === secao.id)
  )

  const totalEmUso = materiais.filter(
    (m) => m.grade === 'Em utilização'
  ).length

  const totalAtualizar = materiais.filter(
    (m) => m.producao === 'Precisa atualizar'
  ).length

  const totalGravar = materiais.filter(
    (m) => m.producao === 'Precisa gravar'
  ).length

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <Link
        to="/"
        className="text-sm text-white/50 hover:text-white"
      >
        ← Voltar ao início
      </Link>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-blue-400">
            GERENCIAMENTO SCC SBT
          </p>

          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            Central de Materiais
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Controle e gerenciamento dos conteúdos audiovisuais.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarCadastro(!mostrarCadastro)}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500"
        >
          {mostrarCadastro ? 'Cancelar cadastro' : '+ Novo material'}
        </button>
      </div>

      {/* INDICADORES */}
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { titulo: 'TOTAL DE MATERIAIS', valor: materiais.length, cor: 'text-white' },
          { titulo: 'EM UTILIZAÇÃO', valor: totalEmUso, cor: 'text-green-400' },
          { titulo: 'PRECISA ATUALIZAR', valor: totalAtualizar, cor: 'text-orange-400' },
          { titulo: 'PRECISA GRAVAR', valor: totalGravar, cor: 'text-pink-400' },
        ].map((item) => (
          <div
            key={item.titulo}
            className="rounded-2xl border border-white/10 bg-[#151515] p-5"
          >
            <p className="text-xs font-semibold text-white/50">
              {item.titulo}
            </p>
            <p className={`mt-4 text-3xl font-black ${item.cor}`}>
              {item.valor}
            </p>
          </div>
        ))}
      </div>

      {/* FORMULÁRIO DE CADASTRO */}
      {mostrarCadastro && (
        <form
          onSubmit={cadastrarMaterial}
          className="mt-8 rounded-2xl border border-blue-500/40 bg-[#151515] p-6"
        >
          <h2 className="mb-6 text-xl font-bold">
            Cadastrar novo material
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={rotulo}>Seção</label>
              <select
                className={campo}
                value={cadastro.secaoId}
                onChange={(e) =>
                  setCadastro({ ...cadastro, secaoId: e.target.value })
                }
              >
                {secoes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={rotulo}>Código</label>
              <input
                className={campo}
                placeholder="0001"
                value={cadastro.codigo}
                onChange={(e) =>
                  setCadastro({ ...cadastro, codigo: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className={rotulo}>Título do material</label>
              <input
                className={campo}
                placeholder="CH SCC MEIO DIA ESPECIAL"
                value={cadastro.titulo}
                onChange={(e) =>
                  setCadastro({ ...cadastro, titulo: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className={rotulo}>Duração (segundos)</label>
              <input
                type="number"
                min="1"
                step="1"
                className={campo}
                value={cadastro.duracao}
                onChange={(e) =>
                  setCadastro({ ...cadastro, duracao: e.target.value })
                }
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className={rotulo}>Link externo (opcional)</label>
              <input
                type="url"
                className={campo}
                placeholder="https://..."
                value={cadastro.link}
                onChange={(e) =>
                  setCadastro({ ...cadastro, link: e.target.value })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold hover:bg-blue-500"
          >
            Salvar material
          </button>
        </form>
      )}

      {/* BUSCA E FILTROS */}
      <div className="mt-10 flex flex-col gap-4 md:flex-row">
        <input
          className={`${campo} md:flex-1`}
          placeholder="Pesquisar código, título ou seção..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select
          className={`${campo} md:w-56`}
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as Filtro)}
        >
          <option value="todos">Todos os materiais</option>
          <option value="uso">Em utilização</option>
          <option value="atualizar">Precisa atualizar</option>
          <option value="gravar">Precisa gravar</option>
        </select>
      </div>

      {/* CRIAÇÃO DE SEÇÕES */}
      <form
        onSubmit={criarSecao}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <input
          className={`${campo} sm:max-w-sm`}
          placeholder="Nome da nova seção..."
          value={novaSecao}
          onChange={(e) => setNovaSecao(e.target.value)}
          required
        />
        <button
          type="submit"
          className="rounded-lg border border-white/20 px-5 py-2 text-sm font-bold hover:bg-white/10"
        >
          + Criar seção
        </button>
      </form>

      {/* TABELAS AGRUPADAS */}
      <div className="mt-8 space-y-5">
        {secoesVisiveis.map((secao) => {
          const itens = materiaisFiltrados.filter(
            (m) => m.secaoId === secao.id
          )

          return (
            <section
              key={secao.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#151515]"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-white/5"
                onClick={() =>
                  setAbertas((atual) => ({
                    ...atual,
                    [secao.id]: !atual[secao.id],
                  }))
                }
              >
                <div className="flex items-center gap-3">
                  <span className="text-blue-400">▣</span>
                  <h2 className="font-bold">{secao.nome}</h2>
                  <span className="text-xs text-white/40">
                    {itens.length} materiais
                  </span>
                </div>
                <span className="text-white/50">
                  {abertas[secao.id] ? '−' : '+'}
                </span>
              </button>

              {abertas[secao.id] && (
                <div className="overflow-x-auto border-t border-white/10">
                  <table className="w-full min-w-[950px] text-left text-sm">
                    <thead className="bg-[#202020] text-xs text-white/50">
                      <tr>
                        <th className="px-5 py-4">CÓDIGO</th>
                        <th className="px-5 py-4">TÍTULO</th>
                        <th className="px-5 py-4">DURAÇÃO</th>
                        <th className="px-5 py-4">SITUAÇÃO NA GRADE</th>
                        <th className="px-5 py-4">PRODUÇÃO</th>
                        <th className="px-5 py-4">ARQUIVO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((material) => (
                        <tr
                          key={material.id}
                          className="border-t border-white/10 hover:bg-white/5"
                        >
                          <td className="px-5 py-4 font-mono text-blue-400">
                            {material.codigo}
                          </td>
                          <td className="px-5 py-4 font-medium">
                            {material.titulo}
                          </td>
                          <td className="px-5 py-4">
                            {material.duracao}s
                          </td>
                          <td className="px-5 py-4">
                            <select
                              aria-label={`Situação na grade: ${material.titulo}`}
                              className={`${campo} min-w-40`}
                              value={material.grade}
                              onChange={(e) =>
                                editarMaterial(
                                  material.id,
                                  'grade',
                                  e.target.value as StatusGrade
                                )
                              }
                            >
                              {opcoesGrade.map((opcao) => (
                                <option key={opcao} value={opcao}>
                                  {opcao}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4">
                            <select
                              aria-label={`Situação de produção: ${material.titulo}`}
                              className={`${campo} min-w-44`}
                              value={material.producao}
                              onChange={(e) =>
                                editarMaterial(
                                  material.id,
                                  'producao',
                                  e.target.value as StatusProducao
                                )
                              }
                            >
                              {opcoesProducao.map((opcao) => (
                                <option key={opcao} value={opcao}>
                                  {opcao}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4">
                            {material.link ? (
                              <a
                                href={material.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                              >
                                Abrir arquivo ↗
                              </a>
                            ) : (
                              <span className="text-white/30">
                                Sem link
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {itens.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-8 text-center text-white/40"
                          >
                            Nenhum material cadastrado nesta seção.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )
        })}

        {secoesVisiveis.length === 0 && (
          <div className="rounded-xl border border-white/10 p-10 text-center text-white/50">
            Nenhum material encontrado para os filtros selecionados.
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-white/30">
        SCC Produção · Protótipo local sem persistência de dados
      </p>
    </div>
  )
}
