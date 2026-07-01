import { builder } from '../builder.js'
import { fetchWorkbenchSummary } from '../lib/workbench.js'

builder.queryField('getWorkbench', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      take: t.arg.int({ required: false }),
    },
    resolve: async (_, { take }, ctx) =>
      fetchWorkbenchSummary(ctx.prisma, {
        userId: ctx.identity!.userId,
        role: ctx.identity!.role,
      }, { take: take ?? 50 }),
  }),
)
