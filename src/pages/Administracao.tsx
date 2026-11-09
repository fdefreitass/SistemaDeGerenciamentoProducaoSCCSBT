import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Check, Copy, KeyRound, LockKeyhole, RefreshCw, Search, ShieldAlert, ShieldCheck, Trash2, UserRoundCog, UserRoundX, UserRoundCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { modoDemo } from '../lib/supabase'
import { listarUsuarios, redefinirSenhaUsuario, gerenciarUsuario, type AcaoGerenciamento, type UsuarioResumo } from '../services/usuarios'
import ConviteUsuario from '../components/ConviteUsuario'
import Avatar from '../components/Avatar'
import type { Papel } from '../types/materiais'

const nomesPapel = { admin: 'Administrador', editor: 'Editor', leitor: 'Leitor' }

export default function Administracao() {
  const { perfil } = useAuth()
  const administrador = Boolean(!modoDemo && perfil?.ativo && perfil.papel === 'admin')
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [alvo, setAlvo] = useState<UsuarioResumo | null>(null)
  const [confirma, setConfirma] = useState(false)
  const [senhaProvisoria, setSenhaProvisoria] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [alvoGestao, setAlvoGestao] = useState<UsuarioResumo | null>(null)
  const [acaoGestao, setAcaoGestao] = useState<AcaoGerenciamento>('alterar_papel')
  const [novoPapel, setNovoPapel] = useState<Papel>('leitor')
  const [confirmaGestao, setConfirmaGestao] = useState(false)
  const [nomeDigitado, setNomeDigitado] = useState('')
  const [adminDigitado, setAdminDigitado] = useState('')
  const [processandoGestao, setProcessandoGestao] = useState(false)
  const [sucesso, setSucesso] = useState('')

  async function carregar() {
    if (!administrador) return
    setAtualizando(true)
    try {
      const dados = await listarUsuarios()
      setUsuarios(dados)
      setErro('')
    } catch {
      setErro('Não foi possível carregar a lista de usuários.')
    } finally {
      setCarregando(false)
      setAtualizando(false)
    }
  }

  useEffect(() => {
    let ativo = true
    if (administrador) {
      void listarUsuarios()
        .then(dados => { if (ativo) { setUsuarios(dados); setErro('') } })
        .catch(() => { if (ativo) setErro('Não foi possível carregar a lista de usuários.') })
        .finally(() => { if (ativo) setCarregando(false) })
    }
    return () => { ativo = false }
  }, [administrador])

  function fecharDialogo() {
    if (processando) return
    setAlvo(null)
    setConfirma(false)
    setSenhaProvisoria('')
    setCopiado(false)
  }

  async function confirmarRedefinicao() {
    if (!administrador || !alvo || !confirma || processando || alvo.papel === 'admin') return
    setProcessando(true)
    setErro('')
    try {
      const nova = await redefinirSenhaUsuario(alvo.id)
      setSenhaProvisoria(nova)
      setConfirma(false)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao redefinir senha.')
    } finally {
      setProcessando(false)
    }
  }

  async function copiarSenha() {
    if (!senhaProvisoria) return
    try {
      await navigator.clipboard.writeText(senhaProvisoria)
      setCopiado(true)
    } catch {
      setErro('Não foi possível copiar automaticamente. Selecione e copie a senha manualmente.')
    }
  }

  function abrirGestao(usuario: UsuarioResumo, acao: AcaoGerenciamento) {
    if (usuario.id === perfil?.id) return
    setAlvoGestao(usuario)
    setAcaoGestao(acao)
    setNovoPapel(usuario.papel)
    setConfirmaGestao(false)
    setNomeDigitado('')
    setAdminDigitado('')
    setErro('')
    setSucesso('')
  }

  function fecharGestao() {
    if (processandoGestao) return
    setAlvoGestao(null)
    setConfirmaGestao(false)
    setNomeDigitado('')
    setAdminDigitado('')
  }

  async function executarGestao() {
    if (!administrador || !alvoGestao || !confirmaGestao || processandoGestao || alvoGestao.id === perfil?.id) return
    if (acaoGestao === 'alterar_papel' && (novoPapel === alvoGestao.papel ||
      (novoPapel === 'admin' && adminDigitado !== 'ADMIN'))) return
    if (acaoGestao === 'excluir' && nomeDigitado !== alvoGestao.nome) return

    const confirmacao = acaoGestao === 'alterar_papel'
      ? novoPapel === 'admin' ? 'CONCEDER ADMIN' : 'ALTERAR PERMISSAO'
      : acaoGestao === 'excluir' ? nomeDigitado
      : acaoGestao === 'desativar' ? 'DESATIVAR' : 'REATIVAR'

    setProcessandoGestao(true)
    setErro('')
    setSucesso('')
    try {
      const resultado = await gerenciarUsuario(alvoGestao.id, acaoGestao, confirmacao,
        acaoGestao === 'alterar_papel' ? novoPapel : undefined)
      await carregar()
      setAlvoGestao(null)
      setSucesso(resultado.mensagem)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível executar a ação.')
    } finally {
      setProcessandoGestao(false)
    }
  }

  if (!administrador) {
    return <section className="scc-fluid-content py-20">
      <h1 className="text-3xl font-bold">Acesso restrito</h1>
      <p className="mt-3 text-white/50">Esta área é exclusiva para administradores.</p>
      <Link to="/" className="mt-6 inline-block text-blue-400">Voltar ao início</Link>
    </section>
  }

  const termo = busca.trim().toLocaleLowerCase('pt-BR')
  const filtrados = usuarios.filter(u => (u.nome + ' ' + u.papel).toLocaleLowerCase('pt-BR').includes(termo))
  const ativos = usuarios.filter(u => u.ativo).length
  const pendentes = usuarios.filter(u => u.troca_senha_pendente).length

  return (
    <main className="scc-fluid-content pb-20 pt-10">
      <Link to="/painel" className="text-sm text-white/50 hover:text-white">← Voltar ao painel</Link>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold tracking-widest text-blue-400">ADMINISTRAÇÃO SCC SBT</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Gerenciamento de Usuários</h1>
          <p className="mt-3 text-sm text-white/50">Convites, fotos, permissões e recuperação segura de acesso.</p>
        </div>
        <button type="button" onClick={() => void carregar()} disabled={atualizando}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-40">
          <RefreshCw size={16} className={atualizando ? 'animate-spin' : ''} /> Atualizar lista
        </button>
      </div>
      <ConviteUsuario aoConvidar={() => void carregar()} />

      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { titulo: 'TOTAL DE USUÁRIOS', valor: usuarios.length },
          { titulo: 'USUÁRIOS ATIVOS', valor: ativos },
          { titulo: 'USUÁRIOS INATIVOS', valor: usuarios.length - ativos },
          { titulo: 'ATIVAÇÃO PENDENTE', valor: pendentes },
        ].map(indicador => <div key={indicador.titulo} className="rounded-2xl border border-white/10 bg-[#050505] px-5 py-5">
          <p className="text-[11px] font-semibold tracking-wide text-white/55">{indicador.titulo}</p>
          <p className="mt-3 text-3xl font-extrabold tabular-nums">{carregando ? '—' : indicador.valor}</p>
        </div>)}
      </div>

      <div className="relative mt-7">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"/>
        <input aria-label="Buscar usuários" type="search" placeholder="Pesquisar colaborador ou perfil..."
          value={busca} onChange={e => setBusca(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#050505] py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-400" />
      </div>

      {sucesso && <p role="status" className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-200">{sucesso}</p>}
      {erro && <p role="alert" className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">{erro}</p>}

      <section className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
            <colgroup>
              <col style={{width:'28%'}}/><col style={{width:'13%'}}/>
              <col style={{width:'17%'}}/><col style={{width:'14%'}}/><col style={{width:'28%'}}/>
            </colgroup>
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-white/55">
              <tr>
                <th scope="col" className="px-5 py-4">Colaborador</th>
                <th scope="col" className="px-5 py-4">Perfil</th>
                <th scope="col" className="px-5 py-4">Situação</th>
                <th scope="col" className="px-5 py-4">Cadastrado</th>
                <th scope="col" className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(usuario => (
                <tr key={usuario.id} className="border-t border-white/10 transition hover:bg-white/[0.035]">
                  <td className="px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar id={usuario.id} nome={usuario.nome} tamanho={44}/>
                      <span className="min-w-0 truncate font-semibold" title={usuario.nome}>{usuario.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-white/70">{nomesPapel[usuario.papel]}</td>
                  <td className="px-5 py-3.5">
                    <span className={usuario.ativo ? 'text-emerald-400' : 'text-red-400'}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    {usuario.troca_senha_pendente && <p className="mt-1 text-[11px] text-amber-400">Aguardando ativação/senha</p>}
                  </td>
                  <td className="px-5 py-3.5 text-white/55">{new Date(usuario.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td className="px-5 py-3.5 text-right">
                    {usuario.id === perfil?.id ? (
                      <span className="text-xs text-white/40">Sua conta</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => abrirGestao(usuario, 'alterar_papel')}
                          title="Alterar permissão" aria-label={`Alterar permissão de ${usuario.nome}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/65 transition hover:border-blue-400/50 hover:bg-blue-400/10 hover:text-blue-300">
                          <UserRoundCog size={16}/>
                        </button>
                        {usuario.papel !== 'admin' && (
                          <button type="button" title="Redefinir senha" aria-label={`Redefinir senha de ${usuario.nome}`}
                            disabled={processando} onClick={() => {
                              setAlvo(usuario)
                              setConfirma(false)
                              setSenhaProvisoria('')
                              setCopiado(false)
                              setErro('')
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/65 transition hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-300 disabled:opacity-40">
                            <KeyRound size={16}/>
                          </button>
                        )}
                        <button type="button"
                          onClick={() => abrirGestao(usuario, usuario.ativo ? 'desativar' : 'reativar')}
                          title={usuario.ativo ? 'Desativar acesso' : 'Reativar acesso'}
                          aria-label={`${usuario.ativo ? 'Desativar' : 'Reativar'} acesso de ${usuario.nome}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/65 transition hover:border-white/35 hover:bg-white/[0.07]">
                          {usuario.ativo ? <UserRoundX size={16}/> : <UserRoundCheck size={16}/>}
                        </button>
                        <button type="button" onClick={() => abrirGestao(usuario, 'excluir')}
                          title="Excluir usuário" aria-label={`Excluir usuário ${usuario.nome}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/20 text-red-300/65 transition hover:border-red-400/55 hover:bg-red-400/10 hover:text-red-300">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {carregando && <p className="p-8 text-center text-sm text-white/50">Carregando colaboradores...</p>}
        {!carregando && filtrados.length === 0 && !erro && <p className="p-8 text-center text-sm text-white/50">Nenhum usuário encontrado.</p>}
      </section>

      <p className="mt-5 text-xs leading-5 text-white/45">
        As fotos permanecem privadas e acessíveis apenas ao titular e a administradores.
        Ao redefinir uma senha, a anterior deixa de funcionar e o colaborador deverá criar uma nova.
      </p>

      {alvoGestao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="titulo-gestao"
            className="w-full max-w-[540px] rounded-3xl border border-white/15 bg-[#0d0e10] p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                {acaoGestao === 'excluir'
                  ? <Trash2 size={28} className="text-red-400"/>
                  : <ShieldCheck size={28} className="text-blue-400"/>}
                <h2 id="titulo-gestao" className="mt-4 text-2xl font-extrabold">
                  {acaoGestao === 'alterar_papel' ? 'Alterar permissões'
                    : acaoGestao === 'excluir' ? 'Excluir usuário'
                    : acaoGestao === 'desativar' ? 'Desativar acesso' : 'Reativar acesso'}
                </h2>
              </div>
              <button type="button" onClick={fecharGestao} disabled={processandoGestao}
                aria-label="Fechar janela" className="rounded-lg border border-white/10 p-2 text-white/65 hover:text-white disabled:opacity-40"><X size={18}/></button>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 p-3">
              <Avatar id={alvoGestao.id} nome={alvoGestao.nome} tamanho={42}/>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{alvoGestao.nome}</p>
                <p className="text-xs text-white/50">Atual: {nomesPapel[alvoGestao.papel]} · {alvoGestao.ativo ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>

            {acaoGestao === 'alterar_papel' && (
              <div className="mt-6">
                <label htmlFor="novo-papel" className="text-xs font-semibold text-white/65">Novo perfil de acesso</label>
                <select id="novo-papel" value={novoPapel} onChange={e => {
                    setNovoPapel(e.target.value as Papel)
                    setAdminDigitado('')
                    setConfirmaGestao(false)
                  }}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-blue-400">
                  <option value="leitor">Leitor — somente consulta</option>
                  <option value="editor">Editor — gerencia materiais</option>
                  <option value="admin">Administrador — acesso total</option>
                </select>
                {novoPapel === 'admin' && (
                  <div className="mt-4 space-y-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                    <p className="text-sm leading-5 text-amber-100">Atenção: conceder Administrador permite gerenciar usuários e materiais. Só é possível promover contas ativas com primeiro acesso concluído.</p>
                    <label htmlFor="confirmar-admin" className="block text-xs font-semibold text-white/65">
                      Para confirmar, digite <strong>ADMIN</strong>
                    </label>
                    <input id="confirmar-admin" value={adminDigitado} autoComplete="off"
                      onChange={e => setAdminDigitado(e.target.value)} placeholder="ADMIN"
                      className="w-full rounded-xl border border-white/15 bg-[#050505] px-4 py-3 text-sm outline-none focus:border-amber-400" />
                  </div>
                )}
              </div>
            )}

            {acaoGestao === 'excluir' && (
              <div className="mt-6 space-y-4">
                <p className="rounded-xl border border-red-400/25 bg-red-400/5 p-4 text-sm leading-6 text-white/75">
                  Esta operação remove definitivamente a conta e não pode ser desfeita.
                  Caso existam materiais, seções ou histórico ligados a esta pessoa, a exclusão será recusada.
                  Nesse caso, use <strong>Desativar acesso</strong> para preservar os registros.
                </p>
                <label htmlFor="confirmar-exclusao" className="block text-xs font-semibold text-white/70">
                  Digite exatamente <strong className="text-white">{alvoGestao.nome}</strong> para confirmar
                </label>
                <input id="confirmar-exclusao" value={nomeDigitado} autoComplete="off"
                  onChange={e => setNomeDigitado(e.target.value)} placeholder="Nome do colaborador"
                  className="w-full rounded-xl border border-white/15 bg-[#050505] px-4 py-3 text-sm outline-none focus:border-red-400" />
              </div>
            )}

            {acaoGestao === 'desativar' && (
              <p className="mt-5 text-sm leading-6 text-white/65">
                A pessoa continuará registrada para preservar a autoria e o histórico, mas perderá imediatamente o acesso às informações protegidas do SCC Produção.
              </p>
            )}
            {acaoGestao === 'reativar' && (
              <p className="mt-5 text-sm leading-6 text-white/65">
                A conta voltará a ter acesso conforme seu papel atual e situação da senha.
              </p>
            )}

            {erro && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{erro}</p>}

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4 text-sm leading-5 text-white/70">
              <input type="checkbox" checked={confirmaGestao} onChange={e => setConfirmaGestao(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-blue-400"/>
              Confirmo que revisei o usuário, a ação selecionada e suas consequências.
            </label>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={fecharGestao} disabled={processandoGestao}
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 disabled:opacity-40">
                Cancelar
              </button>
              <button type="button" onClick={() => void executarGestao()}
                disabled={processandoGestao || !confirmaGestao ||
                  (acaoGestao === 'alterar_papel' && (novoPapel === alvoGestao.papel || (novoPapel === 'admin' && adminDigitado !== 'ADMIN'))) ||
                  (acaoGestao === 'excluir' && nomeDigitado !== alvoGestao.nome)}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-35 ${acaoGestao === 'excluir' ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>
                {acaoGestao === 'excluir' && <Trash2 size={16}/>}
                {processandoGestao ? 'Processando...' :
                  acaoGestao === 'excluir' ? 'Excluir definitivamente' :
                  acaoGestao === 'alterar_papel' ? 'Salvar permissão' :
                  acaoGestao === 'desativar' ? 'Desativar conta' : 'Reativar conta'}
              </button>
            </div>
          </section>
        </div>
      )}

      {alvo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="titulo-redefinicao"
            className="w-full max-w-[520px] rounded-3xl border border-white/15 bg-[#0d0e10] p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <ShieldAlert size={28} className={senhaProvisoria ? 'text-emerald-400' : 'text-amber-400'} />
                <h2 id="titulo-redefinicao" className="mt-4 text-2xl font-extrabold">
                  {senhaProvisoria ? 'Senha provisória gerada' : 'Redefinir senha do usuário'}
                </h2>
              </div>
              <button type="button" onClick={fecharDialogo} disabled={processando}
                aria-label="Fechar" className="rounded-lg border border-white/10 p-2 text-white/65 hover:text-white"><X size={18} /></button>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/65">
              {senhaProvisoria
                ? 'A senha antiga foi substituída. Copie a senha abaixo e envie somente ao colaborador em um canal privado. Ela não poderá ser consultada novamente nesta página.'
                : <>A conta <strong className="text-white">{alvo.nome}</strong> receberá uma nova senha provisória. O acesso à Central de Materiais ficará bloqueado até a troca obrigatória.</>}
            </p>
            {senhaProvisoria ? (
              <div className="mt-6 space-y-3">
                <label htmlFor="senha-provisoria" className="text-xs font-semibold text-white/60">Senha provisória — mostrada uma única vez</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input id="senha-provisoria" aria-label="Senha provisória gerada" value={senhaProvisoria} readOnly
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#050505] p-3 font-mono text-xs text-white" />
                  <button type="button" onClick={() => void copiarSenha()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black">
                    {copiado ? <Check size={15}/> : <Copy size={15}/>}
                    {copiado ? 'Copiada!' : 'Copiar'}
                  </button>
                </div>
              </div>
            ) : (
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-5 text-white/70">
                <input type="checkbox" checked={confirma} onChange={e => setConfirma(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-amber-400" />
                Confirmo que desejo substituir a senha do usuário e entendo que ele precisará realizar uma nova ativação de senha.
              </label>
            )}
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={fecharDialogo} disabled={processando}
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/75">
                {senhaProvisoria ? 'Concluir e fechar' : 'Cancelar'}
              </button>
              {!senhaProvisoria && <button type="button" disabled={!confirma || processando}
                onClick={() => void confirmarRedefinicao()}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-black disabled:cursor-not-allowed disabled:opacity-35">
                <LockKeyhole size={17}/> {processando ? 'Redefinindo...' : 'Gerar nova senha'}
              </button>}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
