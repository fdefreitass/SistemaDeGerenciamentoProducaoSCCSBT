
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { modoDemo } from '../lib/supabase'
import {
  listarUsuarios,
  type UsuarioResumo,
} from '../services/usuarios'

const nomesPapel = {
  admin: 'Administrador',
  editor: 'Editor',
  leitor: 'Leitor',
}

export default function Administracao() {
  const { perfil } = useAuth()

  const administrador = Boolean(
    !modoDemo && perfil?.ativo && perfil.papel === 'admin'
  )

  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (!administrador) return

    let cancelado = false

    async function carregar() {
      try {
        const dados = await listarUsuarios()
        if (!cancelado) setUsuarios(dados)
      } catch {
        if (!cancelado) {
          setErro('Não foi possível carregar a lista de usuários.')
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    void carregar()

    return () => {
      cancelado = true
    }
  }, [administrador])

  if (!administrador) {
    return (
      <section className="mx-auto max-w-6xl px-8 py-20">
        <h1 className="text-3xl font-bold">Acesso restrito</h1>
        <p className="mt-3 text-white/50">
          Esta área é exclusiva para administradores.
        </p>
        <Link to="/" className="mt-6 inline-block text-blue-400">
          Voltar ao início
        </Link>
      </section>
    )
  }

  const filtrados = usuarios.filter((usuario) =>
    `${usuario.nome} ${usuario.papel}`
      .toLowerCase()
      .includes(busca.toLowerCase())
  )

  const ativos = usuarios.filter((u) => u.ativo).length

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <Link to="/" className="text-sm text-white/50 hover:text-white">
        ← Voltar ao início
      </Link>

      <div className="mt-10">
        <p className="text-xs font-bold tracking-widest text-blue-400">
          ADMINISTRAÇÃO SCC SBT
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Gerenciamento de Usuários
        </h1>

        <p className="mt-3 text-white/50">
          Consulte usuários, permissões e situação das contas.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { titulo: 'TOTAL DE USUÁRIOS', valor: usuarios.length },
          { titulo: 'USUÁRIOS ATIVOS', valor: ativos },
          { titulo: 'USUÁRIOS INATIVOS', valor: usuarios.length - ativos },
        ].map((indicador) => (
          <div
            key={indicador.titulo}
            className="rounded-2xl border border-white/10 bg-[#151515] p-6"
          >
            <p className="text-xs font-semibold text-white/50">
              {indicador.titulo}
            </p>
            <p className="mt-4 text-3xl font-black">
              {indicador.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <input
          type="search"
          placeholder="Pesquisar nome ou perfil..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-sm outline-none focus:border-blue-500"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="bg-[#202020] text-xs text-white/50">
            <tr>
              <th className="px-5 py-4">NOME</th>
              <th className="px-5 py-4">PERFIL</th>
              <th className="px-5 py-4">SITUAÇÃO</th>
              <th className="px-5 py-4">CADASTRADO EM</th>
            </tr>
          </thead>

          <tbody>
            {!carregando && !erro && filtrados.map((usuario) => (
              <tr
                key={usuario.id}
                className="border-t border-white/10 hover:bg-white/5"
              >
                <td className="px-5 py-4 font-medium">
                  {usuario.nome}
                </td>

                <td className="px-5 py-4 text-white/70">
                  {nomesPapel[usuario.papel]}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={
                      usuario.ativo ? 'text-green-400' : 'text-red-400'
                    }
                  >
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>

                <td className="px-5 py-4 text-white/50">
                  {new Date(usuario.criado_em).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {carregando && (
          <p className="p-8 text-center text-white/50">
            Carregando usuários...
          </p>
        )}

        {erro && (
          <p role="alert" className="p-8 text-center text-red-400">
            {erro}
          </p>
        )}

        {!carregando && !erro && filtrados.length === 0 && (
          <p className="p-8 text-center text-white/50">
            Nenhum usuário encontrado.
          </p>
        )}
      </div>

      <p className="mt-6 text-xs text-white/40">
        Primeira etapa: consulta protegida. Edição e convites
        serão implementados pelo backend administrativo.
      </p>
    </section>
  )
}
