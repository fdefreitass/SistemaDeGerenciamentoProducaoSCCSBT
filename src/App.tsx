import { useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router'
import {
  Clapperboard, LayoutDashboard, LibraryBig, RefreshCcw, ArchiveX,
  UsersRound, Menu, X, LogOut, ChevronRight, ShieldCheck, Sparkles,
} from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { modoDemo, supabase } from './lib/supabase'
import Conteudos from './pages/Conteudos'
import Home from './pages/Home'
import Login from './pages/Login'
import Modulo from './pages/Modulo'
import Administracao from './pages/Administracao'
import DefinirSenha from './pages/DefinirSenha'
import PrimeiroAcesso from './pages/PrimeiroAcesso'

const modulos = [
  { rota: '/', titulo: 'Visão geral', Icone: LayoutDashboard },
  { rota: '/conteudos', titulo: 'Central de materiais', Icone: LibraryBig },
  { rota: '/gravacao', titulo: 'Gravações', Icone: Clapperboard },
  { rota: '/atualizacao', titulo: 'Atualizações', Icone: RefreshCcw },
  { rota: '/remocao', titulo: 'Remoções', Icone: ArchiveX },
]

const nomesPagina: Record<string, string> = {
  '/': 'Visão geral',
  '/conteudos': 'Central de materiais',
  '/gravacao': 'Gravações',
  '/atualizacao': 'Atualizações',
  '/remocao': 'Remoções',
  '/administracao': 'Administração',
}

export default function App() {
  const { carregando, email, perfil, erro, sair } = useAuth()
  const { pathname } = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  // A rota de ativação mantém a autorização própria do Supabase Auth.
  if (pathname === '/definir-senha') return <DefinirSenha />

  if (!modoDemo) {
    if (!supabase) {
      return <main className="flex min-h-screen items-center justify-center bg-[#080b11] p-8 text-red-300">
        Configuração incompleta. Verifique as variáveis de ambiente do Supabase.
      </main>
    }
    if (carregando) {
      return <main className="flex min-h-screen items-center justify-center bg-[#080b11] text-white/60">
        Validando seu acesso ao SCC Produção…
      </main>
    }
    if (!email) return <Login />
    if (erro || !perfil?.ativo) {
      return <main className="flex min-h-screen items-center justify-center bg-[#080b11] px-6 text-white">
        <div className="scc-panel w-full max-w-md p-8">
          <ShieldCheck size={30} className="mb-5 text-blue-400" />
          <h1 className="text-2xl font-bold">Acesso não autorizado</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            A conta não possui perfil ativo ou não foi possível verificar sua autorização.
          </p>
          <button onClick={() => void sair()} className="scc-primary mt-7">Sair da conta</button>
        </div>
      </main>
    }
    if (perfil.troca_senha_pendente !== false) {
      return pathname === '/primeiro-acesso'
        ? <PrimeiroAcesso />
        : <Navigate to="/primeiro-acesso" replace />
    }
    if (pathname === '/primeiro-acesso') return <Navigate to="/" replace />
  }

  const administrador = !modoDemo && perfil?.papel === 'admin'
  const nome = modoDemo ? 'Visualização local' : (perfil?.nome || email || 'Colaborador')
  const iniciais = nome.trim().slice(0, 2).toLocaleUpperCase('pt-BR')
  const tituloAtual = nomesPagina[pathname.toLowerCase()] ?? 'SCC Produção'

  const menu = (
    <>
      <Link to="/" onClick={() => setMenuAberto(false)} className="flex items-center gap-3 px-5 py-7">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-700 text-lg font-black text-white shadow-lg shadow-blue-600/20">S</span>
        <span>
          <strong className="block text-[15px] font-extrabold tracking-tight text-white">SCC Produção</strong>
          <small className="block text-[10px] font-bold tracking-[0.18em] text-white/35">GESTÃO DE CONTEÚDOS</small>
        </span>
      </Link>
      <div className="mx-5 h-px bg-white/[0.07]" />
      <div className="px-4 pt-8">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Workspace</p>
        <nav className="mt-4 space-y-1" aria-label="Navegação principal">
          {modulos.map(({ rota, titulo, Icone }) => (
            <NavLink
              key={rota}
              to={rota}
              end={rota === '/'}
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold transition-all ${isActive
                  ? 'border border-blue-500/25 bg-blue-500/15 text-white shadow-inner shadow-blue-500/5'
                  : 'border border-transparent text-white/55 hover:bg-white/5 hover:text-white'}`
              }
            >
              <Icone size={18} strokeWidth={1.9} className="shrink-0" />
              <span className="flex-1">{titulo}</span>
              <ChevronRight size={14} className="opacity-0 transition-opacity group-hover:opacity-60" />
            </NavLink>
          ))}
        </nav>
      </div>
      {administrador && (
        <div className="px-4 pt-8">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Gestão</p>
          <NavLink
            to="/administracao"
            onClick={() => setMenuAberto(false)}
            className={({ isActive }) => `mt-4 flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold transition-colors ${isActive ? 'bg-blue-500/15 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}
          >
            <UsersRound size={18} strokeWidth={1.9} /> Usuários e acessos
          </NavLink>
        </div>
      )}
      <div className="mt-auto p-5">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/80">
            <Sparkles size={15} className="text-blue-400" /> Produção conectada
          </div>
          <p className="text-[11px] leading-5 text-white/40">Organização, visibilidade e agilidade em cada entrega.</p>
        </div>
        <p className="mt-5 px-1 text-[10px] text-white/25">SCC SBT · Painel de produção</p>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-[#080b11] text-white">
      {menuAberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuAberto(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-white/[0.07] bg-[#0e121b] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${menuAberto ? 'translate-x-0' : '-translate-x-full'}`}>
        <button className="absolute right-3 top-7 rounded-lg p-2 text-white/50 hover:text-white lg:hidden" onClick={() => setMenuAberto(false)} aria-label="Fechar menu">
          <X size={20} />
        </button>
        {menu}
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-4 border-b border-white/[0.07] bg-[#0a0d14]/95 px-5 backdrop-blur-xl md:px-9">
          <div className="flex min-w-0 items-center gap-4">
            <button className="rounded-xl border border-white/10 p-2.5 text-white/70 hover:bg-white/5 lg:hidden" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
              <Menu size={21} />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 sm:block">SCC SBT / PRODUÇÃO</p>
              <p className="truncate text-sm font-bold text-white sm:mt-1">{tituloAtual}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {modoDemo && <span className="hidden rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-amber-300 sm:block">DEMONSTRAÇÃO LOCAL</span>}
            <div className="hidden text-right md:block">
              <p className="max-w-40 truncate text-xs font-bold text-white/90">{nome}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">{modoDemo ? 'Ambiente local' : (perfil?.papel ?? 'Colaborador')}</p>
            </div>
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-400/20 bg-gradient-to-br from-blue-500/25 to-violet-600/25 text-xs font-black text-blue-200">{iniciais}</span>
            {!modoDemo && <button onClick={() => void sair()} title="Sair do sistema" aria-label="Sair do sistema" className="rounded-xl border border-white/10 p-2.5 text-white/50 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"><LogOut size={17} /></button>}
          </div>
        </header>
        <div className="min-h-[calc(100vh-76px)]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/conteudos" element={<Conteudos />} />
            <Route path="/gravacao" element={<Modulo titulo="Gravações" descricao="Demandas em produção, gravação e aprovação." cor="#ff9d4d" />} />
            <Route path="/atualizacao" element={<Modulo titulo="Atualizações" descricao="Materiais que precisam de ajustes para permanecer na grade." cor="#ab86ff" />} />
            <Route path="/remocao" element={<Modulo titulo="Remoções" descricao="Acompanhe conteúdos retirados e fora da grade." cor="#ff668e" />} />
            <Route path="/administracao" element={<Administracao />} />
            <Route path="*" element={<div className="mx-auto max-w-3xl px-8 py-24"><h1 className="text-3xl font-bold">Página não encontrada</h1><Link className="mt-5 inline-block text-blue-400" to="/">Voltar à visão geral</Link></div>} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
