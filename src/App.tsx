import { Link, Route, Routes } from 'react-router'
import { useAuth } from './context/AuthContext'
import { modoDemo, supabase } from './lib/supabase'
import Conteudos from './pages/Conteudos'
import Home from './pages/Home'
import Login from './pages/Login'
import Modulo from './pages/Modulo'
import Administracao from './pages/Administracao'
import DefinirSenha from './pages/DefinirSenha'

export default function App() {
  const { carregando, email, perfil, erro, sair } = useAuth()

  if (!modoDemo) {
    if (!supabase) return <main className="min-h-screen bg-black p-10 text-red-300">Configuração incompleta. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.</main>
    if (carregando) return <main className="min-h-screen bg-black p-10 text-white">Validando acesso...</main>
    if (!email) return <Login />
    if (erro || !perfil?.ativo) return <main className="min-h-screen bg-black p-10 text-white">
      <h1 className="text-2xl font-bold">Acesso não autorizado</h1>
      <p className="mt-3 text-white/60">A conta não possui perfil ativo ou não foi possível verificar sua autorização.</p>
      <button onClick={() => void sair()} className="mt-6 rounded-lg bg-white px-4 py-2 text-black">Sair</button>
    </main>
  }

  return <main className="min-h-screen bg-[#080808] text-white">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-8 py-6">
      <Link to="/" className="text-xl font-black tracking-tight">SCC <span className="rounded-full bg-white px-2 py-1 text-black">sbt</span></Link>
      <span className="text-sm font-bold">PRODUÇÃO SCC SBT</span>
      <div className="flex items-center gap-3 text-xs text-white/50">
        <span>{modoDemo ? 'DEMONSTRAÇÃO LOCAL' : perfil?.nome || email}</span>
        {!modoDemo && <button onClick={() => void sair()} className="rounded-lg border border-white/20 px-3 py-2 text-white hover:bg-white/10">Sair</button>}
        {!modoDemo && perfil?.papel === 'admin' && (<Link
    to="/administracao"
    className="rounded-lg border border-white/20 px-3 py-2 text-white hover:bg-white/10"
  >
    Administração
  </Link>
)}
      </div>
    </header>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/conteudos" element={<Conteudos />} />
      <Route path="/gravacao" element={<Modulo titulo="Gravação" descricao="Controle de novas gravações e demandas." cor="#FF6900" />} />
      <Route path="/atualizacao" element={<Modulo titulo="Atualização" descricao="Materiais que precisam ser atualizados." cor="#B900E5" />} />
      <Route path="/remocao" element={<Modulo titulo="Remoção" descricao="Controle de materiais que devem sair da grade." cor="#E90058" />} />
      <Route path="*" element={<Modulo titulo="Página não encontrada" descricao="Verifique o endereço informado." cor="#777777" />} />
      <Route path="/Administracao" element={<Administracao />}/>
      <Route path="/definir-senha" element={<DefinirSenha />} />
    </Routes>
  </main>
}
