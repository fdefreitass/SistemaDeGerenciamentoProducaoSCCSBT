import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router'
import { ChevronDown, Clapperboard, LayoutDashboard, LibraryBig, LogOut, RefreshCcw, ArchiveX, Users, UserRound } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { modoDemo, supabase } from './lib/supabase'
import logoBranca from './assets/SCC SBT BRANCA.png'
import Avatar from './components/Avatar'
import MeuPerfil from './pages/MeuPerfil'
import BoasVindas from './pages/BoasVindas'
import Conteudos from './pages/Conteudos'
import Home from './pages/Home'
import Login from './pages/Login'
import Modulo from './pages/Modulo'
import Administracao from './pages/Administracao'
import DefinirSenha from './pages/DefinirSenha'
import PrimeiroAcesso from './pages/PrimeiroAcesso'

const navegacao = [
  { rota: '/painel', texto: 'Visão geral', Icone: LayoutDashboard },
  { rota: '/conteudos', texto: 'Central de materiais', Icone: LibraryBig },
  { rota: '/gravacao', texto: 'Gravações', Icone: Clapperboard },
  { rota: '/atualizacao', texto: 'Atualizações', Icone: RefreshCcw },
  { rota: '/remocao', texto: 'Remoções', Icone: ArchiveX },
]

const titulos: Record<string, string> = {
  '/painel': 'VISÃO GERAL',
  '/conteudos': 'CENTRAL DE MATERIAIS',
  '/gravacao': 'GRAVAÇÕES',
  '/atualizacao': 'ATUALIZAÇÕES',
  '/remocao': 'REMOÇÕES',
  '/administracao': 'ADMINISTRAÇÃO',
  '/perfil': 'MEU PERFIL',
}

