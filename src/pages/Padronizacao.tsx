import { useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2, ClipboardCopy, FileCheck2, Film, Info } from 'lucide-react'

const types = [
  { value: 'CH', label: 'CH — Chamada' },
  { value: 'VT', label: 'VT — Videotape' },
  { value: 'VH', label: 'VH — Vinheta' },
  { value: 'CALHAU', label: 'Calhau' },
] as const

function normalizeName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    .replace(/[^A-Z0-9 -]/g, '').replace(/\s+/g, ' ').trim()
}

export default function Padronizacao() {
  const [type, setType] = useState<(typeof types)[number]['value']>('CH')
  const [program, setProgram] = useState('')
  const [number, setNumber] = useState('')
  const [duration, setDuration] = useState('')
  const [approved, setApproved] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [copied, setCopied] = useState(false)

  const filename = useMemo(() => {
    const name = normalizeName(program)
    const id = number.trim().padStart(2, '0')
    const seconds = Number(duration)
    if (!name || !/^\d{1,4}$/.test(number.trim()) || !Number.isInteger(seconds) || seconds < 1 || seconds > 36000) return ''
    return `${type} - ${name} ${id} - ${seconds}"s.mp4`
  }, [type, program, number, duration])

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!approved || !filename) return
    setConfirmation(filename)
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
        <p>Simulação sem integração externa: confirmar não renomeia, move ou publica arquivos, nem cria materiais no banco. O Google Drive será integrado somente na última etapa.</p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={confirm} className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-6">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold"><Film size={20}/> Identificação do material</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-xs font-semibold text-white/70">Tipo de material
              <select value={type} onChange={e => { setType(e.target.value as typeof type); setConfirmation('') }} className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] p-3 text-sm text-white">
                {types.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-white/70">Código numérico
              <input required inputMode="numeric" pattern="[0-9]{1,4}" maxLength={4} placeholder="01" value={number} onChange={e => { setNumber(e.target.value); setConfirmation('') }} className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] p-3 text-sm text-white" />
            </label>
            <label className="text-xs font-semibold text-white/70 sm:col-span-2">Programa ou produto
              <input required maxLength={100} placeholder="Ex.: SCC News" value={program} onChange={e => { setProgram(e.target.value); setConfirmation('') }} className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] p-3 text-sm text-white" />
            </label>
            <label className="text-xs font-semibold text-white/70">Duração em segundos
              <input required type="number" min="1" max="36000" step="1" placeholder="30" value={duration} onChange={e => { setDuration(e.target.value); setConfirmation('') }} className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] p-3 text-sm text-white" />
            </label>
          </div>
          <label className="mt-7 flex cursor-pointer items-start gap-3 text-sm text-white/70">
            <input type="checkbox" checked={approved} onChange={e => { setApproved(e.target.checked); setConfirmation('') }} className="mt-1 accent-[#e2fa00]"/>
            Confirmo que este material recebeu aprovação final da equipe responsável.
          </label>
          <button type="submit" disabled={!filename || !approved} className="mt-6 rounded-xl bg-[#e2fa00] px-5 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">Confirmar padronização (simulação)</button>
        </form>

        <section className="h-fit rounded-2xl border border-white/10 bg-[#1f1f1f] p-6">
          <h2 className="text-lg font-bold">Prévia do nome</h2>
          <p className="mt-2 text-xs text-white/45">Formato previsto para arquivos MP4 aprovados.</p>
          <div className="mt-6 break-all rounded-xl border border-white/10 bg-[#080808] p-4 font-mono text-sm text-[#e2fa00]" aria-live="polite">
            {filename || 'Preencha os campos para gerar o nome'}
          </div>
          <button type="button" disabled={!filename} onClick={() => void copy()} className="mt-4 flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold disabled:opacity-40"><ClipboardCopy size={15}/>{copied ? 'Copiado' : 'Copiar nome'}</button>
          {confirmation && <p role="status" className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200"><CheckCircle2 size={17} className="shrink-0"/> Simulação confirmada para {confirmation}. Nenhum arquivo foi alterado.</p>}
        </section>
      </div>
    </main>
  )
}
