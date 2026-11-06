
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const chave = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const email = process.env.SCC_TEST_EMAIL
const senha = process.env.SCC_TEST_PASSWORD
const papelTeste = process.env.SCC_TEST_ROLE ?? 'admin'

if (!url || !chave || !email || !senha) {
  console.error('Configuracao de teste incompleta.')
  process.exit(1)
}

if (!['admin', 'leitor'].includes(papelTeste)) {
  console.error('Perfil de teste invalido.')
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
  // 1. Autenticar usuario
  const { data: login, error: erroLogin } =
    await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

  if (erroLogin || !login.session) {
    throw new Error('Falha na autenticacao.')
  }

  console.log('Autenticacao realizada.')

  // 2. Chamar Edge Function
  const { data, error } = await supabase.functions.invoke(
    'criar-usuario-temporario',
    {
      body: {
        nome: 'Colaborador Ficticio',
        email: 'colaborador@exemplo.invalid',
        papel: 'leitor',
      },
    }
  )

  const status = error
    ? (error.context?.status ?? 0)
    : 200

  console.log('HTTP:', status)

  // 3. Validar permissoes
  if (papelTeste === 'leitor') {
    if (status !== 403) {
      throw new Error(
        'FALHA: leitor deveria receber HTTP 403.'
      )
    }

    console.log('OK - Leitor bloqueado pela API.')
    console.log('Nenhuma conta criada neste teste.')
  } else {
    if (
      error ||
      status !== 200 ||
      data?.ok !== true ||
      data?.simulacao !== true
    ) {
      throw new Error(
        'Simulacao administrativa falhou.'
      )
    }

    console.log('OK - Simulacao aprovada.')
    console.log('Nenhuma conta foi criada.')
  }
} catch (erro) {
  console.error(
    erro instanceof Error
      ? erro.message
      : 'Erro desconhecido no teste.'
  )

  process.exitCode = 1
} finally {
  await supabase.auth.signOut()
}
