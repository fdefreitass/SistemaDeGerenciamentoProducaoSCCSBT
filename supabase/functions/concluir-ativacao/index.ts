import { createClient } from '@supabase/supabase-js'

// A conclusão exige POSSE DE UM CONVITE INDIVIDUAL VÁLIDO.
// Sem JWT prévio: o token de convite de uso único autentica este passo.
const ORIGENS = new Set([
  'https://producaosccsbt.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

function cors(req: Request) {
  const origem = req.headers.get('origin')
  return {
    'Access-Control-Allow-Origin': origem && ORIGENS.has(origem) ? origem : 'https://producaosccsbt.pages.dev',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Vary': 'Origin',
  }
}
function resposta(req: Request, dados: Record<string, unknown>, status = 200) {
  return Response.json(dados, {
    status,
    headers: { ...cors(req), 'Cache-Control': 'no-store' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(req) })
  }
  if (req.method !== 'POST') return resposta(req, { erro: 'Método não permitido.' }, 405)

  const entrada: unknown = await req.json().catch(() => null)
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
    return resposta(req, { erro: 'Dados inválidos.' }, 400)
  }
  const valores = entrada as Record<string, unknown>
  const token_hash = valores.token_hash
  const senhaNova = valores.senhaNova

  if (typeof token_hash !== 'string' || token_hash.length < 20 || token_hash.length > 1024 ||
      typeof senhaNova !== 'string' || senhaNova.length < 12 || senhaNova.length > 128 ||
      !/[A-Z]/.test(senhaNova) || !/[a-z]/.test(senhaNova) ||
      !/[0-9]/.test(senhaNova) || !/[^a-zA-Z0-9]/.test(senhaNova)) {
    return resposta(req, { erro: 'Convite inválido ou senha fora dos requisitos.' }, 400)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceKey) return resposta(req, { erro: 'Ativação indisponível.' }, 503)

  const authCliente = createClient(url, anonKey, { auth: {
    persistSession: false, autoRefreshToken: false, detectSessionInUrl: false,
  } })
  const admin = createClient(url, serviceKey, { auth: {
    persistSession: false, autoRefreshToken: false,
  } })

  // Supabase valida a assinatura e o vencimento do OTP e invalida o token.
  const { data: verificado, error: erroConvite } =
    await authCliente.auth.verifyOtp({ type: 'invite', token_hash })
  if (erroConvite || !verificado.user?.id) {
    return resposta(req, { erro: 'Convite expirado ou já utilizado. Solicite outro ao administrador.' }, 403)
  }

  const id = verificado.user.id
  const { data: perfil, error: erroPerfil } = await admin
    .from('perfis').select('ativo, papel, troca_senha_pendente').eq('id', id).maybeSingle()
  if (erroPerfil || !perfil || !perfil.ativo || !perfil.troca_senha_pendente ||
      (perfil.papel !== 'leitor' && perfil.papel !== 'editor')) {
    return resposta(req, { erro: 'Esta conta não está autorizada para ativação.' }, 403)
  }

  const { error: erroSenha } = await admin.auth.admin.updateUserById(id, { password: senhaNova })
  if (erroSenha) {
    return resposta(req, { erro: 'Não foi possível definir a senha. Solicite um novo convite.' }, 502)
  }

  const { data: liberado, error: erroLiberacao } = await admin.from('perfis')
    .update({ troca_senha_pendente: false }).eq('id', id)
    .eq('ativo', true).eq('troca_senha_pendente', true)
    .select('id').maybeSingle()
  if (erroLiberacao || !liberado) {
    return resposta(req, { erro: 'Senha definida, mas a liberação precisa de revisão administrativa.' }, 500)
  }

  // Nunca retornar sessão, token ou senha ao navegador.
  return resposta(req, { ok: true, mensagem: 'Conta ativada. Acesse com seu e-mail e senha.' })
})
