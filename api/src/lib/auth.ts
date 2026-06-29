import jwt from 'jsonwebtoken'
import { prisma } from './prisma.js'
import { extractPermissions, userInclude } from './rbac.js'

export interface Identity {
  userId: string
  username: string
  name: string | null
  role: string
  roleId: string
  roleName: string
  permissions: string[]
}

interface TokenPayload {
  sub: string
  username: string
  role: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'imes-dev-secret'

export function signToken(payload: Omit<TokenPayload, 'sub'> & { sub: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export async function resolveIdentity(authorization?: string): Promise<Identity | null> {
  if (!authorization) return null
  const match = /\s*bearer\s+([^\s]+)/i.exec(authorization)
  const token = match?.[1]
  if (!token) return null

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: userInclude,
    })
    if (!user?.active) return null
    return {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role.code,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: extractPermissions(user),
    }
  } catch {
    return null
  }
}

export { requireRole, requirePermission, hasPermission } from './rbac.js'
