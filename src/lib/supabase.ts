import { createClient } from '@supabase/supabase-js'

// Modo de demonstração só existe quando o Vite está em desenvolvimento local.
export const modoDemo = import.meta.env.DEV && import.meta.env.VITE_DATA_SOURCE === 'demo'

const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Sem credenciais, a aplicação NÃO deve cair automaticamente no modo demo.
export const supabase = !modoDemo && url && chave
  ? createClient(url, chave)
  : null

export function obterSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado. Confira as variáveis VITE_SUPABASE_* no .env.local.')
  }
  return supabase
}
