import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2, ClipboardCopy, FileCheck2, Film, Plus, Pencil, Trash2, UploadCloud, Download, RotateCcw } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { modoDemo, supabase } from '../lib/supabase'

type TipoMaterial = { codigo: string; nome: string; ativo: boolean; drive_folder_id?: string | null }
type Destino = { id: string; tipo: string; nome: string; drive_folder_id: string | null; ativo: boolean }

const tiposIniciais: TipoMaterial[] = [{codigo:'CH',nome:'Chamada',ativo:true},{codigo:'VT',nome:'Videotape',ativo:true},{codigo:'VH',nome:'Vinheta',ativo:true},{codigo:'CALHAU',nome:'Calhau',ativo:true}]

function dataLocal() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function normalizeName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    .replace(/[^A-Z0-9 -]/g, '').replace(/\s+/g, ' ').trim()
}

export default function Padronizacao() {
  const { perfil } = useAuth()
  const admin = perfil?.papel === 'admin'
  const [destinos, setDestinos] = useState<Destino[]>([])
  const [tipos, setTipos] = useState<TipoMaterial[]>(tiposIniciais)
  const [gerenciarTipos, setGerenciarTipos] = useState(false)
  const [novoTipoCodigo, setNovoTipoCodigo] = useState('')
  const [novoTipoNome, setNovoTipoNome] = useState('')
  const [erroTipo, setErroTipo] = useState('')
  const [salvandoTipo, setSalvandoTipo] = useState(false)
  const [edicao, setEdicao] = useState<{categoria:'tipo'|'destino'; id:string; codigo:string; anterior:string; nome:string}|null>(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState('')
  const [novoDestino, setNovoDestino] = useState('')
  const [gerenciar, setGerenciar] = useState(false)
  const [erroDestino, setErroDestino] = useState('')
  const [salvandoDestino, setSalvandoDestino] = useState(false)
  const [conectandoDrive, setConectandoDrive] = useState(false)
  const [erroDrive, setErroDrive] = useState('')
  const [driveConectado, setDriveConectado] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase || modoDemo) return
    let ativo = true
    void supabase.from('tipos_padronizacao').select('codigo,nome,ativo,drive_folder_id').order('nome').then(({data,error}) => {
      if (!ativo) return
      if (error) setErroTipo('Não foi possível carregar os tipos de material.')
      else setTipos((data ?? []) as TipoMaterial[])
    })
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    if (!supabase || modoDemo) return
    let ativo = true
    void supabase.from('destinos_padronizacao').select('id,tipo,nome,drive_folder_id,ativo').order('nome').then(({ data, error }) => {
      if (!ativo) return
      if (error) setErroDestino('Não foi possível carregar os destinos.')
      else setDestinos((data ?? []) as Destino[])
    })
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    if (!supabase || modoDemo) return
    let ativo = true
    void (async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession()
        if (!session) return
        const response = await fetch('https://uppdvhtmvprtwtppcfdm.supabase.co/functions/v1/google-drive-status', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        const data = await response.json()
        if (ativo && response.ok) setDriveConectado(data.connected === true)
      } catch { if (ativo) setErroDrive('Não foi possível verificar o status do Google Drive.') }
    })()
    return () => { ativo = false }
  }, [])

  async function conectarDrive() {
    if (!supabase || !admin) return
    setConectandoDrive(true)
    setErroDrive('')
    try {
      const {data:{session}} = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada. Entre novamente.')
      const response = await fetch('https://uppdvhtmvprtwtppcfdm.supabase.co/functions/v1/google-drive-oauth-callback', {
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`}
      })
      const payload = await response.json()
      if (!response.ok || !payload.authorization_url) throw new Error(payload.error || 'Não foi possível iniciar a conexão.')
      window.location.assign(payload.authorization_url)
    } catch (error) {
      setErroDrive(error instanceof Error ? error.message : 'Falha ao conectar o Drive.')
      setConectandoDrive(false)
    }
  }

  async function vincularTipoDrive(codigo:string) {
    if(!supabase || !admin) return
    const {data:{session}}=await supabase.auth.getSession()
    if(!session) throw new Error('Sessão expirada.')
    const response=await fetch('https://uppdvhtmvprtwtppcfdm.supabase.co/functions/v1/google-drive-criar-pasta',{
      method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},
      body:JSON.stringify({tipo_codigo:codigo})
    })
    const result=await response.json()
    if(!response.ok || !result.folder_id) throw new Error(result.error||'Não foi possível criar a categoria no Drive.')
    setTipos(atual=>atual.map(t=>t.codigo===codigo?{...t,drive_folder_id:result.folder_id}:t))
  }
  async function criarPastaTipo(codigo:string) {
    if(salvandoTipo)return
    setSalvandoTipo(true);setErroTipo('')
    try{await vincularTipoDrive(codigo)}
    catch(error){setErroTipo(error instanceof Error?error.message:'Falha ao criar pasta')}
    finally{setSalvandoTipo(false)}
  }
  async function adicionarTipo() {
    if (!supabase || !admin) return
    const codigo = novoTipoCodigo.toUpperCase().replace(/[^A-Z0-9]/g,'')
    const nome = novoTipoNome.trim()
    if (!/^[A-Z][A-Z0-9]{1,11}$/.test(codigo) || !nome) { setErroTipo('Informe um código de 2 a 12 caracteres e uma descrição.'); return }
    setSalvandoTipo(true); setErroTipo('')
    const existente = tipos.find(item => item.codigo === codigo)
    if (existente?.ativo) { setErroTipo('Este código já está em uso. Utilize a opção de editar.'); setSalvandoTipo(false); return }
    const consulta = existente
      ? await supabase.from('tipos_padronizacao').update({nome,ativo:true}).eq('codigo',codigo).select('codigo,nome,ativo,drive_folder_id').single()
      : await supabase.from('tipos_padronizacao').insert({codigo,nome}).select('codigo,nome,ativo').single()
    const {data,error} = consulta
    if (error) setErroTipo('Não foi possível salvar este tipo.')
    else { setTipos(atual => [...atual.filter(item => item.codigo !== codigo),data as TipoMaterial].sort((a,b)=>a.nome.localeCompare(b.nome))); setNovoTipoCodigo(''); setNovoTipoNome(''); try { await vincularTipoDrive(codigo) } catch(err) { setErroTipo(err instanceof Error?err.message:'Tipo cadastrado, mas não foi possível criar a pasta no Drive.') } }
    setSalvandoTipo(false)
  }
  async function reativarTipo(item: TipoMaterial) {
    if (!supabase || !admin) return
    setErroTipo('')
    const {error}=await supabase.from('tipos_padronizacao').update({ativo:true}).eq('codigo',item.codigo)
    if (error) setErroTipo('Não foi possível restaurar o tipo.')
    else setTipos(atual=>atual.map(t=>t.codigo===item.codigo?{...t,ativo:true}:t))
  }
  function abrirEdicaoTipo(item: TipoMaterial) {
    setErroEdicao('')
    setEdicao({categoria:'tipo',id:item.codigo,codigo:item.codigo,anterior:item.nome,nome:item.nome})
  }
  async function salvarEdicao() {
    if (!supabase || !admin || !edicao || salvandoEdicao) return
    const nome = edicao.categoria === 'destino' ? normalizeName(edicao.nome) : edicao.nome.trim()
    if (!nome) { setErroEdicao('Informe um nome válido.'); return }
    if (nome === edicao.anterior) { setEdicao(null); return }
    if (edicao.categoria === 'destino' && destinos.some(d=>d.id!==edicao.id && d.tipo===edicao.codigo && d.nome===nome)) {
      setErroEdicao('Já existe um destino com este nome.'); return
    }
    setSalvandoEdicao(true);setErroEdicao('')
    const {error}=edicao.categoria==='tipo'
      ? await supabase.from('tipos_padronizacao').update({nome}).eq('codigo',edicao.id)
      : await supabase.from('destinos_padronizacao').update({nome}).eq('id',edicao.id)
    if (error) setErroEdicao('Não foi possível salvar a alteração. Verifique se o nome já existe.')
    else {
      if(edicao.categoria==='tipo') setTipos(atual=>atual.map(t=>t.codigo===edicao.id?{...t,nome}:t))
      else {
        setDestinos(atual=>atual.map(d=>d.id===edicao.id?{...d,nome}:d))
        if(program===edicao.anterior) setProgram(nome)
      }
      setEdicao(null)
    }
    setSalvandoEdicao(false)
  }
  async function desativarTipo(item: TipoMaterial) {
    if (!supabase || !admin || !window.confirm('Ocultar este tipo da seleção? Destinos e arquivos já enviados serão preservados.')) return
    const {error}=await supabase.from('tipos_padronizacao').update({ativo:false}).eq('codigo',item.codigo)
    if (error) setErroTipo('Não foi possível desativar o tipo.')
    else {setTipos(atual=>atual.map(t=>t.codigo===item.codigo?{...t,ativo:false}:t));if(type===item.codigo){setType('CH');setProgram('')}}
  }

  async function vincularPastaDrive(item: Destino) {
    if (!supabase || !admin) return null
    const {data:{session}}=await supabase.auth.getSession()
    if (!session) throw new Error('Sessão expirada. Entre novamente.')
    const response=await fetch('https://uppdvhtmvprtwtppcfdm.supabase.co/functions/v1/google-drive-criar-pasta',{
      method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},
      body:JSON.stringify({destino_id:item.id})
    })
    const result=await response.json()
    if (!response.ok || !result.folder_id) throw new Error(result.error || 'Falha ao criar pasta no Drive.')
    setDestinos(atual=>atual.map(d=>d.id===item.id?{...d,drive_folder_id:result.folder_id}:d))
    return result.folder_id as string
  }
  async function adicionarDestino() {
    if (!supabase || !admin || !novoDestino.trim()) return
    setSalvandoDestino(true);setErroDestino('')
    try {
      const nome=normalizeName(novoDestino)
      const existente=destinos.find(item=>item.tipo===type && item.nome===nome)
      if (existente?.ativo) throw new Error('Este destino já existe. Utilize a opção de editar.')
      const {data,error}=existente
        ? await supabase.from('destinos_padronizacao').update({ativo:true}).eq('id',existente.id).select('id,tipo,nome,drive_folder_id,ativo').single()
        : await supabase.from('destinos_padronizacao').insert({tipo:type,nome}).select('id,tipo,nome,drive_folder_id,ativo').single()
      if (error || !data) throw new Error('Não foi possível cadastrar o destino.')
      const item=data as Destino
      setDestinos(atual=>[...atual.filter(d=>d.id!==item.id),item].sort((x,y)=>x.nome.localeCompare(y.nome)))
      if (!item.drive_folder_id) await vincularPastaDrive(item)
      setProgram(nome);setNovoDestino('')
    } catch(error) {
      setErroDestino(error instanceof Error?error.message:'Falha ao criar destino e pasta no Drive.')
    } finally {setSalvandoDestino(false)}
  }
  async function criarPastaPendente(item: Destino) {
    if (!admin || salvandoDestino) return
    setSalvandoDestino(true);setErroDestino('')
    try { await vincularPastaDrive(item) }
    catch(error){setErroDestino(error instanceof Error?error.message:'Falha ao vincular pasta.')}
    finally{setSalvandoDestino(false)}
  }
  async function reativarDestino(item: Destino) {
    if (!supabase || !admin) return
    setErroDestino('')
    const {error}=await supabase.from('destinos_padronizacao').update({ativo:true}).eq('id',item.id)
    if (error) setErroDestino('Não foi possível restaurar o destino.')
    else setDestinos(atual=>atual.map(d=>d.id===item.id?{...d,ativo:true}:d))
  }
  function abrirEdicaoDestino(item: Destino) {
    setErroEdicao('')
    setEdicao({categoria:'destino',id:item.id,codigo:type,anterior:item.nome,nome:item.nome})
  }
  async function desativarDestino(item: Destino) {
    if (!supabase || !admin || !window.confirm('Remover esta opção da seleção? A pasta no Google Drive será preservada.')) return
    const { error } = await supabase.from('destinos_padronizacao').update({ ativo: false }).eq('id', item.id)
    if (error) setErroDestino('Não foi possível desativar o destino.')
    else { setDestinos(atual => atual.map(d => d.id === item.id ? { ...d, ativo: false } : d)); if (program === item.nome) setProgram('') }
  }

  const [type, setType] = useState<string>('CH')
  const [program, setProgram] = useState('')
  const [complemento, setComplemento] = useState('')
  const [dataEnvio] = useState(dataLocal)
  const [duration, setDuration] = useState('')
  const [approved, setApproved] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [copied, setCopied] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arquivoInputKey, setArquivoInputKey] = useState(0)
  const [erroArquivo, setErroArquivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [linkDrive, setLinkDrive] = useState('')
  const [duplicado, setDuplicado] = useState('')

  const opcoes = destinos.filter(item => item.tipo === type && item.ativo)
  const destinoSelecionado = opcoes.find(item => item.nome === program)

  const filename = useMemo(() => {
    const name = normalizeName(program)
    const extra = normalizeName(complemento)
    const seconds = Number(duration)
    const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(dataEnvio)
    if (!destinoSelecionado || !name || !Number.isInteger(seconds) || seconds < 1 || seconds > 36000 || !dataValida) return ''
    const [, mes, dia] = dataEnvio.split('-')
    return `${type} - ${name}${extra ? ` - ${extra}` : ''} - ${seconds}'s - ${dia}-${mes}.mp4`
  }, [type, program, complemento, duration, dataEnvio, destinoSelecionado])

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!approved || !filename || !arquivo || !destinoSelecionado || !supabase || enviando) return
    setEnviando(true); setProgresso(0); setErroArquivo(''); setDuplicado(''); setLinkDrive(''); setConfirmation('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sua sessão expirou. Entre novamente.')
      const endpoint = 'https://uppdvhtmvprtwtppcfdm.supabase.co/functions/v1/google-drive-upload'
      const enviar = async (payload: object) => {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(payload) })
        const data = await response.json()
        if (!response.ok) {
          if (data.duplicate) { setDuplicado(data.name || filename); throw new Error('Já existe um arquivo com este nome. Altere o complemento e tente novamente.') }
          throw new Error(data.error || 'Falha ao comunicar com o Drive.')
        }
        return data
      }
      const inicio = await enviar({action:'start',destino_id:destinoSelecionado.id,complemento,duracao:Number(duration),original_name:arquivo.name,total_bytes:arquivo.size})
      const chunkSize = 4 * 1024 * 1024
      for (let start = 0; start < arquivo.size; start += chunkSize) {
        const end = Math.min(start + chunkSize, arquivo.size) - 1
        const bytes = new Uint8Array(await arquivo.slice(start,end+1).arrayBuffer())
        let binary = ''
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i,i+0x8000))
        const resultado = await enviar({action:'chunk',upload_id:inicio.upload_id,start,end,total:arquivo.size,chunk_base64:btoa(binary)})
        setProgresso(Math.round((end+1)/arquivo.size*100))
        if (resultado.done) { setConfirmation(resultado.name); setLinkDrive(resultado.url) }
      }
    } catch (error) {
      setErroArquivo(error instanceof Error ? error.message : 'Falha ao enviar o vídeo.')
    } finally { setEnviando(false) }
  }

  function limparCampos() {
    setType('CH')
    setProgram('')
    setComplemento('')
    setDuration('')
    setApproved(false)
    setConfirmation('')
    setCopied(false)
    setArquivo(null)
    setArquivoInputKey(chave => chave + 1)
    setErroArquivo('')
    setProgresso(0)
    setLinkDrive('')
    setDuplicado('')
    setGerenciar(false)
    setGerenciarTipos(false)
    setNovoDestino('')
    setErroDestino('')
  }

  function baixarRenomeado() {
    if (!arquivo || !filename) return
    const url = URL.createObjectURL(arquivo)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  async function copy() {
    if (!filename) return
    try { await navigator.clipboard.writeText(filename); setCopied(true) }
    catch { setCopied(false) }
  }

  return (
    <main className="scc-fluid-content pb-20 pt-9">
      <div className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-widest text-white/45">SCC PRODUÇÃO · V2</p>
        <h1 className="mt-3 flex items-center gap-3 text-4xl font-extrabold"><FileCheck2 /> Sistema de Padronização</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">Confira os dados de materiais aprovados e prepare nomes consistentes antes do envio à grade.</p>
      </div>

      {admin && <div className="mt-5 flex flex-wrap items-center gap-3">{driveConectado === true ? <span className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200">✓ Google Drive corporativo conectado</span> : <button type="button" disabled={conectandoDrive} onClick={() => void conectarDrive()} className="rounded-xl border border-blue-400/30 bg-blue-500/15 px-4 py-3 text-sm font-bold text-blue-200 disabled:opacity-50">{conectandoDrive ? 'Abrindo autorização...' : 'Conectar Google Drive corporativo'}</button>}{erroDrive && <p role="alert" className="text-xs text-red-300">{erroDrive}</p>}</div>}
      <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={confirm} className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-6">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold"><Film size={20}/> Identificação do material</h2>
          <label className="mb-6 block rounded-2xl border border-dashed border-blue-400/40 bg-blue-400/5 p-5 text-center">
            <UploadCloud size={30} className="mx-auto mb-2 text-blue-300" />
            <span className="block text-sm font-bold">Selecionar vídeo MP4 original</span>
            <span className="mt-1 block break-all text-xs text-white/55">{arquivo ? arquivo.name : 'O arquivo pode estar com qualquer nome'}</span>
            <input key={arquivoInputKey} type="file" accept=".mp4,video/mp4" className="mt-3 block w-full text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:font-bold file:text-white" onChange={e => {
              const file = e.target.files?.[0] ?? null
              if (file && !file.name.toLowerCase().endsWith('.mp4')) { setArquivo(null); setErroArquivo('Selecione um arquivo MP4.'); return }
              setArquivo(file); setErroArquivo(''); setConfirmation('')
            }} />
            {erroArquivo && <span role="alert" className="mt-2 block text-xs text-red-300">{erroArquivo}</span>}
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="tipo-material" className="text-xs font-semibold text-white/70">Tipo de material</label>
                {admin && <button type="button" onClick={() => setGerenciarTipos(v=>!v)} className="text-xs font-bold text-blue-400 hover:text-blue-300">{gerenciarTipos?'Fechar gerenciamento':'Gerenciar tipos'}</button>}
              </div>
              <select id="tipo-material" value={type} onChange={e => {setType(e.target.value);setProgram('');setGerenciar(false);setConfirmation('')}} className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] p-3 text-sm text-white">
                {tipos.filter(t=>t.ativo).map(t=><option key={t.codigo} value={t.codigo}>{t.codigo === 'CALHAU' ? t.nome : `${t.codigo} — ${t.nome}`}</option>)}
              </select>
              {admin && gerenciarTipos && <div className="mt-3 rounded-xl border border-blue-400/20 bg-[#111] p-3">
                <p className="mb-3 text-xs font-semibold text-white/70">Gerenciar tipos de materiais</p>
                <div className="flex flex-wrap gap-2">
                  <input aria-label="Código do novo tipo" maxLength={12} placeholder="CÓDIGO (EX.: DOC)" value={novoTipoCodigo} onChange={e=>setNovoTipoCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''))} className="min-w-0 w-28 flex-1 rounded-lg border border-white/15 bg-[#080808] px-3 py-2 text-xs"/>
                  <input aria-label="Nome do novo tipo" maxLength={80} placeholder="Descrição do tipo" value={novoTipoNome} onChange={e=>setNovoTipoNome(e.target.value)} className="min-w-0 flex-[2] rounded-lg border border-white/15 bg-[#080808] px-3 py-2 text-xs"/>
                  <button type="button" disabled={salvandoTipo || !novoTipoCodigo || !novoTipoNome.trim()} onClick={()=>void adicionarTipo()} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold disabled:opacity-40"><Plus size={14}/> Adicionar</button>
                </div>
                <div className="mt-3 space-y-2">{tipos.map(item=><div key={item.codigo} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <span className="min-w-0 truncate text-xs">{item.codigo} — {item.nome}{!item.ativo && <span className="ml-2 text-amber-300">(desativado)</span>}</span>
                  <div className="flex shrink-0 gap-2">
                    {item.ativo && !item.drive_folder_id && <button type="button" disabled={salvandoTipo} onClick={()=>void criarPastaTipo(item.codigo)} className="text-xs font-bold text-amber-300 disabled:opacity-40">Criar pasta no Drive</button>}
                    <button type="button" aria-label={`Renomear ${item.nome}`} onClick={()=>abrirEdicaoTipo(item)} className="text-blue-300"><Pencil size={15}/></button>
                    {item.ativo ? <button type="button" aria-label={`Desativar ${item.nome}`} onClick={()=>void desativarTipo(item)} className="text-red-300"><Trash2 size={15}/></button> : <button type="button" onClick={()=>void reativarTipo(item)} className="text-xs font-bold text-emerald-300">Restaurar</button>}
                  </div>
                </div>)}</div>
                <p className="mt-3 text-xs text-white/50">O código é fixo para preservar o histórico. A descrição pode ser alterada; desativar não exclui arquivos existentes.</p>
                {erroTipo && <p role="alert" className="mt-2 text-xs text-red-300">{erroTipo}</p>}
              </div>}
            </div>
            <label className="text-xs font-semibold text-white/70">Complemento (opcional)
              <input maxLength={80} placeholder="EX.: INSTITUCIONAL" value={complemento} onChange={e => { setComplemento(normalizeName(e.target.value)); setConfirmation('') }} className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] p-3 text-sm uppercase text-white" />
            </label>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="destino-padronizacao" className="text-xs font-semibold text-white/70">{type === 'CALHAU' ? 'Série do calhau' : 'Programa ou produto'}</label>
                {admin && <button type="button" onClick={() => setGerenciar(v => !v)} className="text-xs font-bold text-blue-400 hover:text-blue-300">{gerenciar ? 'Fechar gerenciamento' : 'Gerenciar destinos'}</button>}
              </div>
              <select id="destino-padronizacao" required value={program} onChange={e => { setProgram(e.target.value); setConfirmation('') }} className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] p-3 text-sm text-white">
                <option value="">Selecione {type === 'CALHAU' ? 'uma série' : 'um destino'}</option>
                {opcoes.map(item => <option key={item.id} value={item.nome}>{item.nome}</option>)}
              </select>
              {destinoSelecionado && <p className="mt-2 text-xs text-white/45">{destinoSelecionado.drive_folder_id ? 'Pasta do Google Drive vinculada' : 'Destino cadastrado; pasta do Google Drive ainda não vinculada'}</p>}
              {admin && gerenciar && <div className="mt-3 rounded-xl border border-blue-400/20 bg-[#111] p-3">
                <p className="mb-3 text-xs font-semibold text-white/70">Gerenciar {type === 'CALHAU' ? 'séries de calhaus' : 'programas e produtos'}</p>
                <div className="flex flex-wrap gap-2">
                  <input aria-label="Nome do novo destino" value={novoDestino} onChange={e => setNovoDestino(e.target.value)} maxLength={100} placeholder={type === 'CALHAU' ? 'Nome da nova série' : 'Nome do programa'} className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#080808] px-3 py-2 text-sm" />
                  <button type="button" disabled={salvandoDestino || !novoDestino.trim()} onClick={() => void adicionarDestino()} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold disabled:opacity-40"><Plus size={14}/> Adicionar</button>
                </div>
                <div className="mt-3 space-y-2">{destinos.filter(item=>item.tipo===type).map(item => <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <span className="min-w-0 truncate text-xs">{item.nome}{!item.ativo && <span className="ml-2 text-amber-300">(desativado)</span>}</span>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" title="Renomear" aria-label={`Renomear ${item.nome}`} onClick={() => abrirEdicaoDestino(item)} className="text-blue-300"><Pencil size={15}/></button>
                    {item.ativo && !item.drive_folder_id && <button type="button" disabled={salvandoDestino} onClick={()=>void criarPastaPendente(item)} className="text-xs font-bold text-amber-300 disabled:opacity-40">Criar pasta no Drive</button>}
                    {item.ativo ? <button type="button" title="Desativar" aria-label={`Desativar ${item.nome}`} onClick={() => void desativarDestino(item)} className="text-red-300"><Trash2 size={15}/></button> : <button type="button" onClick={()=>void reativarDestino(item)} className="text-xs font-bold text-emerald-300">Restaurar</button>}
                  </div>
                </div>)}</div>
                <p className="mt-3 text-xs text-amber-200/80">Ao adicionar um destino, o sistema cria ou localiza a pasta correspondente no Google Drive. Destinos antigos sem vínculo podem ser corrigidos pelo botão Criar pasta no Drive.</p>
              </div>}
              {erroDestino && <p role="alert" className="mt-2 text-xs text-red-300">{erroDestino}</p>}
            </div>
            <div className="flex flex-col gap-5">
              <label className="text-xs font-semibold text-white/70">Duração em segundos
                <input required type="number" min="1" max="36000" step="1" placeholder="30" value={duration} onChange={e => { setDuration(e.target.value); setConfirmation('') }} className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] p-3 text-sm text-white" />
              </label>
            </div>
          </div>
          <label className="mt-7 flex cursor-pointer items-start gap-3 text-sm text-white/70">
            <input type="checkbox" checked={approved} onChange={e => { setApproved(e.target.checked); setConfirmation('') }} className="mt-1 accent-[#e2fa00]"/>
            Confirmo que este material recebeu aprovação final da equipe responsável.
          </label>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!filename || !approved} className="rounded-xl bg-[#e2fa00] px-5 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">{enviando ? `Enviando... ${progresso}%` : 'Padronizar e enviar ao Drive'}</button>
            <button type="button" onClick={limparCampos} className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"><RotateCcw size={16}/> Limpar campos</button>
          </div>
        </form>

        <section className="h-fit rounded-2xl border border-white/10 bg-[#1f1f1f] p-6">
          <h2 className="text-lg font-bold">Prévia do nome</h2>
          <p className="mt-2 text-xs text-white/45">Formato previsto para arquivos MP4 aprovados.</p>
          <div className="mt-6 break-all rounded-xl border border-white/10 bg-[#080808] p-4 font-mono text-sm text-[#e2fa00]" aria-live="polite">
            {filename || 'Preencha os campos para gerar o nome'}
          </div>
          <button type="button" disabled={!arquivo || !filename} onClick={baixarRenomeado} className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold disabled:opacity-40"><Download size={15}/> Baixar MP4 com nome correto</button>
          <button type="button" disabled={!filename} onClick={() => void copy()} className="mt-4 flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold disabled:opacity-40"><ClipboardCopy size={15}/>{copied ? 'Copiado' : 'Copiar nome'}</button>
          {duplicado && <div role="alert" className="mt-4 rounded-xl border border-red-400/40 bg-red-500/15 p-4 text-sm text-red-100"><strong>Arquivo duplicado encontrado!</strong><p className="mt-1 break-all">{duplicado}</p><p className="mt-2">Altere o complemento ou outro campo permitido e tente novamente.</p><button type="button" onClick={() => setDuplicado('')} className="mt-3 rounded-lg border border-red-300/30 px-3 py-2">Entendi, alterar nome</button></div>}
          {enviando && <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-blue-500" style={{width:`${progresso}%`}}/></div><p className="mt-2 text-xs text-white/60">Transferência para Google Drive: {progresso}%</p></div>}
          {linkDrive && <a href={linkDrive} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-lg bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-200">Abrir arquivo no Google Drive</a>}
          {confirmation && <p role="status" className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200"><CheckCircle2 size={17} className="shrink-0"/> Arquivo enviado com sucesso: {confirmation}.</p>}
        </section>
      </div>
      {edicao && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget && !salvandoEdicao)setEdicao(null)}}>
        <div role="dialog" aria-modal="true" aria-labelledby="titulo-edicao" className="w-full max-w-md rounded-2xl border border-white/15 bg-[#202124] p-6 shadow-2xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-widest text-blue-400">SCC PRODUÇÃO · ADMINISTRAÇÃO</p><h2 id="titulo-edicao" className="mt-2 text-xl font-bold text-white">Editar {edicao.categoria==='tipo'?'tipo de material':'programa ou produto'}</h2></div>
            <button type="button" aria-label="Fechar edição" onClick={()=>setEdicao(null)} disabled={salvandoEdicao} className="rounded-lg border border-white/10 px-3 py-2 text-white/70 hover:bg-white/10">✕</button>
          </div>
          {edicao.categoria==='tipo' && <div className="mb-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3"><p className="text-xs text-white/50">Código permanente</p><p className="mt-1 font-mono text-sm font-bold text-white">{edicao.codigo}</p></div>}
          <form onSubmit={e=>{e.preventDefault();void salvarEdicao()}}>
            <label htmlFor="nome-edicao" className="text-xs font-semibold text-white/70">Nome / descrição</label>
            <input id="nome-edicao" autoFocus required maxLength={100} value={edicao.nome} onChange={e=>setEdicao(atual=>atual?{...atual,nome:e.target.value}:atual)} className="mt-2 w-full rounded-xl border border-white/20 bg-[#101113] px-4 py-3 text-sm text-white outline-none focus:border-blue-400"/>
            <p className="mt-3 text-xs leading-relaxed text-white/50">{edicao.categoria==='tipo'?'O código usado nos arquivos permanece inalterado.':'A alteração atualiza o cadastro no sistema; não renomeia pastas ou arquivos já existentes no Google Drive.'}</p>
            {erroEdicao && <p role="alert" className="mt-3 text-sm text-red-300">{erroEdicao}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={()=>setEdicao(null)} disabled={salvandoEdicao} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10">Cancelar</button>
              <button type="submit" disabled={salvandoEdicao || !edicao.nome.trim()} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50">{salvandoEdicao?'Salvando...':'Salvar alterações'}</button>
            </div>
          </form>
        </div>
      </div>}
    </main>
  )
}
