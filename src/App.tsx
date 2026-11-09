import { useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router'
import { ArrowLeft, ChevronDown, Clapperboard, Home as HomeIcon, LibraryBig, LogOut, Menu, RefreshCcw, ArchiveX, Users } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { modoDemo, supabase } from './lib/supabase'
import Conteudos from './pages/Conteudos'
import Home from './pages/Home'
import Login from './pages/Login'
import Modulo from './pages/Modulo'
import Administracao from './pages/Administracao'
import DefinirSenha from './pages/DefinirSenha'
import PrimeiroAcesso from './pages/PrimeiroAcesso'

const navegacao = [
  { rota: '/', texto: 'Início', Icone: HomeIcon },
  { rota: '/conteudos', texto: 'Conteúdos', Icone: LibraryBig },
  { rota: '/gravacao', texto: 'Gravação', Icone: Clapperboard },
  { rota: '/atualizacao', texto: 'Atualização', Icone: RefreshCcw },
  { rota: '/remocao', texto: 'Remoção', Icone: ArchiveX },
]

export default function App() {
  const { carregando, email, perfil, erro, sair } = useAuth()
  const { pathname } = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  // A ativação por e-mail conserva sua própria validação pelo Supabase.
  if (pathname === '/definir-senha') return <DefinirSenha />

  if (!modoDemo) {
    if (!supabase) return (
      <main className="min-h-screen bg-black p-10 text-red-300">
        Configuração incompleta. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.
      </main>
    )
    if (carregando) return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white/70">
        Validando acesso...
      </main>
    )
    if (!email) return <Login />
    if (erro || !perfil?.ativo) return (
      <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
        <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141414] p-8">
          <h1 className="text-2xl font-bold">Acesso não autorizado</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            A conta não possui perfil ativo ou não foi possível verificar sua autorização.
          </p>
          <button onClick={() => void sair()} className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">Sair</button>
        </section>
      </main>
    )
    if (perfil.troca_senha_pendente !== false) {
      return pathname === '/primeiro-acesso'
        ? <PrimeiroAcesso />
        : <Navigate to="/primeiro-acesso" replace />
    }
    if (pathname === '/primeiro-acesso') return <Navigate to="/" replace />
  }

  const administrador = !modoDemo && perfil?.papel === 'admin'
  const nome = modoDemo ? 'Demonstração local' : perfil?.nome || email || 'Colaborador'

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="relative z-30 border-b border-white/[0.07] bg-[#050505]">
        <div className="mx-auto grid h-[94px] max-w-[1760px] grid-cols-[1fr_auto] items-center gap-4 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(300px,1.65fr)_1fr] lg:px-12">
          <Link to="/" className="flex w-fit items-center gap-2" aria-label="Início do SCC Produção">
            <span className="inline-flex h-11 min-w-16 items-center justify-center rounded-full bg-white px-2 text-[19px] font-black tracking-tighter text-black">scc</span>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[21px] font-black tracking-tighter text-black">sbt</span>
          </Link>
          <div className="hidden h-[54px] items-center justify-center rounded-2xl border border-white/[0.05] bg-[#171717] text-sm font-extrabold tracking-[0.01em] lg:flex">
            PRODUÇÃO SCC SBT
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAberto(aberto => !aberto)}
                aria-expanded={menuAberto}
                aria-controls="menu-principal"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#141414] px-3 py-3 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-[#202020]"
              >
                <Menu size={17} />
                <span className="hidden sm:inline">Menu</span>
                <ChevronDown size={13} className={`hidden transition-transform sm:inline ${menuAberto ? 'rotate-180' : ''}`} />
              </button>
              {menuAberto && (
                <div id="menu-principal" className="absolute right-0 top-[calc(100%+12px)] z-40 w-64 rounded-2xl border border-white/15 bg-[#171717] p-2 shadow-2xl shadow-black/80">
                  {navegacao.map(({ rota, texto, Icone }) => (
                    <NavLink
                      key={rota}
                      to={rota}
                      end={rota === '/'}
                      onClick={() => setMenuAberto(false)}
                      className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'}`}
                    >
                      <Icone size={17} />{texto}
                    </NavLink>
                  ))}
                  {administrador && (
                    <NavLink to="/administracao" onClick={() => setMenuAberto(false)} className="mt-2 flex items-center gap-3 border-t border-white/10 px-3 py-3 text-sm text-white/65 hover:text-white">
                      <Users size={17} /> Administração
                    </NavLink>
                  )}
                </div>
              )}
            </div>
            {!modoDemo && (
              <button
                type="button"
                onClick={() => void sair()}
                title={`Sair da conta de ${nome}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-black transition hover:bg-white/85 sm:px-6"
              >
                <LogOut size={15} />
                <span>SAIR</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {pathname !== '/' && (
        <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-3 px-5 pt-5 text-xs sm:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white/55 transition hover:text-white">
            <ArrowLeft size={15} /> Voltar ao início
          </Link>
          <span className="truncate text-white/30">{nome}</span>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/conteudos" element={<Conteudos />} />
        <Route path="/gravacao" element={<Modulo titulo="Gravação" descricao="Controle de novas gravações e demandas." cor="#FF6900" />} />
        <Route path="/atualizacao" element={<Modulo titulo="Atualização" descricao="Materiais que precisam ser atualizados." cor="#B900E5" />} />
        <Route path="/remocao" element={<Modulo titulo="Remoção" descricao="Controle de materiais que devem sair da grade." cor="#E90058" />} />
        <Route path="/administracao" element={<Administracao />} />
        <Route path="*" element={<Modulo titulo="Página não encontrada" descricao="Verifique o endereço informado." cor="#777777" />} />
      </Routes>
    </div>
  )
}
