import { builder } from '../builder.js'
import { containsI, calcExpiryLevel } from '../lib/utils.js'
import { PaginationInput } from './input-types.js'

builder.queryField('getStockItems', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      status: t.arg.string({ required: false }),
      materialId: t.arg.id({ required: false }),
      input: t.arg({ type: PaginationInput, required: false }),
    },
    resolve: async (_, { status, materialId, input }, ctx) => {
      const where: Record<string, unknown> = {}
      if (status) where.status = status
      if (materialId) where.materialId = materialId
      if (input?.search) {
        where.OR = [
          { qrCode: containsI(input.search) },
          { material: { name: containsI(input.search) } },
        ]
      }

      const [items, count] = await Promise.all([
        ctx.prisma.stockItem.findMany({
          where,
          take: input?.take ?? 50,
          skip: input?.skip ?? 0,
          include: {
            material: { include: { category: true } },
            batch: true,
            shelf: { include: { warehouse: true } },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        ctx.prisma.stockItem.count({ where }),
      ])

      const enriched = items.map((item) => ({
        ...item,
        expiryLevel: calcExpiryLevel(item.batch.expiryDate),
      }))

      return { items: enriched, count }
    },
  }),
)

builder.queryField('getInventorySummary', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    resolve: async (_, __, ctx) => {
      const materials = await ctx.prisma.material.findMany({
        include: {
          category: true,
          stockItems: { where: { status: 'IN_STOCK' }, include: { batch: true } },
        },
      })

      return materials.map((m) => {
        const qty = m.stockItems.reduce((s, i) => s + i.quantity, 0)
        const minLevel = m.category.safetyStockMin
        const stockStatus =
          qty === 0 ? 'EMPTY' : qty < minLevel ? 'LOW' : qty > (m.category.safetyStockMax ?? Infinity) ? 'HIGH' : 'NORMAL'
        const expiryLevels = m.stockItems.map((i) => calcExpiryLevel(i.batch.expiryDate))
        const worstExpiry = expiryLevels.includes('RED')
          ? 'RED'
          : expiryLevels.includes('YELLOW')
            ? 'YELLOW'
            : 'GREEN'

        return {
          material: m,
          quantity: qty,
          stockStatus,
          expiryLevel: worstExpiry,
          batchCount: new Set(m.stockItems.map((i) => i.batchId)).size,
        }
      })
    },
  }),
)

builder.queryField('getMovements', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      stockItemId: t.arg.id({ required: false }),
      type: t.arg.string({ required: false }),
      input: t.arg({ type: PaginationInput, required: false }),
    },
    resolve: async (_, { stockItemId, type, input }, ctx) => {
      const where: Record<string, unknown> = {}
      if (stockItemId) where.stockItemId = stockItemId
      if (type) where.type = type
      if (input?.search) {
        where.OR = [
          { note: containsI(input.search) },
          { stockItem: { qrCode: containsI(input.search) } },
          { stockItem: { material: { name: containsI(input.search) } } },
          { stockItem: { material: { code: containsI(input.search) } } },
          { operator: { name: containsI(input.search) } },
        ]
      }
      const [movements, count] = await Promise.all([
        ctx.prisma.stockMovement.findMany({
          where,
          take: input?.take ?? 50,
          skip: input?.skip ?? 0,
          include: {
            stockItem: {
              include: {
                material: true,
                batch: true,
                shelf: { include: { warehouse: true } },
              },
            },
            operator: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.stockMovement.count({ where }),
      ])
      return { movements, count }
    },
  }),
)
