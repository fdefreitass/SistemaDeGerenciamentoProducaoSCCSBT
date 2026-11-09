import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Camera, Check, LockKeyhole, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'
import { modoDemo, obterSupabase } from '../lib/supabase'

const campo = 'mt-2 w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition focus:border-[#dff900]/60 disabled:opacity-50'
const papeis: Record<string, string> = { admin: 'Administrador', editor: 'Editor', leitor: 'Leitor' }
const bucket = 'scc-avatars'
const limiteFoto = 2 * 1024 * 1024
const formatos = ['image/jpeg', 'image/png', 'image/webp']

export default function MeuPerfil() {
  const navegar = useNavigate()
  const { perfil, email, recarregarPerfil, atualizarAvatar, sair } = useAuth()
  const [nome, setNome] = useState(perfil?.nome ?? '')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => { setNome(perfil?.nome ?? '') }, [perfil?.nome])

  const somenteDemo = modoDemo || !perfil?.ativo
  const caminhoFoto = perfil ? `${perfil.id}/avatar` : ''

  async function salvarNome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (ocupado || somenteDemo || !perfil) return
    const valor = nome.trim().replace(/\s+/g, ' ')
    if (valor.length < 2 || valor.length > 100) {
      setErro('Informe um nome com 2 a 100 caracteres.')
      return
    }
    setOcupado(true)
    setErro('')
    setSucesso('')
    try {
      const { data, error } = await obterSupabase().from('perfis')
        .update({ nome: valor }).eq('id', perfil.id).select('id, nome').single()
      if (error || !data) throw new Error('Atualização não autorizada.')
      await recarregarPerfil()
      setSucesso('Nome atualizado em seu perfil.')
    } catch {
      setErro('Não foi possível salvar seu nome. Verifique se a migração 03 foi aplicada.')
    } finally { setOcupado(false) }
  }

  async function salvarFoto(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    event.target.value = ''
    if (!arquivo || !perfil || ocupado || somenteDemo) return
    if (!formatos.includes(arquivo.type)) {
      setErro('Envie uma imagem JPG, PNG ou WebP.')
      return
    }
    if (arquivo.size > limiteFoto || arquivo.size === 0) {
      setErro('A foto precisa ter até 2 MB.')
      return
    }
    setOcupado(true)
    setErro('')
    setSucesso('')
    try {
      const { error } = await obterSupabase().storage.from(bucket).upload(caminhoFoto, arquivo, {
        upsert: true, contentType: arquivo.type, cacheControl: '60',
      })
      if (error) throw error
      atualizarAvatar()
      setSucesso('Foto atualizada com sucesso.')
    } catch {
      setErro('Não foi possível enviar a foto. Verifique se o bucket privado e as políticas da migração 03 estão ativos.')
    } finally { setOcupado(false) }
  }

  async function removerFoto() {
    if (!perfil || ocupado || somenteDemo) return
    setOcupado(true)
    setErro('')
    setSucesso('')
    try {
      const { error } = await obterSupabase().storage.from(bucket).remove([caminhoFoto])
      if (error) throw error
      atualizarAvatar()
      setSucesso('Foto removida. Suas iniciais serão exibidas no cabeçalho.')
    } catch {
      setErro('Não foi possível remover a foto. Verifique as permissões do armazenamento.')
    } finally { setOcupado(false) }
  }

  async function trocarSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (ocupado || somenteDemo || !perfil || !email) return
    if (senhaNova.length < 12 || senhaNova.length > 128) {
      setErro('A nova senha deve ter entre 12 e 128 caracteres.')
      return
    }
    if (senhaNova !== confirmarSenha) {
      setErro('A confirmação não corresponde à nova senha.')
      return
    }
    if (senhaNova === senhaAtual) {
      setErro('Escolha uma senha diferente da atual.')
      return
    }
    setOcupado(true)
    setErro('')
    setSucesso('')
    try {
      const client = obterSupabase()
      // Revalidamos a senha atual junto ao provedor, mesmo se a configuração
      // opcional "Require current password" estiver desativada no painel.
      const { data: validacao, error: erroValidacao } = await client.auth.signInWithPassword({
        email, password: senhaAtual,
      })
      if (erroValidacao || validacao.user?.id !== perfil.id) {
        throw new Error('Senha atual incorreta.')
      }

      const { error } = await client.auth.updateUser({
        current_password: senhaAtual,
        password: senhaNova,
      })
      if (error) throw error

      setSenhaAtual('')
      setSenhaNova('')
      setConfirmarSenha('')
      await sair()
      navegar('/login?senha=alterada', { replace: true })
    } catch {
      setErro('Não foi possível alterar a senha. Confira a senha atual e os requisitos de segurança.')
    } finally { setOcupado(false) }
  }

  return <main className="scc-fluid-content pb-20 pt-9">
    <div className="mb-8">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[#e2fa00]">CONFIGURAÇÕES DE CONTA</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Meu Perfil</h1>
      <p className="mt-3 text-sm text-white/50">Atualize suas informações pessoais sem alterar suas permissões de acesso.</p>
    </div>

    {modoDemo && <p className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">Modo demonstração: alterações desativadas.</p>}
    {erro && <p role="alert" className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{erro}</p>}
    {sucesso && <p role="status" className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{sucesso}</p>}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
      <div className="space-y-6">
        <section className="rounded-[22px] border border-white/10 bg-[#050505] p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Camera size={19} className="text-[#e2fa00]" /> Foto de perfil</h2>
          <p className="mt-2 text-xs leading-5 text-white/45">Imagem privada, visível apenas na sua conta. JPG, PNG ou WebP, até 2 MB.</p>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Avatar id={perfil?.id} nome={perfil?.nome || email || 'SCC Produção'} tamanho={104} />
            <div className="flex flex-wrap gap-2">
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-black transition hover:bg-white/85 ${ocupado || somenteDemo ? 'pointer-events-none opacity-50' : ''}`}>
                <Camera size={15} /> Enviar foto
                <input type="file" className="sr-only" aria-label="Selecionar foto de perfil" accept="image/jpeg,image/png,image/webp"
                  disabled={ocupado || somenteDemo} onChange={e => void salvarFoto(e)} />
              </label>
              <button type="button" onClick={() => void removerFoto()} disabled={ocupado || somenteDemo}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs text-white/70 transition hover:bg-white/5 disabled:opacity-40">
                <Trash2 size={15} /> Remover foto
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-white/10 bg-[#050505] p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold"><UserRound size={19} className="text-[#e2fa00]" /> Dados pessoais</h2>
          <form onSubmit={e => void salvarNome(e)} className="mt-6 space-y-5">
            <div>
              <label htmlFor="perfil-nome" className="text-xs font-semibold text-white/70">Seu nome</label>
              <input id="perfil-nome" value={nome} onChange={e => setNome(e.target.value)}
                minLength={2} maxLength={100} required disabled={ocupado || somenteDemo} className={campo} />
            </div>
            <div>
              <label htmlFor="perfil-email" className="text-xs font-semibold text-white/70">E-mail de acesso</label>
              <input id="perfil-email" value={email ?? ''} readOnly className={campo + ' cursor-not-allowed opacity-60'} />
              <p className="mt-2 text-xs text-white/35">Para alterar o e-mail, procure o administrador do sistema.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/70">Perfil de acesso</p>
              <p className="mt-2 text-sm text-white/50">{perfil ? papeis[perfil.papel] ?? perfil.papel : 'Demonstração'}</p>
              <p className="mt-1 text-xs text-white/35">As permissões não podem ser alteradas nesta página.</p>
            </div>
            <button type="submit" disabled={ocupado || somenteDemo}
              className="inline-flex items-center gap-2 rounded-xl bg-[#e2fa00] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#f0ff6d] disabled:opacity-40">
              <Check size={16} /> Salvar informações
            </button>
          </form>
        </section>
      </div>

      <section className="h-fit rounded-[22px] border border-white/10 bg-[#050505] p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold"><LockKeyhole size={19} className="text-[#e2fa00]" /> Alterar senha</h2>
        <p className="mt-2 text-xs leading-5 text-white/45">Informe a senha atual para confirmar que a conta pertence a você. Após a alteração, será necessário entrar novamente.</p>
        <form onSubmit={e => void trocarSenha(e)} className="mt-6 space-y-5">
          <div>
            <label htmlFor="senha-atual-perfil" className="text-xs font-semibold text-white/70">Senha atual</label>
            <input id="senha-atual-perfil" type="password" autoComplete="current-password"
              required value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} disabled={ocupado || somenteDemo} className={campo} />
          </div>
          <div>
            <label htmlFor="nova-senha-perfil" className="text-xs font-semibold text-white/70">Nova senha</label>
            <input id="nova-senha-perfil" type="password" autoComplete="new-password" minLength={12} maxLength={128}
              required value={senhaNova} onChange={e => setSenhaNova(e.target.value)} disabled={ocupado || somenteDemo} className={campo} />
            <p className="mt-2 text-xs text-white/35">Mínimo de 12 caracteres. Evite senhas já utilizadas.</p>
          </div>
          <div>
            <label htmlFor="confirmar-senha-perfil" className="text-xs font-semibold text-white/70">Confirmar nova senha</label>
            <input id="confirmar-senha-perfil" type="password" autoComplete="new-password" minLength={12}
              required value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} disabled={ocupado || somenteDemo} className={campo} />
          </div>
          <button type="submit" disabled={ocupado || somenteDemo}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.09] px-5 py-3 text-sm font-bold transition hover:bg-white/[0.15] disabled:opacity-40">
            <ShieldCheck size={16} /> {ocupado ? 'Processando...' : 'Confirmar troca de senha'}
          </button>
        </form>
      </section>
    </div>
  </main>
}
