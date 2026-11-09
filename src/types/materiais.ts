export type Papel = 'admin' | 'editor' | 'leitor'
export type StatusGrade =
  | 'em_utilizacao'
  | 'fora_da_grade'
  | 'aguardando_entrada'
  | 'removido'
export type StatusProducao =
  | 'em_dia'
  | 'precisa_atualizar'
  | 'precisa_gravar'
  | 'em_producao'
  | 'aguardando_aprovacao'
  | 'pronto_para_envio'

export type Perfil = {
  id: string
  nome: string
  papel: Papel
  ativo: boolean
  troca_senha_pendente: boolean
}

export type Secao = { id: string; nome: string; cor_hex?: string | null }
export type Material = {
  id: string
  secao_id: string
  codigo: string | null
  titulo: string
  duracao_segundos: number | null
  status_grade: StatusGrade | null
  status_producao: StatusProducao | null
  link_externo: string | null
  observacoes: string | null
}

export const statusGrade: { value: StatusGrade; label: string }[] = [
  { value: 'em_utilizacao', label: 'Em utilização' },
  { value: 'fora_da_grade', label: 'Fora da grade' },
  { value: 'aguardando_entrada', label: 'Aguardando entrada' },
  { value: 'removido', label: 'Removido' },
]
export const statusProducao: { value: StatusProducao; label: string }[] = [
  { value: 'em_dia', label: 'Em dia' },
  { value: 'precisa_atualizar', label: 'Precisa atualizar' },
  { value: 'precisa_gravar', label: 'Precisa gravar' },
  { value: 'em_producao', label: 'Em produção' },
  { value: 'aguardando_aprovacao', label: 'Aguardando aprovação' },
  { value: 'pronto_para_envio', label: 'Pronto para envio' },
]
