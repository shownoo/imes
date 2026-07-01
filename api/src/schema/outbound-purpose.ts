import { builder } from '../builder.js'
import { cached } from '../lib/cache.js'
import {
  invalidateOutboundPurposeCache,
  outboundPurposeListKey,
} from '../lib/master-cache.js'
import { containsI } from '../lib/utils.js'
import { writeSystemLog } from '../lib/system-log.js'
import { IdInput, PaginationInput } from './input-types.js'

const AddOutboundPurposeInput = builder.inputType('AddOutboundPurposeInput', {
  fields: (t) => ({
    id: t.id({ required: false }),
    code: t.string({ required: true }),
    name: t.string({ required: true }),
    sortOrder: t.int({ required: false }),
    enabled: t.boolean({ required: false }),
  }),
})

builder.queryField('getOutboundPurposes', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      enabledOnly: t.arg.boolean({ required: false }),
      input: t.arg({ type: PaginationInput, required: false }),
    },
    resolve: async (_, { enabledOnly, input }, ctx) => {
      const { search, take, skip } = input ?? {}
      const queryInput = {
        enabledOnly: enabledOnly ?? null,
        search: search ?? null,
        take: take ?? 100,
        skip: skip ?? 0,
      }
      return cached(outboundPurposeListKey(queryInput), async () => {
        const where: Record<string, unknown> = {}
        if (enabledOnly) where.enabled = true
        if (search) {
          where.OR = [{ name: containsI(search) }, { code: containsI(search) }]
        }
        const [purposes, count] = await Promise.all([
          ctx.prisma.outboundPurpose.findMany({
            where,
            take: queryInput.take,
            skip: queryInput.skip,
            orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
          }),
          ctx.prisma.outboundPurpose.count({ where }),
        ])
        return { purposes, count }
      })
    },
  }),
)

builder.mutationField('addOutboundPurpose', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { input: t.arg({ type: AddOutboundPurposeInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { id, ...data } = input
      if (id) {
        const existing = await ctx.prisma.outboundPurpose.findUniqueOrThrow({ where: { id } })
        const result = await ctx.prisma.outboundPurpose.update({ where: { id }, data: data as never })
        await writeSystemLog(ctx, {
          action: 'UPDATE',
          module: 'OUTBOUND_PURPOSE',
          summary: `更新出库用途「${result.name}」`,
          targetId: result.id,
          targetLabel: result.code,
          before: existing as unknown as Record<string, unknown>,
          after: result as unknown as Record<string, unknown>,
        })
        await invalidateOutboundPurposeCache()
        return result
      }
      const result = await ctx.prisma.outboundPurpose.create({ data: data as never })
      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'OUTBOUND_PURPOSE',
        summary: `新增出库用途「${result.name}」`,
        targetId: result.id,
        targetLabel: result.code,
        after: result as unknown as Record<string, unknown>,
      })
      await invalidateOutboundPurposeCache()
      return result
    },
  }),
)

builder.mutationField('delOutboundPurpose', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const purpose = await ctx.prisma.outboundPurpose.findUniqueOrThrow({ where: { id: input.id } })
      const inUse = await ctx.prisma.outboundOrder.count({ where: { purpose: purpose.name } })
      if (inUse > 0) throw new Error('该用途已被出库单引用，无法删除')
      const result = await ctx.prisma.outboundPurpose.delete({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'DELETE',
        module: 'OUTBOUND_PURPOSE',
        summary: `删除出库用途「${purpose.name}」`,
        targetId: purpose.id,
        targetLabel: purpose.code,
        before: purpose as unknown as Record<string, unknown>,
      })
      await invalidateOutboundPurposeCache()
      return result
    },
  }),
)
