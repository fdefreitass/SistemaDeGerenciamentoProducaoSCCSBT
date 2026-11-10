import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2, ClipboardCopy, FileCheck2, Film, Info, Plus, Pencil, Trash2, UploadCloud, Download, RotateCcw } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { modoDemo, supabase } from '../lib/supabase'

type Destino = { id: string; tipo: string; nome: string; drive_folder_id: string | null; ativo: boolean }

const types = [
  { value: 'CH', label: 'CH — Chamada' },
  { value: 'VT', label: 'VT — Videotape' },
  { value: 'VH', label: 'VH — Vinheta' },
  { value: 'CALHAU', label: 'Calhau' },
] as const

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
  const [novoDestino, setNovoDestino] = useState('')
  const [gerenciar, setGerenciar] = useState(false)
  const [erroDestino, setErroDestino] = useState('')
  const [salvandoDestino, setSalvandoDestino] = useState(false)

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

  async function adicionarDestino() {
    if (!supabase || !admin || !novoDestino.trim()) return
    setSalvandoDestino(true); setErroDestino('')
    const nome = normalizeName(novoDestino)
    const { data, error } = await supabase.from('destinos_padronizacao').insert({ tipo: type, nome }).select('id,tipo,nome,drive_folder_id,ativo').single()
    if (error) setErroDestino('Não foi possível cadastrar. Confira se o nome já existe.')
    else { setDestinos(atual => [...atual, data as Destino].sort((a,b) => a.nome.localeCompare(b.nome))); setProgram(nome); setNovoDestino('') }
    setSalvandoDestino(false)
  }
  async function renomearDestino(item: Destino) {
    if (!supabase || !admin) return
    const nome = window.prompt('Novo nome para o destino:', item.nome)
    if (!nome?.trim()) return
    const normalizado = normalizeName(nome)
    const { error } = await supabase.from('destinos_padronizacao').update({ nome: normalizado }).eq('id', item.id)
    if (error) setErroDestino('Não foi possível renomear o destino.')
    else { setDestinos(atual => atual.map(d => d.id === item.id ? { ...d, nome: normalizado } : d)); if (program === item.nome) setProgram(normalizado) }
  }
  async function desativarDestino(item: Destino) {
    if (!supabase || !admin || !window.confirm('Remover esta opção da seleção? A pasta no Google Drive será preservada.')) return
    const { error } = await supabase.from('destinos_padronizacao').update({ ativo: false }).eq('id', item.id)
    if (error) setErroDestino('Não foi possível desativar o destino.')
    else { setDestinos(atual => atual.map(d => d.id === item.id ? { ...d, ativo: false } : d)); if (program === item.nome) setProgram('') }
  }

  const [type, setType] = useState<(typeof types)[number]['value']>('CH')
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

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!approved || !filename) return
    setConfirmation(filename)
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
    setGerenciar(false)
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

      <div className="mt-7 flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
        <Info size={19} className="mt-0.5 shrink-0"/>
        <p>O arquivo MP4 pode ser selecionado e baixado com o nome padronizado. O envio automático e a verificação de duplicidade no Google Drive ainda dependem da integração segura; nenhum arquivo é publicado nesta etapa.</p>
      </div>

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
            <label className="text-xs font-semibold text-white/70">Tipo de material
              <select value={type} onChange={e => { setType(e.target.value as typeof type); setProgram(''); setGerenciar(false); setConfirmation('') }} className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] p-3 text-sm text-white">
                {types.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
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
                <div className="mt-3 space-y-2">{opcoes.map(item => <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <span className="min-w-0 truncate text-xs">{item.nome}</span>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" title="Renomear" aria-label={`Renomear ${item.nome}`} onClick={() => void renomearDestino(item)} className="text-blue-300"><Pencil size={15}/></button>
                    <button type="button" title="Desativar" aria-label={`Desativar ${item.nome}`} onClick={() => void desativarDestino(item)} className="text-red-300"><Trash2 size={15}/></button>
                  </div>
                </div>)}</div>
                <p className="mt-3 text-xs text-amber-200/80">Novos destinos são cadastrados no sistema. A pasta no Drive deverá ser vinculada antes da publicação de arquivos.</p>
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
            <button type="submit" disabled={!filename || !approved} className="rounded-xl bg-[#e2fa00] px-5 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">Confirmar padronização (simulação)</button>
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
          {confirmation && <p role="status" className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200"><CheckCircle2 size={17} className="shrink-0"/> Simulação confirmada para {confirmation}. Nenhum arquivo foi alterado.</p>}
        </section>
      </div>
    </main>
  )
}
