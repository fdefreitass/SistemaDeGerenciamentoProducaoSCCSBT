import { useEffect, useMemo, useState } from 'react'
import { modoDemo, supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type AvatarProps = {
  id?: string | null
  nome: string
  tamanho?: number
  className?: string
}

export default function Avatar({ id, nome, tamanho = 42, className = '' }: AvatarProps) {
  const { revisaoAvatar } = useAuth()
  const [url, setUrl] = useState<string | null>(null)
  const iniciais = useMemo(() => {
    const partes = nome.trim().split(/\s+/).filter(Boolean)
    return ((partes[0]?.[0] ?? 'S') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toLocaleUpperCase('pt-BR')
  }, [nome])

  useEffect(() => {
    const client = supabase
    setUrl(null)
    if (modoDemo || !id || !client) return
    let ativo = true
    let temporaria: string | null = null

    // Bucket PRIVADO: imagem obtida com o JWT do usuário, nunca por URL pública.
    void client.storage.from('scc-avatars').download(`${id}/avatar`).then(({ data, error }) => {
      if (error || !data) return
      const novaUrl = URL.createObjectURL(data)
      if (!ativo) { URL.revokeObjectURL(novaUrl); return }
      temporaria = novaUrl
      setUrl(novaUrl)
    })

    return () => {
      ativo = false
      if (temporaria) URL.revokeObjectURL(temporaria)
    }
  }, [id, revisaoAvatar])

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-blue-600/80 to-violet-700/80 font-extrabold text-white ${className}`}
      style={{ width: tamanho, height: tamanho, fontSize: Math.max(12, tamanho * .32) }}
    >
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : iniciais}
    </span>
  )
}
