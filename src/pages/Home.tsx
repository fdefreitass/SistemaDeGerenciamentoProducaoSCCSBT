
import { Link } from 'react-router'

const modulos = [
  {
    nome: 'Conteúdos',
    descricao: 'Central de materiais',
    rota: '/conteudos',
    cor: '#0089FF',
  },
  {
    nome: 'Gravação',
    descricao: 'Novas produções',
    rota: '/gravacao',
    cor: '#FF6900',
  },
  {
    nome: 'Atualização',
    descricao: 'Materiais pendentes',
    rota: '/atualizacao',
    cor: '#B900E5',
  },
  {
    nome: 'Remoção',
    descricao: 'Controle da grade',
    rota: '/remocao',
    cor: '#E90058',
  },
]

export default function Home() {
  return (
    <section className="mx-auto max-w-6xl px-8 py-24">
      <p className="mb-3 text-sm font-semibold tracking-widest text-blue-400">
        SISTEMA DE GESTÃO
      </p>

      <h1 className="text-5xl font-black tracking-tight">
        Seja bem-vindo!
      </h1>

      <p className="mt-4 max-w-xl text-white/50">
        Plataforma de gerenciamento de materiais,
        demandas e atualizações do SCC SBT.
      </p>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {modulos.map((modulo) => (
          <Link
            key={modulo.rota}
            to={modulo.rota}
            className="rounded-2xl border border-white/10 bg-[#151515] p-6 transition duration-200 hover:-translate-y-1 hover:border-white/30 hover:bg-[#202020]"
          >
            <div
              className="mb-12 h-2 w-12 rounded-full"
              style={{ backgroundColor: modulo.cor }}
            />

            <h2 className="text-xl font-bold">
              {modulo.nome}
            </h2>

            <p className="mt-2 text-sm text-white/50">
              {modulo.descricao}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
