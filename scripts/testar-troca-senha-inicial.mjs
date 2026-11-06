
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const chave = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const email = process.env.SCC_TEST_EMAIL
const senha = process.env.SCC_TEST_PASSWORD

if (!url || !chave || !email || !senha) {
  console.error('Configuracao incompleta.')
  process.exit(1)
}

const supabase = createClient(url, chave, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

try {
  const { data: login, error: erroLogin } =
    await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

  if (erroLogin || !login.session) {
    throw new Error('Falha na autenticacao.')
  }

  console.log('Autenticacao realizada.')

  const { error } = await supabase.functions.invoke(
    'trocar-senha-inicial',
    { body: {} }
  )

  const status = error?.context?.status ?? 200

  console.log('HTTP:', status)

  if (status !== 403) {
    throw new Error(
      'FALHA: esperado HTTP 403 para conta sem troca pendente.'
    )
  }

  console.log('OK - Troca de senha nao autorizada.')
  console.log('Nenhuma senha foi alterada.')
} catch (erro) {
  console.error(
    erro instanceof Error ? erro.message : 'Erro no teste.'
  )
  process.exitCode = 1
} finally {
  await supabase.auth.signOut()
}
