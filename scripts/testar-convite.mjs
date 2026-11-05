
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const email = process.env.SCC_TEST_EMAIL
const password = process.env.SCC_TEST_PASSWORD
const emailDestino = process.env.SCC_INVITE_TEST_EMAIL

if (!url || !key || !email || !password || !emailDestino) {
  console.error('ERRO: Configuracao incompleta.')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const { error: loginError } =
  await supabase.auth.signInWithPassword({
    email,
    password,
  })

if (loginError) {
  console.error('ERRO: Falha na autenticacao.')
  process.exit(1)
}

console.log('Autenticacao realizada.')

const { data, error } = await supabase.functions.invoke(
  'convidar-usuario',
  {
    body: {
      nome: 'Usuario de Teste',
      email: emailDestino,
    },
  }
)

if (error) {
  const resposta = error.context
  console.log(
    'HTTP:',
    resposta instanceof Response
      ? resposta.status
      : 'Indeterminado'
  )
  console.log('Solicitacao nao autorizada ou falhou.')
} else {
  console.log('HTTP: 200')
  console.log('Simulacao:', data?.simulacao)
  console.log('Mensagem:', data?.mensagem)
}

await supabase.auth.signOut({ scope: 'local' })
