import type { YogaInitialContext } from 'graphql-yoga'
import { resolveIdentity, type Identity } from './lib/auth.js'
import { prisma } from './lib/prisma.js'

export interface Context {
  prisma: typeof prisma
  identity: Identity | null
  isAuthenticated: boolean
  clientIp: string | null
}

function resolveClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null
  return request.headers.get('x-real-ip')
}

export async function createContext(initialContext: YogaInitialContext): Promise<Context> {
  const authorization = initialContext.request.headers.get('authorization') ?? undefined
  const identity = await resolveIdentity(authorization)
  return {
    prisma,
    identity,
    isAuthenticated: identity !== null,
    clientIp: resolveClientIp(initialContext.request),
  }
}
