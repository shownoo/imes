import type { Identity } from './auth.js'

export function hasPermission(identity: Identity | null, code: string): boolean {
  if (!identity) return false
  if (identity.role === 'ADMIN') return true
  return identity.permissions.includes(code)
}

export function hasAnyPermission(identity: Identity | null, ...codes: string[]): boolean {
  return codes.some((c) => hasPermission(identity, c))
}

export function requirePermission(identity: Identity | null, ...codes: string[]): boolean {
  if (!identity) return false
  if (identity.role === 'ADMIN') return true
  return codes.some((c) => identity.permissions.includes(c))
}

/** 兼容原有角色层级：admin > supervisor > keeper > viewer */
export function requireRole(identity: Identity | null, ...roles: string[]): boolean {
  if (!identity) return false
  if (identity.role === 'ADMIN') return true
  return roles.includes(identity.role)
}

export function serializeUser(user: {
  id: string
  username: string
  name: string | null
  phone: string | null
  email: string | null
  active: boolean
  role: { id: string; code: string; name: string; permissions?: Array<{ permission: { code: string } }> }
  roleId?: string
}) {
  const permissions = user.role.code === 'ADMIN'
    ? ['*']
    : (user.role.permissions?.map((rp) => rp.permission.code) ?? [])
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    phone: user.phone,
    email: user.email,
    active: user.active,
    roleId: user.roleId ?? user.role.id,
    role: user.role.code,
    roleName: user.role.name,
    permissions,
  }
}

export const userInclude = {
  role: {
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  },
} as const

export function extractPermissions(user: {
  role: {
    code: string
    permissions: Array<{ permission: { code: string } }>
  }
}): string[] {
  if (user.role.code === 'ADMIN') return ['*']
  return user.role.permissions.map((rp) => rp.permission.code)
}
