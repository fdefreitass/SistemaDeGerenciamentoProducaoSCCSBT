import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Tarefa, ConfigEtapa } from '../services/tarefas'

type Props={tarefas:Tarefa[];etapas:ConfigEtapa[];abrir:(id:string)=>void}
const dataLocal=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')
const formatar=(d:Date)=>d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
export default function CalendarioEntregas({tarefas,etapas,abrir}:Props){
 const [referencia,setReferencia]=useState(()=>new Date())
 const [modo,setModo]=useState<'mes'|'semana'|'lista'>('mes')
 const [selecionado,setSelecionado]=useState(()=>dataLocal(new Date()))
 const primeiro=new Date(referencia.getFullYear(),referencia.getMonth(),1)
 const inicioSemana=new Date(referencia);inicioSemana.setDate(referencia.getDate()-((referencia.getDay()+6)%7))
 const dias=useMemo(()=>{
  if(modo==='lista')return []
  const inicio=modo==='mes'?new Date(primeiro):new Date(inicioSemana)
  if(modo==='mes')inicio.setDate(1-((inicio.getDay()+6)%7))
  const total=modo==='semana'?7:42
  return Array.from({length:total},(_,i)=>{const d=new Date(inicio);d.setDate(inicio.getDate()+i);return d})
 },[modo,referencia])
 const mudar=(n:number)=>{const d=new Date(referencia);if(modo==='semana')d.setDate(d.getDate()+n*7);else d.setMonth(d.getMonth()+n);setReferencia(d)}
 const emDia=(t:Tarefa,dia:string)=>{const inicio=t.inicio||t.prazo;const fim=t.prazo||t.inicio;return !!inicio&&!!fim&&dia>=inicio&&dia<=fim}
 const cor=(t:Tarefa)=>etapas.find(e=>e.id===t.etapa)?.cor||'#3b82f6'
 const ordenadas=[...tarefas].filter(t=>t.inicio||t.prazo).sort((a,b)=>(a.prazo||a.inicio||'').localeCompare(b.prazo||b.inicio||''))
 return <section className="mt-6 rounded-2xl border border-white/10 bg-[#191919]/95 p-3 sm:p-5" aria-label="Calendário de entregas">
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays size={20} className="text-blue-400"/><h2 className="text-base font-bold capitalize">{formatar(referencia)}</h2><button type="button" onClick={()=>{const d=new Date();setReferencia(d);setSelecionado(dataLocal(d))}} className="rounded-lg border border-white/15 px-2 py-1 text-xs">Hoje</button><button type="button" aria-label="Anterior" onClick={()=>mudar(-1)} className="rounded-lg p-2 hover:bg-white/10"><ChevronLeft size={18}/></button><button type="button" aria-label="Próximo" onClick={()=>mudar(1)} className="rounded-lg p-2 hover:bg-white/10"><ChevronRight size={18}/></button></div>
   <div className="flex rounded-xl border border-white/10 bg-[#111] p-1">{(['mes','semana','lista'] as const).map(v=><button key={v} type="button" aria-pressed={modo===v} onClick={()=>setModo(v)} className={'rounded-lg px-3 py-2 text-xs font-semibold '+(modo===v?'bg-blue-600 text-white':'text-white/60')}>{v==='mes'?'Mês':v==='semana'?'Semana':'Lista'}</button>)}</div></div>
  {modo==='lista'?<div className="space-y-2">{ordenadas.length===0?<p className="p-5 text-sm text-white/50">Nenhuma tarefa com datas cadastradas.</p>:ordenadas.map(t=><button key={t.id} onClick={()=>abrir(t.id)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#242424] p-3 text-left hover:border-blue-400/50"><span className="min-w-0 truncate text-sm font-semibold" style={{borderLeft:'3px solid '+cor(t),paddingLeft:10}}>{t.titulo}</span><span className="shrink-0 text-xs text-white/55">{t.inicio||'—'} → {t.prazo||'—'}</span></button>)}</div>:
  <><div className="grid grid-cols-7 gap-1">{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d=><div key={d} className="py-2 text-center text-[11px] font-bold text-white/45">{d}</div>)}{dias.map(d=>{const chave=dataLocal(d);const eventos=ordenadas.filter(t=>emDia(t,chave));return <div key={chave} onClick={()=>setSelecionado(chave)} className={'min-h-[76px] min-w-0 cursor-pointer rounded-lg border p-1 sm:min-h-[110px] sm:p-2 '+(selecionado===chave?'border-blue-500/70 bg-blue-500/10':'border-white/10 bg-[#242424]')+(d.getMonth()!==referencia.getMonth()?' opacity-45':'')}><div className="mb-1 text-[11px] text-white/70">{d.getDate()}</div><div className="space-y-1">{eventos.slice(0,2).map(t=><button type="button" key={t.id} title={t.titulo} onClick={e=>{e.stopPropagation();abrir(t.id)}} className="block w-full truncate rounded px-1 py-1 text-left text-[9px] font-semibold text-white sm:text-[11px]" style={{background:cor(t)+'55',borderLeft:'3px solid '+cor(t)}}>{t.titulo}</button>)}{eventos.length>2&&<span className="block text-[10px] text-white/60">+{eventos.length-2}</span>}</div></div>})}</div>
   <div className="mt-4 rounded-xl border border-white/10 bg-[#222] p-3"><h3 className="mb-2 text-sm font-semibold">Tarefas em {selecionado.split('-').reverse().join('/')}</h3><div className="space-y-2">{ordenadas.filter(t=>emDia(t,selecionado)).map(t=><button key={t.id} type="button" onClick={()=>abrir(t.id)} className="block w-full truncate rounded-lg border-l-4 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10" style={{borderLeftColor:cor(t)}}>{t.titulo}</button>)}{!ordenadas.some(t=>emDia(t,selecionado))&&<p className="text-xs text-white/45">Nenhuma tarefa nesta data.</p>}</div></div></>}
 </section>
}
