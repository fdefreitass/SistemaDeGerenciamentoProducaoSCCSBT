
import { Routes, Route, Link } from 'react-router'
import Home from './pages/Home'
import Modulo from './pages/Modulo'

function App() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-6">
        <Link to="/" className="text-xl font-black tracking-tight">
          SCC{' '}
          <span className="rounded-full bg-white px-2 py-1 text-black">
            sbt
          </span>
        </Link>

        <span className="text-sm font-bold">
          PRODUÇÃO SCC SBT
        </span>

        <span className="text-xs text-white/50">
          AMBIENTE DE DESENVOLVIMENTO
        </span>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/conteudos"
          element={
            <Modulo
              titulo="Conteúdos"
              descricao="Gerenciamento central de materiais audiovisuais."
              cor="#0089FF"
            />
          }
        />

        <Route
          path="/gravacao"
          element={
            <Modulo
              titulo="Gravação"
              descricao="Controle de novas gravações e demandas."
              cor="#FF6900"
            />
          }
        />

        <Route
          path="/atualizacao"
          element={
            <Modulo
              titulo="Atualização"
              descricao="Acompanhamento de materiais que precisam ser atualizados."
              cor="#B900E5"
            />
          }
        />

        <Route
          path="/remocao"
          element={
            <Modulo
              titulo="Remoção"
              descricao="Controle dos materiais que devem sair da grade."
              cor="#E90058"
            />
          }
        />

        <Route
          path="*"
          element={<Modulo titulo="Página não encontrada" descricao="Verifique o endereço informado." cor="#777777" />}
        />
      </Routes>
    </main>
  )
}

export default App
