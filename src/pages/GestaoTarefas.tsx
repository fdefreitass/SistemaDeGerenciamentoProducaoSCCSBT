import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { listarTarefas, criarTarefa, atualizarEtapa, excluirTarefa } from '../services/tarefas'
import { modoDemo } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { can } from '../lib/permissoes'
import { ArrowRight, ClipboardList, Plus, Search, Trash2 } from 'lucide-react'

type Stage = 'backlog' | 'andamento' | 'revisao' | 'aprovado'
type Task = { id: string; title: string; program: string; owner: string; due: string; stage: Stage }
const stages: { id: Stage; label: string; color: string }[] = [
  { id: 'backlog', label: 'A fazer', color: '#8f9ba8' },
  { id: 'andamento', label: 'Em produção', color: '#0089ff' },
  { id: 'revisao', label: 'Em revisão', color: '#ffb020' },
  { id: 'aprovado', label: 'Aprovado', color: '#65d69b' },
]
const initial: Task[] = [
  { id: 'demo-1', title: 'Chamada institucional — 30s', program: 'SCC Meio-Dia', owner: 'Equipe de produção', due: '', stage: 'backlog' },
  { id: 'demo-2', title: 'VT de programação', program: 'SCC News', owner: 'Equipe de edição', due: '', stage: 'andamento' },
]
export default function GestaoTarefas() {
  const { perfil } = useAuth()
  const podeEditar = modoDemo || can(perfil?.papel, 'tasks.write')
  const podeExcluir = modoDemo || perfil?.papel === 'admin'
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(modoDemo ? initial : [])
  useEffect(() => { if (modoDemo) return; let active = true; listarTarefas().then(rows => { if (active) setTasks(rows.map(t => ({ id: t.id, title: t.titulo, program: t.programa, owner: t.responsavel, due: t.prazo ?? '', stage: t.etapa }))) }).catch(() => { if (active) setErro('Não foi possível carregar as tarefas.') }); return () => { active = false } }, [])
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [program, setProgram] = useState('')
  const [owner, setOwner] = useState('')
  const [due, setDue] = useState('')
  const filtered = useMemo(() => tasks.filter(task => [task.title, task.program, task.owner].join(' ').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))), [tasks, search])
  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !podeEditar || ocupado) return
    setOcupado(true); setErro('')
    try {
    const saved = await criarTarefa({ titulo: title.trim(), programa: program.trim(), responsavel: owner.trim(), prazo: due || null })
    setTasks(current => [{ id: saved.id, title: saved.titulo, program: saved.programa, owner: saved.responsavel, due: saved.prazo ?? '', stage: saved.etapa }, ...current])
    setTitle(''); setProgram(''); setOwner(''); setDue(''); setCreating(false)
    } catch { setErro('Não foi possível salvar a tarefa.') } finally { setOcupado(false) }
  }
  async function moveTask(id: string, stage: Stage) {
    if (!podeEditar || ocupado) return
    setOcupado(true); setErro('')
    try { await atualizarEtapa(id, stage)
    setTasks(current => current.map(task => task.id === id ? { ...task, stage } : task)) }
    catch { setErro('Não foi possível alterar a etapa.') } finally { setOcupado(false) }
  }
  async function removeTask(id: string) {
    if (!podeExcluir || ocupado || !window.confirm('Excluir esta tarefa?')) return
    setOcupado(true); setErro('')
    try { await excluirTarefa(id); setTasks(current => current.filter(item => item.id !== id)) }
    catch { setErro('Não foi possível excluir a tarefa.') } finally { setOcupado(false) }
  }
  return (
    <main className="scc-fluid-content pb-20 pt-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/45">SCC PRODUÇÃO · V2</p>
          <h1 className="mt-3 flex items-center gap-3 text-4xl font-extrabold"><ClipboardList /> Gestão de Tarefas</h1>
          <p className="mt-3 text-sm text-white/55">Organize demandas da produção, acompanhe revisões e aprovações.</p>
        </div>
        <button type="button" disabled={!podeEditar || ocupado} onClick={() => setCreating(value => !value)} className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-[#e2fa00]"><Plus size={17}/> Nova tarefa</button>
      </div>
      <p role="status" className="mt-6 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-xs text-amber-100">As tarefas são salvas no Supabase. No modo de demonstração, os dados são apenas locais.</p>
      {erro && <p role="alert" className="mt-4 text-red-300">{erro}</p>}
      {creating && <form onSubmit={createTask} className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 md:grid-cols-2">
        <label className="text-xs text-white/65">Título da tarefa<input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 p-3 text-white" /></label>
        <label className="text-xs text-white/65">Programa<input maxLength={100} value={program} onChange={e => setProgram(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 p-3 text-white" /></label>
        <label className="text-xs text-white/65">Responsável<input maxLength={100} value={owner} onChange={e => setOwner(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 p-3 text-white" /></label>
        <label className="text-xs text-white/65">Prazo<input type="date" value={due} onChange={e => setDue(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 p-3 text-white" /></label>
        <div className="md:col-span-2"><button className="rounded-lg bg-[#e2fa00] px-5 py-3 text-sm font-bold text-black" disabled={ocupado}>Salvar tarefa</button></div>
      </form>}
      <label className="mt-7 flex max-w-md items-center gap-3 rounded-xl border border-white/10 bg-[#1f1f1f] px-4"><Search size={18} className="text-white/40"/><span className="sr-only">Buscar tarefas</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarefa, programa ou responsável" className="w-full bg-transparent py-3 text-sm outline-none"/></label>
      <div className="mt-6 grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {stages.map((stage, index) => {
          const items = filtered.filter(task => task.stage === stage.id)
          return <section key={stage.id} className="min-h-72 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4" aria-label={stage.label}>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: stage.color }}/>{stage.label}</h2><span className="rounded-full bg-white/10 px-2 py-1 text-xs">{items.length}</span></div>
            <div className="space-y-3">{items.map(task => <article key={task.id} className="rounded-xl border border-white/10 bg-[#252525] p-4">
              <h3 className="text-sm font-semibold">{task.title}</h3>
              <p className="mt-2 text-xs text-white/55">{task.program || 'Sem programa'} · {task.owner || 'Sem responsável'}</p>
              {task.due && <p className="mt-2 text-xs text-white/45">Prazo: {task.due.split('-').reverse().join('/')}</p>}
              <div className="mt-4 flex items-center justify-between gap-2">
                {podeExcluir && <button type="button" disabled={ocupado} aria-label={`Excluir ${task.title}`} title="Excluir tarefa" onClick={() => void removeTask(task.id)} className="rounded-lg p-2 text-white/50 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={15}/></button>}
                <div className="flex items-center gap-2">
                  {podeEditar && index > 0 && <button type="button" disabled={ocupado} onClick={() => void moveTask(task.id, stages[index - 1].id)} className="rounded-lg border border-white/15 px-2 py-1 text-xs hover:bg-white/10">Voltar</button>}
                  {podeEditar && index < stages.length - 1 && <button type="button" disabled={ocupado} onClick={() => void moveTask(task.id, stages[index + 1].id)} className="flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-xs hover:bg-white/10">Avançar <ArrowRight size={13}/></button>}
                </div>
              </div>
            </article>)}</div>
          </section>
        })}
      </div>
    </main>
  )
}
