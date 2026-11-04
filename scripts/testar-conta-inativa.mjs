
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const email = process.env.SCC_TEST_EMAIL
const password = process.env.SCC_TEST_PASSWORD

if (!url || !key || !email || !password) {
  console.error('INCONCLUSIVO: configuracao incompleta.')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

const { error: loginError } =
  await supabase.auth.signInWithPassword({
    email,
    password,
  })

if (loginError) {
  console.log('INCONCLUSIVO: Auth recusou o login.')
  process.exit(1)
}

console.log('Autenticacao realizada. Verificando RLS...')

let falhas = 0

for (const tabela of ['materiais', 'secoes', 'historico_materiais']) {
  const { data, error } = await supabase
    .from(tabela)
    .select('id')
    .limit(1)

  if (error) {
    console.log(`REVISAR — ${tabela}: ${error.code}`)
  } else if (data.length === 0) {
    console.log(`OK — ${tabela}: nenhum registro acessivel`)
  } else {
    console.log(`FALHA — ${tabela}: dados acessiveis`)
    falhas++
  }
}

await supabase.auth.signOut({ scope: 'local' })

console.log(`Resultado: ${falhas} falha(s).`)
