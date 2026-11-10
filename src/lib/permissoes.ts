import type { Papel } from '../types/materiais'
export type Permission = 'tasks.read' | 'tasks.write' | 'standardization.read' | 'standardization.write' | 'grade.read' | 'grade.write' | 'users.manage'

/** UI hints only. All mutations must also be authorized by database RLS. */
const rules: Record<Papel, readonly Permission[]> = {
  admin: ['tasks.read', 'tasks.write', 'standardization.read', 'standardization.write', 'grade.read', 'grade.write', 'users.manage'],
  producao: ['tasks.read', 'tasks.write', 'standardization.read', 'standardization.write', 'grade.read'],
  opec: ['grade.read', 'grade.write'],
  editor: ['grade.read', 'grade.write'],
  leitor: ['grade.read'],
}
export function can(papel: Papel | null | undefined, permission: Permission): boolean {
  return papel ? rules[papel].includes(permission) : false
}
