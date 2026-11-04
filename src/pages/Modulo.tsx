
import { Link } from 'react-router'

type ModuloProps = {
  titulo: string
  descricao: string
  cor: string
}

export default function Modulo({
  titulo,
  descricao,
  cor,
}: ModuloProps) {
  return (
    <section className="mx-auto max-w-6xl px-8 py-24">
      <Link
        to="/"
        className="text-sm text-white/50 transition hover:text-white"
      >
        ← Voltar ao início
      </Link>

      <div
        className="mt-12 h-2 w-16 rounded-full"
        style={{ backgroundColor: cor }}
      />

      <h1 className="mt-6 text-5xl font-black">
        {titulo}
      </h1>

      <p className="mt-4 text-white/50">
        {descricao}
      </p>

      <div className="mt-12 rounded-2xl border border-white/10 bg-[#151515] p-10">
        <h2 className="text-xl font-bold">
          Módulo em construção
        </h2>

        <p className="mt-3 text-sm text-white/50">
          Em breve, esta área receberá suas funcionalidades.
        </p>
      </div>
    </section>
  )
}
