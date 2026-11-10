import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Palette } from 'lucide-react'
import type { Tarefa, ConfigEtapa } from '../services/tarefas'

type Props={tarefas:Tarefa[];etapas:ConfigEtapa[];abrir:(id:string)=>void}
const dataLocal=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')
const formatar=(d:Date)=>d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
const feriados:Record<string,string>={'01-01':'Ano Novo','04-21':'Tiradentes','05-01':'Dia do Trabalho','09-07':'Independência','10-12':'Nossa Senhora Aparecida','11-02':'Finados','11-15':'Proclamação da República','11-20':'Consciência Negra','12-25':'Natal'}
const feriado=(d:Date)=>feriados[dataLocal(d).slice(5)]||null
export default function CalendarioEntregas({tarefas,etapas,abrir}:Props){
 const [referencia,setReferencia]=useState(()=>new Date())
 const [modo,setModo]=useState<'mes'|'semana'|'lista'>('mes')
 const [coresPersonalizadas,setCoresPersonalizadas]=useState<Record<string,string>>(()=>{
  try{return JSON.parse(localStorage.getItem('scc-cores-calendario')||'{}') as Record<string,string>}catch{return {}}
 })
 const [paletaAberta,setPaletaAberta]=useState<string|null>(null)
 const paleta=['#f50072','#ff5a00','#ffb020','#00c97a','#087fff','#7544f4','#9425a6','#333333']
 const definirCor=(id:string,valor:string|null)=>{
  setCoresPersonalizadas(anteriores=>{
   const proximas={...anteriores}
   if(valor)proximas[id]=valor
   else delete proximas[id]
   try{localStorage.setItem('scc-cores-calendario',JSON.stringify(proximas))}catch{/* armazenamento indisponível */}
   return proximas
  })
  setPaletaAberta(null)
 }
 const primeiro=new Date(referencia.getFullYear(),referencia.getMonth(),1)
 const inicioSemana=new Date(referencia);inicioSemana.setDate(referencia.getDate()-referencia.getDay())
 const dias=useMemo(()=>{
  if(modo==='lista')return []
  const inicio=modo==='mes'?new Date(primeiro):new Date(inicioSemana)
  if(modo==='mes')inicio.setDate(1-inicio.getDay())
  const total=modo==='semana'?7:Math.ceil((inicio.getDay()+new Date(referencia.getFullYear(),referencia.getMonth()+1,0).getDate())/7)*7
  return Array.from({length:total},(_,i)=>{const d=new Date(inicio);d.setDate(inicio.getDate()+i);return d})
 },[modo,referencia])
 const semanas=useMemo(()=>{
  if(modo==='lista')return []
  const grupos=Array.from({length:dias.length/7},(_,i)=>dias.slice(i*7,i*7+7))
  return grupos.map(grupo=>{
   const inicio=dataLocal(grupo[0]),fim=dataLocal(grupo[6])
   const eventos=tarefas.filter(t=>{const a=t.inicio||t.prazo,b=t.prazo||t.inicio;return !!a&&!!b&&a<=fim&&b>=inicio}).map(t=>{
    const a=t.inicio||t.prazo||inicio,b=t.prazo||t.inicio||fim
    const colunaInicio=grupo.findIndex(d=>dataLocal(d)>=a)
    const colunaFim=grupo.findIndex(d=>dataLocal(d)>b)
    return {t,inicio:Math.max(0,colunaInicio),fim:colunaFim<0?7:colunaFim}
   }).sort((a,b)=>a.inicio-b.inicio||(b.fim-b.inicio)-(a.fim-a.inicio)||a.t.titulo.localeCompare(b.t.titulo))
   const ocupacao:number[]=[]
   const faixas=eventos.map(evento=>{let faixa=ocupacao.findIndex(fimAnterior=>fimAnterior<=evento.inicio);if(faixa<0){faixa=ocupacao.length;ocupacao.push(evento.fim)}else ocupacao[faixa]=evento.fim;return {...evento,faixa}})
   return {grupo,faixas,linhas:ocupacao.length}
  })
 },[dias,tarefas,modo])
 const mudar=(n:number)=>{const d=new Date(referencia);if(modo==='semana')d.setDate(d.getDate()+n*7);else d.setMonth(d.getMonth()+n);setReferencia(d)}
 const cor=(t:Tarefa)=>coresPersonalizadas[t.id]||etapas.find(e=>e.id===t.etapa)?.cor||'#3b82f6'
 const ordenadas=[...tarefas].filter(t=>t.inicio||t.prazo).sort((a,b)=>(a.prazo||a.inicio||'').localeCompare(b.prazo||b.inicio||''))
 return <section className="scc-calendar mt-6 rounded-2xl border border-white/10 bg-[#191919]/95 p-3 sm:p-5" aria-label="Calendário de entregas">
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays size={20} className="text-blue-400"/><h2 className="text-base font-bold capitalize">{formatar(referencia)}</h2><button type="button" onClick={()=>{const d=new Date();setReferencia(d);setSelecionado(dataLocal(d))}} className="rounded-lg border border-white/15 px-2 py-1 text-xs">Hoje</button><button type="button" aria-label="Anterior" onClick={()=>mudar(-1)} className="rounded-lg p-2 hover:bg-white/10"><ChevronLeft size={18}/></button><button type="button" aria-label="Próximo" onClick={()=>mudar(1)} className="rounded-lg p-2 hover:bg-white/10"><ChevronRight size={18}/></button></div>
   <div className="scc-calendar-modes flex rounded-xl border border-white/10 bg-[#111] p-1">{(['mes','semana','lista'] as const).map(v=><button key={v} type="button" aria-pressed={modo===v} onClick={()=>setModo(v)} className={'rounded-lg px-3 py-2 text-xs font-semibold '+(modo===v?'scc-view-active text-white':'text-white/60')}>{v==='mes'?'Mês':v==='semana'?'Semana':'Lista'}</button>)}</div></div>
  {modo==='lista'?<div className="space-y-2">{ordenadas.length===0?<p className="p-5 text-sm text-white/50">Nenhuma tarefa com datas cadastradas.</p>:ordenadas.map(t=><button key={t.id} onClick={()=>abrir(t.id)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#242424] p-3 text-left hover:border-blue-400/50"><span className="min-w-0 truncate text-sm font-semibold" style={{borderLeft:'3px solid '+cor(t),paddingLeft:10}}>{t.titulo}</span><span className="shrink-0 text-xs text-white/55">{t.inicio||'—'} → {t.prazo||'—'}</span></button>)}</div>:
  <><div className="overflow-x-auto pb-1"><div className="min-w-[700px]"><div className="grid grid-cols-7 gap-px overflow-hidden rounded-t-xl bg-[#555]">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=><div key={d} className="py-3 text-center text-sm font-bold text-white">{d}</div>)}</div>
   <div className="space-y-px rounded-b-xl bg-[#d7d7d7]">{semanas.map(({grupo,faixas,linhas})=><div key={dataLocal(grupo[0])} className="relative grid grid-cols-7 gap-px" style={{zIndex:faixas.some(f=>f.t.id===paletaAberta)?20:1,height:Math.max(modo==='mes'?154:116,45+linhas*29+8)}}>
    {grupo.map((d,i)=>{const chave=dataLocal(d),fora=modo==='mes'&&d.getMonth()!==referencia.getMonth(),fer=feriado(d),fimSemana=i===0||i===6;return <button type="button" key={chave} onClick={()=>setSelecionado(chave)} title={fer||undefined} aria-label={'Selecionar '+d.toLocaleDateString('pt-BR')+(fer?' — '+fer:'')} className={'relative min-w-0 border-0 p-2 text-left text-[#171717] transition hover:brightness-95 '+(fora?'bg-[#999]':fer?'bg-[#f2a5a5]':fimSemana?'bg-[#c9c9c9]':'bg-[#ececec]')+(selecionado===chave?' ring-2 ring-inset ring-blue-600':'')}><span className="absolute left-2 top-2 block text-xs font-extrabold">{String(d.getDate()).padStart(2,'0')}</span>{fer&&<span className="absolute left-2 right-2 top-7 block truncate text-[9px] font-bold text-red-900">{fer}</span>}</button>})}
    <div className="pointer-events-none absolute inset-x-0 top-[42px] bottom-0 grid grid-cols-7 gap-px">
     {faixas.map(({t,inicio,fim,faixa})=><div key={t.id} className="group pointer-events-auto absolute" style={{left:`calc(${inicio} * (100% + 1px) / 7)`,width:`calc(${fim-inicio} * (100% + 1px) / 7 - 1px)`,top:faixa*29,height:25,zIndex:paletaAberta===t.id?30:1}}>
      <button type="button" title={t.titulo} onClick={e=>{e.stopPropagation();abrir(t.id)}} className="scc-calendar-event h-full w-full overflow-hidden truncate rounded-md px-2 pr-9 text-left text-[11px] font-semibold leading-[24px] text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400" style={{background:cor(t)}}>{t.titulo}</button>
      <button type="button" aria-label={'Alterar cor de '+t.titulo} title="Alterar cor" onClick={e=>{e.stopPropagation();setPaletaAberta(paletaAberta===t.id?null:t.id)}} className="absolute right-1 top-0.5 flex h-5 w-6 items-center justify-center rounded bg-black/35 text-white opacity-0 transition-opacity hover:bg-black/60 focus:opacity-100 group-hover:opacity-100"><Palette size={13}/></button>
      {paletaAberta===t.id&&<div className="absolute right-0 top-7 z-50 w-44 rounded-xl border border-white/15 bg-[#1c1c1e] p-2 shadow-2xl" onClick={e=>e.stopPropagation()}>
       <div className="mb-2 text-[11px] font-semibold text-white">Cor da tarefa</div>
       <div className="grid grid-cols-4 gap-2">{paleta.map(c=><button type="button" key={c} title={c} aria-label={'Escolher '+c} onClick={()=>definirCor(t.id,c)} className="h-7 rounded-md border border-white/20 hover:ring-2 hover:ring-white" style={{background:c}}/>)}</div>
       <button type="button" onClick={()=>definirCor(t.id,null)} className="mt-2 w-full rounded-md border border-white/15 px-2 py-1 text-xs text-white/80 hover:bg-white/10">Cor do status</button>
      </div>}
     </div>)}
    </div>
   </div>)}</div></div></div>
</>}
 </section>
}
