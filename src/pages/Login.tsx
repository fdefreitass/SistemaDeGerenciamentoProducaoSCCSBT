import { useState, type FormEvent } from 'react'
import { obterSupabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      const { error } = await obterSupabase().auth.signInWithPassword({ email, password: senha })
      if (error) throw error
      setSenha('')
    } catch {
      setErro('Não foi possível entrar. Confira suas credenciais e a confirmação da conta.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-24 text-white">
      <form onSubmit={entrar} className="mx-auto max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#151515] p-8">
        <p className="text-xs font-bold tracking-widest text-blue-400">SCC SBT</p>
        <h1 className="text-3xl font-black">Acessar SCC Produção</h1>
        <p className="text-sm text-white/50">Acesso restrito aos usuários autorizados.</p>
        <div><label htmlFor="email" className="mb-2 block text-sm">E-mail</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-white/20 bg-black p-3 outline-none focus:border-blue-500" /></div>
        <div><label htmlFor="senha" className="mb-2 block text-sm">Senha</label>
          <input id="senha" type="password" autoComplete="current-password" required value={senha} onChange={e => setSenha(e.target.value)} className="w-full rounded-lg border border-white/20 bg-black p-3 outline-none focus:border-blue-500" /></div>
        {erro && <p role="alert" className="text-sm text-red-400">{erro}</p>}
        <button disabled={enviando} className="w-full rounded-lg bg-blue-600 p-3 font-semibold disabled:opacity-50">{enviando ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </main>
  )
}
