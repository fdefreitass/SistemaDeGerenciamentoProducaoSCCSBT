import { useEffect, useState } from 'react'
import { modoDemo, supabase } from './supabase'

export const indicadores = [
  { id: 'total', titulo: 'Total de materiais', cor: '#E2FA00' },
  { id: 'em_utilizacao', titulo: 'Em utilização', cor: '#36D6AD' },
  { id: 'precisa_atualizar', titulo: 'Precisa atualizar', cor: '#B598FF' },
  { id: 'precisa_gravar', titulo: 'Precisa gravar', cor: '#FF9A60' },
] as const

export type IndicadorId = (typeof indicadores)[number]['id']
export type CoresIndicadores = Record<IndicadorId, string>
export const coresPadrao: CoresIndicadores = {
  total: '#E2FA00',
  em_utilizacao: '#36D6AD',
  precisa_atualizar: '#B598FF',
  precisa_gravar: '#FF9A60',
}
const evento = 'scc-cores-indicadores-atualizadas'
const corValida = (cor: string): boolean => /^#[\da-fA-F]{6}$/.test(cor)

export function useCoresIndicadores() {
  const [cores, setCores] = useState<CoresIndicadores>({ ...coresPadrao })

  useEffect(() => {
    let ativo = true
    const carregar = async () => {
      if (modoDemo || !supabase) return
      const { data, error } = await supabase.from('cores_indicadores')
        .select('indicador, cor_hex')
      if (error || !ativo) return
      const novas = { ...coresPadrao }
      for (const item of data ?? []) {
        if (item.indicador in novas && typeof item.cor_hex === 'string' && corValida(item.cor_hex)) {
          novas[item.indicador as IndicadorId] = item.cor_hex.toUpperCase()
        }
      }
      if (ativo) setCores(novas)
    }

    const sincronizar = () => { void carregar() }
    window.addEventListener(evento, sincronizar)
    void carregar()
    return () => { ativo = false; window.removeEventListener(evento, sincronizar) }
  }, [])

  async function definirCor(id: IndicadorId, cor: string): Promise<void> {
    const normalizada = cor.trim().toUpperCase()
    if (!corValida(normalizada)) throw new Error('Informe uma cor HEX válida, como #E2FA00.')
    if (!modoDemo) {
      if (!supabase) throw new Error('Supabase indisponível.')
      const { data, error } = await supabase.from('cores_indicadores')
        .update({ cor_hex: normalizada }).eq('indicador', id)
        .select('indicador, cor_hex').single()
      if (error || !data) throw new Error('Não foi possível salvar. Confirme seu perfil administrador.')
    }
    setCores(atual => ({ ...atual, [id]: normalizada }))
    window.dispatchEvent(new Event(evento))
  }

  return { cores, definirCor }
}
