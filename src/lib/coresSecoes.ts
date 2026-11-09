import { useEffect, useState } from 'react'

// Cores de apresentação armazenadas somente neste navegador.
// Não modificam a estrutura das seções nem as permissões do Supabase.
const CHAVE = 'scc-producao-cores-secoes-v1'
const EVENTO = 'scc-producao-cores-atualizadas'

export const paletaSecoes = [
  '#e4fa10', '#4fa6ff', '#ff7c35', '#bf79ff',
  '#00d6b2', '#ff5796', '#ffc64f', '#70d98f',
]

function corValida(cor: string): boolean {
  return /^#[\da-fA-F]{6}$/.test(cor)
}

function carregar(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const valor = window.localStorage.getItem(CHAVE)
    if (!valor) return {}
    const entrada: unknown = JSON.parse(valor)
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return {}
    const resultado: Record<string, string> = {}
    Object.entries(entrada).forEach(([id, cor]) => {
      if (typeof cor === 'string' && corValida(cor)) resultado[id] = cor
    })
    return resultado
  } catch {
    return {}
  }
}

export function corDaSecao(cores: Record<string, string>, id: string, indice: number) {
  return cores[id] ?? paletaSecoes[indice % paletaSecoes.length]
}

export function useCoresSecoes() {
  const [cores, setCores] = useState<Record<string, string>>(carregar)

  useEffect(() => {
    const atualizar = () => setCores(carregar())
    window.addEventListener('storage', atualizar)
    window.addEventListener(EVENTO, atualizar)
    return () => {
      window.removeEventListener('storage', atualizar)
      window.removeEventListener(EVENTO, atualizar)
    }
  }, [])

  function definirCor(id: string, cor: string) {
    if (!corValida(cor)) return
    const proximas = { ...carregar(), [id]: cor }
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(proximas))
    } catch {
      // O preview continua utilizável mesmo se o navegador bloquear armazenamento.
    }
    setCores(proximas)
    window.dispatchEvent(new Event(EVENTO))
  }

  return { cores, definirCor }
}
