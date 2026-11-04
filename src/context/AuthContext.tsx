import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { modoDemo, supabase } from '../lib/supabase'
import type { Perfil } from '../types/materiais'

type AuthState = {
  carregando: boolean
  email: string | null
  perfil: Perfil | null
  erro: string | null
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(!modoDemo)
  const [email, setEmail] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (modoDemo) return
    if (!supabase) {
      setErro('Credenciais de desenvolvimento ausentes. Configure o .env.local.')
      setCarregando(false)
      return
    }

    let ativo = true
    const client = supabase
    async function carregar() {
      const { data: usuario, error: erroUsuario } = await client.auth.getUser()
      if (!ativo) return
      if (erroUsuario || !usuario.user) {
        setEmail(null)
        setPerfil(null)
        setErro(null)
        setCarregando(false)
        return
      }
      const { data: perfilAtual, error: erroPerfil } = await client
        .from('perfis')
        .select('id, nome, papel, ativo')
        .eq('id', usuario.user.id)
        .maybeSingle()
      if (!ativo) return
      setEmail(usuario.user.email ?? null)
      setPerfil((perfilAtual as Perfil | null) ?? null)
      setErro(erroPerfil ? 'Não foi possível verificar seu perfil.' : null)
      setCarregando(false)
    }

    void carregar()
    const { data: { subscription } } = client.auth.onAuthStateChange(() => {
      // Não executar chamadas Supabase assíncronas dentro do callback de Auth.
      setTimeout(() => { if (ativo) void carregar() }, 0)
    })
    return () => { ativo = false; subscription.unsubscribe() }
  }, [])

  async function sair() {
    if (supabase) await supabase.auth.signOut()
    setEmail(null)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ carregando, email, perfil, erro, sair }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth requer AuthProvider')
  return contexto
}
