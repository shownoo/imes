import { builder } from '../builder.js'
import { PaginationInput } from './input-types.js'

builder.queryField('getSystemLogs', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: {
      module: t.arg.string({ required: false }),
      action: t.arg.string({ required: false }),
      userId: t.arg.id({ required: false }),
      input: t.arg({ type: PaginationInput, required: false }),
    },
    resolve: async (_, { module, action, userId, input }, ctx) => {
      const where: Record<string, unknown> = {}
      if (module) where.module = module
      if (action) where.action = action
      if (userId) where.userId = userId
      if (input?.search) {
        where.OR = [
          { summary: { contains: input.search, mode: 'insensitive' } },
          { targetLabel: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      const [logs, count] = await Promise.all([
        ctx.prisma.systemLog.findMany({
          where,
          take: input?.take ?? 30,
          skip: input?.skip ?? 0,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                role: { select: { code: true, name: true } },
              },
            },
          },
        }),
        ctx.prisma.systemLog.count({ where }),
      ])
      return { logs, count }
    },
  }),
)
