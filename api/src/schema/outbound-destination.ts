import { builder } from '../builder.js'
import { cached } from '../lib/cache.js'
import {
  invalidateOutboundDestCache,
  outboundDestListKey,
} from '../lib/master-cache.js'
import { containsI } from '../lib/utils.js'
import { readOrgCity, defaultDestinationName } from '../lib/org-config.js'
import { writeSystemLog } from '../lib/system-log.js'
import { IdInput, PaginationInput } from './input-types.js'

const AddOutboundDestinationInput = builder.inputType('AddOutboundDestinationInput', {
  fields: (t) => ({
    id: t.id({ required: false }),
    code: t.string({ required: true }),
    city: t.string({ required: false }),
    district: t.string({ required: true }),
    name: t.string({ required: false }),
    contact: t.string({ required: false }),
    phone: t.string({ required: false }),
    sortOrder: t.int({ required: false }),
    enabled: t.boolean({ required: false }),
  }),
})

builder.queryField('getOutboundDestinations', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      enabledOnly: t.arg.boolean({ required: false }),
      city: t.arg.string({ required: false }),
      useOrgCity: t.arg.boolean({ required: false }),
      input: t.arg({ type: PaginationInput, required: false }),
    },
    resolve: async (_, { enabledOnly, city, useOrgCity, input }, ctx) => {
      const { search, take, skip } = input ?? {}
      const filterCity = city ?? (useOrgCity ? await readOrgCity(ctx.prisma) : undefined)
      const queryInput = {
        enabledOnly: enabledOnly ?? null,
        city: filterCity ?? null,
        search: search ?? null,
        take: take ?? 100,
        skip: skip ?? 0,
      }
      return cached(outboundDestListKey(queryInput), async () => {
        const where: Record<string, unknown> = {}
        if (enabledOnly) where.enabled = true
        if (filterCity) where.city = filterCity
        if (search) {
          where.OR = [
            { name: containsI(search) },
            { code: containsI(search) },
            { city: containsI(search) },
            { district: containsI(search) },
            { contact: containsI(search) },
            { phone: containsI(search) },
          ]
        }
        const [destinations, count] = await Promise.all([
          ctx.prisma.outboundDestination.findMany({
            where,
            take: queryInput.take,
            skip: queryInput.skip,
            orderBy: [{ sortOrder: 'asc' }, { district: 'asc' }, { code: 'asc' }],
          }),
          ctx.prisma.outboundDestination.count({ where }),
        ])
        return { destinations, count }
      })
    },
  }),
)

builder.mutationField('addOutboundDestination', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { input: t.arg({ type: AddOutboundDestinationInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { id, city, district, name, ...rest } = input
      const resolvedCity = (city?.trim() || await readOrgCity(ctx.prisma))
      const resolvedDistrict = district.trim()
      if (!resolvedDistrict) throw new Error('请填写所属区')
      const resolvedName = name?.trim() || defaultDestinationName(resolvedDistrict)
      const data = {
        ...rest,
        city: resolvedCity,
        district: resolvedDistrict,
        name: resolvedName,
      }
      if (id) {
        const existing = await ctx.prisma.outboundDestination.findUniqueOrThrow({ where: { id } })
        const result = await ctx.prisma.outboundDestination.update({ where: { id }, data: data as never })
        await writeSystemLog(ctx, {
          action: 'UPDATE',
          module: 'OUTBOUND_DESTINATION',
          summary: `更新出库目的地「${result.name}」`,
          targetId: result.id,
          targetLabel: result.code,
          before: existing as unknown as Record<string, unknown>,
          after: result as unknown as Record<string, unknown>,
        })
        await invalidateOutboundDestCache()
        return result
      }
      const result = await ctx.prisma.outboundDestination.create({ data: data as never })
      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'OUTBOUND_DESTINATION',
        summary: `新增出库目的地「${result.name}」`,
        targetId: result.id,
        targetLabel: result.code,
        after: result as unknown as Record<string, unknown>,
      })
      await invalidateOutboundDestCache()
      return result
    },
  }),
)

builder.mutationField('delOutboundDestination', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const destination = await ctx.prisma.outboundDestination.findUniqueOrThrow({ where: { id: input.id } })
      const inUse = await ctx.prisma.outboundOrder.count({ where: { destination: destination.name } })
      if (inUse > 0) throw new Error('该目的地已被出库单引用，无法删除')
      const result = await ctx.prisma.outboundDestination.delete({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'DELETE',
        module: 'OUTBOUND_DESTINATION',
        summary: `删除出库目的地「${destination.name}」`,
        targetId: destination.id,
        targetLabel: destination.code,
        before: destination as unknown as Record<string, unknown>,
      })
      await invalidateOutboundDestCache()
      return result
    },
  }),
)
