import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import ScopeAuthPlugin from '@pothos/plugin-scope-auth'
import { DateTimeResolver, JSONResolver } from 'graphql-scalars'
import { GraphQLError } from 'graphql'
import { Prisma } from '@prisma/client'
import type PrismaTypes from '@pothos/plugin-prisma/generated'
import { prisma } from './lib/prisma.js'
import type { Context } from './context.js'
import { requireRole, requirePermission } from './lib/auth.js'

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes
  Context: Context
  Scalars: {
    DateTime: { Input: Date; Output: Date }
    JSON: { Input: unknown; Output: unknown }
  }
  AuthScopes: {
    authenticated: boolean
    admin: boolean
    supervisor: boolean
    systemRead: boolean
    systemWrite: boolean
  }
}>({
  plugins: [ScopeAuthPlugin, PrismaPlugin],
  prisma: {
    client: (ctx: Context) => ctx.prisma as never,
    dmmf: Prisma.dmmf as unknown as { datamodel: unknown },
    onUnusedQuery: process.env.NODE_ENV === 'production' ? null : 'warn',
  },
  scopeAuth: {
    authScopes: async (ctx) => ({
      authenticated: ctx.isAuthenticated,
      admin: requireRole(ctx.identity, 'ADMIN'),
      supervisor: requireRole(ctx.identity, 'ADMIN', 'SUPERVISOR'),
      systemRead: requirePermission(ctx.identity, 'system:user:read', 'system:role:read', 'system:log:read'),
      systemWrite: requirePermission(ctx.identity, 'system:user:write', 'system:role:write'),
    }),
    unauthorizedError: () => new GraphQLError('Unauthorized'),
  },
})

builder.addScalarType('DateTime', DateTimeResolver)
builder.addScalarType('JSON', JSONResolver)

builder.queryType({})
builder.mutationType({})