export default function App() {
  const { carregando, email, perfil, erro, sair } = useAuth()
  const { pathname } = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)
  const menuContaRef = useRef<HTMLDivElement>(null)
  const botaoPerfilRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMenuAberto(false)
  }, [pathname])

  useEffect(() => {
    if (!menuAberto) return

    const aoClicarFora = (evento: PointerEvent) => {
      if (evento.target instanceof Node && !menuContaRef.current?.contains(evento.target)) {
        setMenuAberto(false)
      }
    }
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        setMenuAberto(false)
        botaoPerfilRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', aoClicarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('pointerdown', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [menuAberto])

  // Ativação por e-mail conserva a validação interna do Supabase Auth.
  if (pathname === '/definir-senha') return <DefinirSenha />

  // Página institucional pública, separada do painel operacional.
  if (pathname === '/') return <BoasVindas />

  if (!modoDemo) {
    if (!supabase) return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] p-8 text-red-300">
        Configuração incompleta. Verifique as variáveis VITE_SUPABASE_*.
      </main>
    )
    if (carregando) return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white/65">
        Validando seu acesso…
      </main>
    )
    if (!email) return pathname === '/login' ? <Login /> : <Navigate to="/login" replace />
    if (erro || !perfil?.ativo) return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] p-6 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1f1f1f] p-8">
          <h1 className="text-2xl font-bold">Acesso não autorizado</h1>
          <p className="mt-4 text-sm leading-6 text-white/55">A conta não possui perfil ativo ou não foi possível verificar sua autorização.</p>
          <button onClick={() => void sair()} className="mt-7 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">Sair</button>
        </section>
      </main>
    )
    // A troca de senha continua obrigatória antes de acessar os módulos.
    if (perfil.troca_senha_pendente !== false) {
      return pathname === '/primeiro-acesso'
        ? <PrimeiroAcesso />
        : <Navigate to="/primeiro-acesso" replace />
    }
    if (pathname === '/primeiro-acesso') return <Navigate to="/painel" replace />
  }

  if (pathname === '/login') return modoDemo ? <Navigate to="/painel" replace /> : <Navigate to="/painel" replace />

  const administrador = !modoDemo && perfil?.papel === 'admin'
  const nome = modoDemo ? 'Demonstração local' : perfil?.nome || email || 'Colaborador'

  return (
    <div className="scc-app-body min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#050505]/95 backdrop-blur-xl">
        <div className="scc-app-header-inner grid min-h-[82px] grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_minmax(300px,1.65fr)_1fr]">
          <Link to="/" className="flex w-fit items-center" aria-label="Voltar à apresentação SCC Produção">
            <img src={logoBranca} alt="SCC SBT" className="scc-brand-logo w-auto object-contain" />
          </Link>
          <div className="hidden h-[48px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#1f1f1f] text-[12px] font-extrabold tracking-[.08em] lg:flex">
            {titulos[pathname.toLowerCase()] ?? 'PRODUÇÃO SCC SBT'}
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <div className="relative" ref={menuContaRef}>
              <button
                type="button"
                ref={botaoPerfilRef}
                aria-label={menuAberto ? 'Fechar menu da conta' : 'Abrir menu da conta'}
                aria-haspopup="true"
                aria-controls="menu-conta"
                aria-expanded={menuAberto}
                onClick={() => setMenuAberto(aberto => !aberto)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] p-1 pr-2 text-white transition hover:border-white/35 hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e2fa00]"
              >
                <Avatar id={perfil?.id} nome={nome} tamanho={42} />
                <span className="hidden max-w-[160px] truncate pl-1 text-xs font-semibold text-white/80 sm:inline">{nome}</span>
                <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-white/50 transition-transform ${menuAberto ? 'rotate-180' : ''}`} />
              </button>
              {menuAberto && (
                <nav
                  id="menu-conta"
                  aria-label="Menu da conta e navegação"
                  className="absolute right-0 top-[calc(100%+12px)] z-40 w-[min(300px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-white/15 bg-[#1f1f1f] p-2 shadow-2xl shadow-black/80"
                >
                  <div className="mb-2 border-b border-white/10 px-3 pb-3 pt-2">
                    <p className="truncate text-sm font-bold text-white">{nome}</p>
                    {!modoDemo && email && <p className="mt-1 truncate text-xs text-white/45">{email}</p>}
                  </div>
                  {navegacao.map(({ rota, texto, Icone }) => (
                    <NavLink
                      key={rota}
                      to={rota}
                      onClick={() => setMenuAberto(false)}
                      className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/[0.07] hover:text-white'}`}
                    >
                      <Icone size={17} />{texto}
                    </NavLink>
                  ))}
                  <div className="mt-2 border-t border-white/10 pt-2">
                    <NavLink to="/perfil" onClick={() => setMenuAberto(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/[0.07] hover:text-white'}`}>
                      <UserRound size={17} /> Meu Perfil
                    </NavLink>
                    {administrador && (
                      <NavLink to="/administracao" onClick={() => setMenuAberto(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/[0.07] hover:text-white'}`}>
                        <Users size={17} /> Usuários e acessos
                      </NavLink>
                    )}
                  </div>
                  {!modoDemo && (
                    <div className="mt-2 border-t border-white/10 pt-2">
                      <button
                        type="button"
                        onClick={() => { setMenuAberto(false); void sair() }}
                        aria-label={`Sair da conta de ${nome}`}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                      >
                        <LogOut size={17} /> Sair
                      </button>
                    </div>
                  )}
                </nav>
              )}
            </div>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/painel" element={<Home />} />
        <Route path="/conteudos" element={<Conteudos />} />
        <Route path="/gravacao" element={<Modulo titulo="Gravação" descricao="Controle de novas gravações e demandas." cor="#FF6900" />} />
        <Route path="/atualizacao" element={<Modulo titulo="Atualização" descricao="Materiais que precisam ser atualizados." cor="#B900E5" />} />
        <Route path="/remocao" element={<Modulo titulo="Remoção" descricao="Controle de materiais que devem sair da grade." cor="#E90058" />} />
        <Route path="/administracao" element={<Administracao />} />
        <Route path="/perfil" element={<MeuPerfil />} />
        <Route path="*" element={<Navigate to="/painel" replace />} />
      </Routes>
    </div>
  )
}
