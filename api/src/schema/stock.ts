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
      warehouseId: t.arg.id({ required: false }),
      input: t.arg({ type: PaginationInput, required: false }),
    },
    resolve: async (_, { status, materialId, warehouseId, input }, ctx) => {
      const scopeWhere: Record<string, unknown> = {}
      if (materialId) scopeWhere.materialId = materialId
      if (warehouseId) {
        scopeWhere.OR = [
          { shelf: { warehouseId } },
          { shelfId: null, batch: { inboundOrder: { warehouseId } } },
        ]
      }
      if (input?.search) {
        scopeWhere.OR = [
          { qrCode: containsI(input.search) },
          { material: { name: containsI(input.search) } },
        ]
      }

      const where = { ...scopeWhere }
      if (status) where.status = status

      const [items, count, scopeCount, qtyAgg, shelvedCount, statRows] = await Promise.all([
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
        ctx.prisma.stockItem.count({ where: scopeWhere }),
        ctx.prisma.stockItem.aggregate({ where: scopeWhere, _sum: { quantity: true } }),
        ctx.prisma.stockItem.count({ where: { ...scopeWhere, shelfId: { not: null } } }),
        ctx.prisma.stockItem.findMany({
          where: scopeWhere,
          select: {
            materialId: true,
            status: true,
            batch: { select: { expiryDate: true } },
          },
        }),
      ])

      const materialKinds = new Set(statRows.map((row) => row.materialId)).size
      const expiry = { green: 0, yellow: 0, red: 0 }
      const statusCounts = { IN_STOCK: 0, IN_TRANSIT: 0, ISSUED: 0, SCRAPPED: 0 }
      for (const row of statRows) {
        const level = calcExpiryLevel(row.batch.expiryDate)
        if (level === 'RED') expiry.red += 1
        else if (level === 'YELLOW') expiry.yellow += 1
        else expiry.green += 1
        const s = row.status as keyof typeof statusCounts
        if (s in statusCounts) statusCounts[s] += 1
      }

      const enriched = items.map((item) => ({
        ...item,
        expiryLevel: calcExpiryLevel(item.batch.expiryDate),
      }))

      return {
        items: enriched,
        count,
        stats: {
          totalUnits: scopeCount,
          totalQty: qtyAgg._sum.quantity ?? 0,
          shelved: shelvedCount,
          unshelved: scopeCount - shelvedCount,
          materialKinds,
          expiryAlert: expiry.red + expiry.yellow,
          expiry,
          status: statusCounts,
        },
      }
    },
  }),
)

builder.queryField('getInventorySummary', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { warehouseId: t.arg.id({ required: false }) },
    resolve: async (_, { warehouseId }, ctx) => {
      const stockWhere = warehouseId
        ? {
            status: 'IN_STOCK' as const,
            OR: [
              { shelf: { warehouseId } },
              { shelfId: null, batch: { inboundOrder: { warehouseId } } },
            ],
          }
        : { status: 'IN_STOCK' as const }

      const materials = await ctx.prisma.material.findMany({
        include: {
          category: true,
          stockItems: { where: stockWhere, include: { batch: true } },
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
