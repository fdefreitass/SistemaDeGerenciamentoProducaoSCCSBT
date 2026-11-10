import { useState, type ReactNode } from 'react'
import { ClipboardList, FileCheck2, House, LockKeyhole, Menu, Tv, type LucideIcon } from 'lucide-react'

export type SccModule = 'home' | 'tasks' | 'standardization' | 'schedule'
export type ModulePermissions = Record<SccModule, boolean>

export const defaultModulePermissions: ModulePermissions = {
  home: true,
  tasks: false,
  standardization: false,
  schedule: false,
}

const navigation: { id: SccModule; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Início', icon: House },
  { id: 'tasks', label: 'Gestão de Tarefas', icon: ClipboardList },
  { id: 'standardization', label: 'Sistema de Padronização', icon: FileCheck2 },
  { id: 'schedule', label: 'Grade da Programação', icon: Tv },
]

type Props = {
  permissions: ModulePermissions
  activeModule: SccModule
  onNavigate: (module: SccModule) => void
  children: ReactNode
}

export function SccAppShell({ permissions, activeModule, onNavigate, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#080808] text-white">
      <aside className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-white/10 bg-[#141414] transition-[width] duration-200 ${collapsed ? 'w-20' : 'w-72'}`}>
        <div className="flex items-center justify-between gap-2 border-b border-white/10 p-4">
          {!collapsed && <strong className="truncate text-sm tracking-widest">SCC PRODUÇÃO</strong>}
          <button type="button" aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)} className="rounded-lg p-2 hover:bg-white/10">
            <Menu size={20} />
          </button>
        </div>
        <nav aria-label="Navegação principal" className="flex flex-col gap-2 p-3">
          {navigation.map(({ id, label, icon: Icon }) => {
            const allowed = permissions[id]
            const selected = activeModule === id
            return (
              <button key={id} type="button" disabled={!allowed} title={!allowed ? `${label} — acesso restrito` : label} aria-current={selected ? 'page' : undefined}
                onClick={() => { if (allowed) onNavigate(id) }}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors ${selected ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'} ${allowed ? '' : 'cursor-not-allowed opacity-45'}`}>
                <Icon size={19} className="shrink-0" />
                {!collapsed && <span className="flex-1">{label}</span>}
                {!allowed && <LockKeyhole size={14} className="shrink-0" aria-label="Sem permissão" />}
              </button>
            )
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
