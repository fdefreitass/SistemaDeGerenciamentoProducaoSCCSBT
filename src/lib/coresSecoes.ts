import { useEffect, useState } from 'react'
import { modoDemo, supabase } from './supabase'

// A cor oficial fica em public.secoes.cor_hex (migração 03).
// Cache local é apenas um fallback no período anterior à aplicação da migração.
const CHAVE = 'scc-producao-cores-secoes-v1'
const EVENTO = 'scc-producao-cores-atualizadas'

export const paletaSecoes = [
  '#e4fa10', '#4fa6ff', '#ff7c35', '#bf79ff',
  '#00d6b2', '#ff5796', '#ffc64f', '#70d98f',
]

function corValida(cor: unknown): cor is string {
  return typeof cor === 'string' && /^#[\da-fA-F]{6}$/.test(cor)
}

function carregarCache(): Record<string, string> {
  try {
    const valor = window.localStorage.getItem(CHAVE)
    if (!valor) return {}
    const entrada: unknown = JSON.parse(valor)
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return {}
    const resultado: Record<string, string> = {}
    Object.entries(entrada).forEach(([id, cor]) => {
      if (corValida(cor)) resultado[id] = cor
    })
    return resultado
  } catch {
    return {}
  }
}

function salvarCache(cores: Record<string, string>) {
  try { window.localStorage.setItem(CHAVE, JSON.stringify(cores)) } catch { /* opcional */ }
}

export function corDaSecao(cores: Record<string, string>, id: string, indice: number) {
  return cores[id] ?? paletaSecoes[indice % paletaSecoes.length]
}

export function useCoresSecoes() {
  const [cores, setCores] = useState<Record<string, string>>(carregarCache)

  useEffect(() => {
    let ativo = true

    async function carregarDoBanco() {
      if (modoDemo || !supabase) {
        if (ativo) setCores(carregarCache())
        return
      }
      const { data, error } = await supabase.from('secoes').select('id, cor_hex')
      if (!ativo) return
      if (error) {
        // Compatibilidade com o banco ainda sem a migração 03.
        // Não fingimos que a cor foi salva no servidor.
        setCores(carregarCache())
        return
      }
      const globais: Record<string, string> = {}
      for (const item of data ?? []) {
        if (corValida(item.cor_hex)) globais[item.id] = item.cor_hex
      }
      setCores(globais)
      salvarCache(globais)
    }

    const sincronizar = () => { void carregarDoBanco() }
    const aoMudarOutraAba = (e: StorageEvent) => {
      if (e.key === CHAVE) sincronizar()
    }
    window.addEventListener(EVENTO, sincronizar)
    window.addEventListener('storage', aoMudarOutraAba)
    void carregarDoBanco()
    return () => {
      ativo = false
      window.removeEventListener(EVENTO, sincronizar)
      window.removeEventListener('storage', aoMudarOutraAba)
    }
  }, [])

  async function definirCor(id: string, cor: string): Promise<void> {
    if (!corValida(cor)) throw new Error('Cor inválida.')

    if (!modoDemo) {
      if (!supabase) throw new Error('Banco de dados não configurado.')
      const { data, error } = await supabase.from('secoes')
        .update({ cor_hex: cor }).eq('id', id).select('id, cor_hex').single()
      if (error || !data) throw new Error('Não foi possível salvar a cor. Verifique as permissões e a migração 03.')
    }

    const proximas = { ...carregarCache(), [id]: cor }
    salvarCache(proximas)
    setCores(proximas)
    window.dispatchEvent(new Event(EVENTO))
  }

  return { cores, definirCor }
}
