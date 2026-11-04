/**
 * SCC Producao | Testes HTTP de RLS para ambiente de DESENVOLVIMENTO.
 * Salve como scripts/testar-rls-api.mjs na raiz do projeto.
 * Executar com Node.js 22+ e @supabase/supabase-js instalado.
 * Nao inclua credenciais, tokens JWT ou chave secreta neste arquivo.
 * ATENCAO: se a permissao de INSERT estiver incorreta, o teste pode criar
 * um material FICTICIO; o script mostra o codigo para limpeza posterior.
 */
import { createClient } from '@supabase/supabase-js'

try {
  process.loadEnvFile('.env.local')
} catch {
  console.error('ERRO: nao encontrei .env.local. Execute a partir da raiz do projeto.')
  process.exit(1)
}

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const email = process.env.SCC_TEST_EMAIL
const password = process.env.SCC_TEST_PASSWORD

if (
  process.env.VITE_DATA_SOURCE !== 'supabase' ||
  !url?.startsWith('https://') ||
  !key?.startsWith('sb_publishable_') ||
  !email || !password ||
  process.env.SCC_RLS_CONFIRM !== 'SIM_DEV'
) {
  console.error('ERRO: verifique .env.local e as variaveis temporarias SCC_TEST_EMAIL, SCC_TEST_PASSWORD e SCC_RLS_CONFIRM.')
  process.exit(1)
}

const opts = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}
const anon = createClient(url, key, opts)
const leitor = createClient(url, key, opts)
let falhas = 0
let inconclusivos = 0

function reportar(titulo, resultado, detalhe = '') {
  const prefixo = resultado === true ? 'OK' : resultado === false ? 'FALHA' : 'INCONCLUSIVO'
  console.log(`${prefixo} — ${titulo}${detalhe ? ` (${detalhe})` : ''}`)
  if (resultado === false) falhas++
  if (resultado === null) inconclusivos++
}

function acessoNegado(error) {
  return error?.code === '42501'
}

async function main() {
  console.log(`\nSCC Producao — Teste API REST: ${new URL(url).hostname}`)
  console.log('ATENCAO: executar apenas em projeto de desenvolvimento com dados ficticios.\n')

  const { data: sessao, error: erroLogin } = await leitor.auth.signInWithPassword({ email, password })
  if (erroLogin || !sessao.user) throw new Error('Login do leitor falhou. Verifique a conta de teste.')

  const { data: perfil, error: erroPerfil } = await leitor
    .from('perfis').select('papel, ativo').eq('id', sessao.user.id).single()
  if (erroPerfil || perfil?.papel !== 'leitor' || perfil?.ativo !== true) {
    throw new Error('A conta autenticada nao e um leitor ativo. Teste interrompido.')
  }
  console.log('Identidade confirmada: leitor ativo.\n')

  const { data: candidatos, error: erroAlvo } = await leitor
    .from('materiais').select('id, titulo, secao_id')
    .ilike('titulo', '%TESTE%').limit(1)
  if (erroAlvo || !candidatos?.length) {
    throw new Error('Nao ha material contendo TESTE no titulo visivel ao leitor. Cadastre um material ficticio antes.')
  }
  const alvo = candidatos[0]
  reportar('Leitor consulta material de teste', true)

  for (const tabela of ['materiais', 'secoes', 'historico_materiais', 'perfis']) {
    const { data, error } = await anon.from(tabela).select('id').limit(1)
    // Um erro de permissao ou nenhuma linha visivel atende a politica esperada.
    // A confirmacao definitiva requer que a tabela contenha linhas de teste.
    reportar(`Sem login: consulta ${tabela} bloqueada`,
      acessoNegado(error) || (!error && Array.isArray(data) && data.length === 0)
        ? true : error ? null : false,
      error && !acessoNegado(error) ? `codigo inesperado: ${error.code || 'desconhecido'}` : ''
    )
  }

  // UPDATE de valor identico sobre fixture real: se for permitido, pode gerar
  // uma entrada de auditoria, embora o titulo nao mude.
  const { data: alterados, error: erroUpdate } = await leitor.from('materiais')
    .update({ titulo: alvo.titulo }).eq('id', alvo.id).select('id')
  reportar('Leitor impedido de editar pela API',
    acessoNegado(erroUpdate) || (!erroUpdate && (alterados?.length ?? 0) === 0)
      ? true : erroUpdate ? null : false,
    erroUpdate && !acessoNegado(erroUpdate) ? `codigo inesperado: ${erroUpdate.code || 'desconhecido'}` : ''
  )

  // INSERT real apenas de fixture descartavel. Se uma politica estiver errada,
  // o registro pode ficar salvo. O codigo unico ajuda a encontrar e remover.
  const codigo = `RLS${Date.now().toString(36).toUpperCase()}`
  const { data: inseridos, error: erroInsert } = await leitor.from('materiais')
    .insert({ secao_id: alvo.secao_id, codigo, titulo: 'TESTE RLS NAO SALVAR', duracao_segundos: 15 })
    .select('id')

  const { data: conferido, error: erroConferencia } = await leitor.from('materiais')
    .select('id').eq('secao_id', alvo.secao_id).eq('codigo', codigo)

  let statusInsert = null
  if (erroConferencia) {
    statusInsert = null
  } else if ((conferido?.length ?? 0) > 0 || (inseridos?.length ?? 0) > 0) {
    statusInsert = false
  } else if (acessoNegado(erroInsert)) {
    statusInsert = true
  } else if (!erroInsert) {
    // RLS pode ocultar resultado sem insert, mas e preciso entender a politica.
    statusInsert = true
  }
  reportar('Leitor impedido de cadastrar pela API', statusInsert,
    statusInsert === false ? `registro indevido com codigo ${codigo}` :
    statusInsert === null ? `verifique codigo do erro: ${erroInsert?.code || erroConferencia?.code || 'desconhecido'}` : '')

  if (statusInsert === false) {
    console.log(`ALERTA: cadastro de teste pode ter sido salvo. Localize codigo ${codigo} no Supabase e remova-o como administrador apos corrigir as permissoes.`)
  }

  const { error: erroHistorico } = await leitor
    .from('historico_materiais').select('id').limit(1)
  reportar('Leitor autorizado consulta historico', !erroHistorico,
    erroHistorico ? `codigo: ${erroHistorico.code || 'desconhecido'}` : '')

  console.log(`\nResumo: ${falhas} falha(s); ${inconclusivos} inconclusivo(s).`)
  console.log('Estes testes sao parciais; ainda falta testar perfis editor/admin, exclusao em fixture e segregacao de dados.')
  if (falhas || inconclusivos) process.exitCode = 1
  await leitor.auth.signOut({ scope: 'local' })
}

main().catch((err) => {
  console.error('INCONCLUSIVO — ' + err.message)
  process.exitCode = 1
})
