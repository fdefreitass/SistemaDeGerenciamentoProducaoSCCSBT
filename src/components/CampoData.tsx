import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'

type Props={label:string;value:string;onChange:(value:string)=>void;disabled?:boolean}
const pad=(n:number)=>String(n).padStart(2,'0')
const iso=(y:number,m:number,d:number)=>`${y}-${pad(m+1)}-${pad(d)}`
const valid=(v:string)=>/^20\d{2}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(new Date(v+'T12:00:00').getTime())
const today=()=>{const d=new Date();return iso(d.getFullYear(),d.getMonth(),d.getDate())}
const monthNames=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
const weekdays=['D','S','T','Q','Q','S','S']
export default function CampoData({label,value,onChange,disabled=false}:Props){
  const [open,setOpen]=useState(false)
  const [month,setMonth]=useState(()=>{const d=valid(value)?new Date(value+'T12:00:00'):new Date();return new Date(d.getFullYear(),d.getMonth(),1)})
  const root=useRef<HTMLDivElement>(null)
  useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(root.current&&!root.current.contains(e.target as Node))setOpen(false)};const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('pointerdown',close);document.addEventListener('keydown',esc);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',esc)}},[open])
  const show=()=>{if(disabled)return;const d=valid(value)?new Date(value+'T12:00:00'):new Date();setMonth(new Date(d.getFullYear(),d.getMonth(),1));setOpen(v=>!v)}
  const changeMonth=(offset:number)=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()+offset,1))
  const first=new Date(month.getFullYear(),month.getMonth(),1).getDay()
  const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate()
  const selected=valid(value)?value:''
  const current=today()
  const pick=(v:string)=>{onChange(v);setOpen(false)}
  return <div ref={root} className="relative min-w-0">
    <span className="mb-2 block text-xs text-white/55">{label}</span>
    <button type="button" disabled={disabled} aria-label={`Selecionar data de ${label.toLowerCase()}`} aria-expanded={open} onClick={show} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border bg-[#111] px-3 py-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:opacity-50 ${open?'border-blue-500 shadow-[0_0_0_2px_rgba(37,99,235,.15)]':'border-white/15 hover:border-blue-400/50'}`}>
      <span className={selected?'font-medium text-white':'text-white/40'}>{selected?selected.split('-').reverse().join('/'):'Selecionar data'}</span><CalendarDays size={17} className="shrink-0 text-blue-400"/>
    </button>
    {open&&<div className="absolute left-0 top-full z-[110] mt-2 w-[min(320px,calc(100vw-48px))] rounded-2xl border border-white/15 bg-[#242424] p-4 text-white shadow-[0_18px_65px_rgba(0,0,0,.8)]" role="dialog" aria-label={`Calendário de ${label.toLowerCase()}`}>
      <div className="flex items-center justify-between gap-2"><strong className="text-sm capitalize">{monthNames[month.getMonth()]} de {month.getFullYear()}</strong><div className="flex gap-1"><button type="button" aria-label="Mês anterior" onClick={()=>changeMonth(-1)} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"><ChevronLeft size={17}/></button><button type="button" aria-label="Próximo mês" onClick={()=>changeMonth(1)} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"><ChevronRight size={17}/></button></div></div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">{weekdays.map((d,i)=><span key={i} className="py-2 text-[11px] font-semibold text-white/40">{d}</span>)}{Array.from({length:first},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:days},(_,i)=>{const date=iso(month.getFullYear(),month.getMonth(),i+1);const isSelected=date===selected;const isToday=date===current;return <button key={date} type="button" aria-label={`${i+1} de ${monthNames[month.getMonth()]} de ${month.getFullYear()}`} aria-pressed={isSelected} disabled={date<'2020-01-01'||date>'2100-12-31'} onClick={()=>pick(date)} className={`aspect-square rounded-lg text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:opacity-20 ${isSelected?'bg-blue-600 text-white shadow-[0_3px_14px_rgba(37,99,235,.4)]':isToday?'border border-blue-400/70 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20':'text-white/80 hover:bg-white/10'}`}>{i+1}</button>})}</div>
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3"><button type="button" onClick={()=>pick('')} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-white/55 hover:bg-white/10 hover:text-white"><X size={13}/> Limpar</button><button type="button" onClick={()=>pick(today())} className="rounded-lg bg-blue-500/15 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/25">Hoje</button></div>
    </div>}
  </div>
}
