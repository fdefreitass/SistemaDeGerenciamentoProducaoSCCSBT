
const modulos = [
  { nome: 'Conteúdos', descricao: 'Central de materiais', cor: '#0089FF' },
  { nome: 'Gravação', descricao: 'Novas produções', cor: '#FF6900' },
  { nome: 'Atualização', descricao: 'Materiais pendentes', cor: '#B900E5' },
  { nome: 'Remoção', descricao: 'Controle da grade', cor: '#E90058' },
]

function App() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">

      <header className="flex items-center justify-between border-b border-white/10 px-8 py-6">
        <div className="text-xl font-black tracking-tight">
          SCC <span className="rounded-full bg-white px-2 py-1 text-black">sbt</span>
        </div>

        <span className="text-sm font-bold">
          PRODUÇÃO SCC SBT
        </span>

        <span className="text-xs text-white/50">
          AMBIENTE DE DESENVOLVIMENTO
        </span>
      </header>

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
            <div
              key={modulo.nome}
              className="rounded-2xl border border-white/10 bg-[#151515] p-6"
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
            </div>
          ))}
        </div>

      </section>
    </main>
  )
}

export default App
