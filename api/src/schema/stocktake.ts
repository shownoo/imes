import type { Prisma } from '@prisma/client'
import { builder } from '../builder.js'
import { genOrderNo, containsI, calcExpiryLevel } from '../lib/utils.js'
import { writeSystemLog } from '../lib/system-log.js'
import { PaginationInput } from './input-types.js'

const stocktakeInclude = {
  warehouse: true,
  shelf: { include: { warehouse: true } },
  createdBy: true,
  completedBy: true,
  lines: {
    include: {
      stockItem: {
        include: {
          material: true,
          batch: true,
          shelf: { include: { warehouse: true } },
        },
      },
      countedBy: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.StocktakeTaskInclude

function buildStocktakeScopeWhere(args: {
  warehouseId?: string | null
  shelfId?: string | null
  zone?: string | null
}): Prisma.StockItemWhereInput {
  const where: Prisma.StockItemWhereInput = { status: 'IN_STOCK' }
  if (args.shelfId) {
    where.shelfId = args.shelfId
    return where
  }
  if (args.warehouseId) {
    const shelfFilter: Prisma.ShelfWhereInput = { warehouseId: args.warehouseId }
    if (args.zone) shelfFilter.zone = args.zone
    where.shelf = shelfFilter
    return where
  }
  if (args.zone) {
    where.shelf = { zone: args.zone }
  }
  return where
}

function stocktakeTitle(args: {
  warehouse?: { name: string } | null
  shelf?: { code: string; name: string } | null
  zone?: string | null
}): string {
  if (args.shelf) return `货位 ${args.shelf.code} 盘点`
  if (args.warehouse && args.zone) return `${args.warehouse.name} · ${args.zone}区盘点`
  if (args.warehouse) return `${args.warehouse.name} 全盘`
  if (args.zone) return `${args.zone}区盘点`
  return '全场盘点'
}

builder.queryField('getStocktakeTasks', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      status: t.arg.string({ required: false }),
      input: t.arg({ type: PaginationInput, required: false }),
    },
    resolve: async (_, { status, input }, ctx) => {
      const where: Prisma.StocktakeTaskWhereInput = {}
      if (status) where.status = status as Prisma.EnumStocktakeStatusFilter['equals']
      if (input?.search) {
        where.OR = [
          { taskNo: containsI(input.search) },
          { title: containsI(input.search) },
        ]
      }
      const [tasks, count] = await Promise.all([
        ctx.prisma.stocktakeTask.findMany({
          where,
          take: input?.take ?? 50,
          skip: input?.skip ?? 0,
          include: {
            warehouse: true,
            shelf: { include: { warehouse: true } },
            createdBy: true,
            _count: { select: { lines: true } },
            lines: { select: { actualQty: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.stocktakeTask.count({ where }),
      ])
      const enriched = tasks.map(({ lines, _count, ...task }) => {
        const counted = lines.filter((l) => l.actualQty != null).length
        return { ...task, lineCount: _count.lines, countedCount: counted }
      })
      return { tasks: enriched, count }
    },
  }),
)

builder.queryField('getStocktakeTask', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_, { id }, ctx) => {
      const task = await ctx.prisma.stocktakeTask.findUnique({
        where: { id },
        include: stocktakeInclude,
      })
      if (!task) return null
      const counted = task.lines.filter((l) => l.actualQty != null).length
      const variance = task.lines.filter((l) => l.actualQty != null && l.actualQty !== l.bookQty).length
      return { ...task, countedCount: counted, varianceCount: variance }
    },
  }),
)

builder.mutationField('createStocktakeTask', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      warehouseId: t.arg.id({ required: false }),
      shelfId: t.arg.id({ required: false }),
      zone: t.arg.string({ required: false }),
      title: t.arg.string({ required: false }),
    },
    resolve: async (_, { warehouseId, shelfId, zone, title }, ctx) => {
      const warehouse = warehouseId
        ? await ctx.prisma.warehouse.findUnique({ where: { id: warehouseId } })
        : null
      const shelf = shelfId
        ? await ctx.prisma.shelf.findUnique({ where: { id: shelfId }, include: { warehouse: true } })
        : null

      const stockWhere = buildStocktakeScopeWhere({
        warehouseId: shelf?.warehouseId ?? warehouseId,
        shelfId,
        zone,
      })
      const items = await ctx.prisma.stockItem.findMany({
        where: stockWhere,
        select: { id: true, quantity: true },
      })

      const autoTitle =
        title?.trim() ||
        stocktakeTitle({ warehouse: shelf?.warehouse ?? warehouse, shelf, zone: zone ?? undefined })

      const task = await ctx.prisma.stocktakeTask.create({
        data: {
          taskNo: genOrderNo('PD'),
          title: autoTitle,
          warehouseId: shelf?.warehouseId ?? warehouseId ?? undefined,
          shelfId: shelfId ?? undefined,
          zone: zone ?? undefined,
          createdById: ctx.identity!.userId,
          lines: {
            create: items.map((item) => ({
              stockItemId: item.id,
              bookQty: item.quantity,
            })),
          },
        },
        include: stocktakeInclude,
      })

      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'STOCK',
        summary: `创建盘点任务 ${task.taskNo}`,
        targetId: task.id,
        targetLabel: task.taskNo,
        after: { title: task.title, lineCount: items.length },
      })

      return { ...task, countedCount: 0, varianceCount: 0 }
    },
  }),
)

builder.mutationField('countStocktakeLine', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      taskId: t.arg.id({ required: true }),
      qrCode: t.arg.string({ required: true }),
      actualQty: t.arg.int({ required: true }),
    },
    resolve: async (_, { taskId, qrCode, actualQty }, ctx) => {
      if (actualQty < 0) throw new Error('实盘数量不能为负数')

      const task = await ctx.prisma.stocktakeTask.findUniqueOrThrow({ where: { id: taskId } })
      if (task.status !== 'IN_PROGRESS') throw new Error('盘点任务已完成，无法继续清点')

      const stockItem = await ctx.prisma.stockItem.findUnique({
        where: { qrCode: qrCode.trim() },
      })
      if (!stockItem) throw new Error('未找到该二维码对应的库存单元')

      let line = await ctx.prisma.stocktakeLine.findUnique({
        where: { taskId_stockItemId: { taskId, stockItemId: stockItem.id } },
        include: { stockItem: { include: { material: true, batch: true, shelf: true } } },
      })

      if (!line) {
        line = await ctx.prisma.stocktakeLine.create({
          data: {
            taskId,
            stockItemId: stockItem.id,
            bookQty: stockItem.quantity,
            actualQty,
            countedAt: new Date(),
            countedById: ctx.identity!.userId,
          },
          include: { stockItem: { include: { material: true, batch: true, shelf: true } } },
        })
      } else {
        line = await ctx.prisma.stocktakeLine.update({
          where: { id: line.id },
          data: {
            actualQty,
            countedAt: new Date(),
            countedById: ctx.identity!.userId,
          },
          include: { stockItem: { include: { material: true, batch: true, shelf: true } } },
        })
      }

      return line
    },
  }),
)

builder.mutationField('completeStocktakeTask', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_, { id }, ctx) => {
      const task = await ctx.prisma.stocktakeTask.findUniqueOrThrow({
        where: { id },
        include: {
          lines: { include: { stockItem: true } },
        },
      })
      if (task.status === 'COMPLETED') throw new Error('盘点任务已完成')
      if (task.lines.length === 0) throw new Error('盘点任务无明细，无法完成')

      const uncounted = task.lines.filter((l) => l.actualQty == null).length
      if (uncounted > 0) {
        throw new Error(`还有 ${uncounted} 项未清点，请完成扫码后再提交`)
      }

      const operatorId = ctx.identity!.userId
      let adjustCount = 0

      await ctx.prisma.$transaction(async (tx) => {
        for (const line of task.lines) {
          const actual = line.actualQty!
          const diff = actual - line.bookQty
          if (diff === 0) continue

          const beforeQty = line.stockItem.quantity
          await tx.stockItem.update({
            where: { id: line.stockItemId },
            data: { quantity: actual },
          })
          await tx.stockMovement.create({
            data: {
              type: 'ADJUST',
              stockItemId: line.stockItemId,
              quantity: Math.abs(diff),
              beforeQty,
              afterQty: actual,
              operatorId,
              refType: 'STOCKTAKE',
              refId: task.id,
              note: `盘点调整 ${task.taskNo}：账面 ${line.bookQty} → 实盘 ${actual}`,
            },
          })
          adjustCount += 1
        }

        await tx.stocktakeTask.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            completedById: operatorId,
          },
        })
      })

      const result = await ctx.prisma.stocktakeTask.findUniqueOrThrow({
        where: { id },
        include: stocktakeInclude,
      })

      await writeSystemLog(ctx, {
        action: 'COMPLETE',
        module: 'STOCK',
        summary: `完成盘点 ${task.taskNo}，调整 ${adjustCount} 项`,
        targetId: task.id,
        targetLabel: task.taskNo,
      })

      const counted = result.lines.filter((l) => l.actualQty != null).length
      const variance = result.lines.filter((l) => l.actualQty != null && l.actualQty !== l.bookQty).length
      return { ...result, countedCount: counted, varianceCount: variance, adjustCount }
    },
  }),
)

builder.mutationField('transferStockItem', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      qrCode: t.arg.string({ required: true }),
      toShelfCode: t.arg.string({ required: true }),
    },
    resolve: async (_, { qrCode, toShelfCode }, ctx) => {
      const item = await ctx.prisma.stockItem.findUnique({
        where: { qrCode: qrCode.trim() },
        include: { shelf: true, material: true },
      })
      if (!item) throw new Error('未找到该二维码对应的库存单元')
      if (item.status !== 'IN_STOCK') throw new Error('仅可移库在库物资')

      const toShelf = await ctx.prisma.shelf.findFirst({
        where: {
          OR: [
            { code: toShelfCode.trim() },
            { qrCode: toShelfCode.trim() },
          ],
        },
        include: { warehouse: true },
      })
      if (!toShelf) throw new Error('目标货位不存在')

      const fromShelfId = item.shelfId
      if (fromShelfId === toShelf.id) throw new Error('物资已在目标货位')

      const updated = await ctx.prisma.$transaction(async (tx) => {
        const result = await tx.stockItem.update({
          where: { id: item.id },
          data: { shelfId: toShelf.id },
          include: {
            material: true,
            batch: true,
            shelf: { include: { warehouse: true } },
          },
        })
        await tx.stockMovement.create({
          data: {
            type: 'TRANSFER',
            stockItemId: item.id,
            quantity: item.quantity,
            fromShelfId: fromShelfId ?? undefined,
            toShelfId: toShelf.id,
            operatorId: ctx.identity!.userId,
            note: `移库至 ${toShelf.code}`,
          },
        })
        return result
      })

      await writeSystemLog(ctx, {
        action: 'UPDATE',
        module: 'STOCK',
        summary: `移库 ${item.qrCode} → ${toShelf.code}`,
        targetId: item.id,
        targetLabel: item.qrCode,
      })

      return updated
    },
  }),
)

builder.queryField('getExpiringStockItems', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      warehouseId: t.arg.id({ required: false }),
      level: t.arg.string({ required: false }),
      take: t.arg.int({ required: false }),
    },
    resolve: async (_, { warehouseId, level, take }, ctx) => {
      const where: Prisma.StockItemWhereInput = { status: 'IN_STOCK' }
      if (warehouseId) {
        where.shelf = { warehouseId }
      }

      const items = await ctx.prisma.stockItem.findMany({
        where,
        take: 500,
        include: {
          material: true,
          batch: true,
          shelf: { include: { warehouse: true } },
        },
        orderBy: { batch: { expiryDate: 'asc' } },
      })

      const wantLevel = level === 'RED' || level === 'YELLOW' ? level : null
      const filtered = items
        .map((item) => ({
          ...item,
          expiryLevel: calcExpiryLevel(item.batch.expiryDate),
        }))
        .filter((item) => {
          if (item.expiryLevel === 'GREEN') return false
          if (wantLevel) return item.expiryLevel === wantLevel
          return true
        })
        .slice(0, take ?? 50)

      return {
        items: filtered,
        count: filtered.length,
        redCount: filtered.filter((i) => i.expiryLevel === 'RED').length,
        yellowCount: filtered.filter((i) => i.expiryLevel === 'YELLOW').length,
      }
    },
  }),
)

builder.mutationField('acknowledgeAlert', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_, { id }, ctx) => {
      const alert = await ctx.prisma.alert.findUniqueOrThrow({ where: { id } })
      if (alert.resolved) return alert

      const result = await ctx.prisma.alert.update({
        where: { id },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedById: ctx.identity!.userId,
        },
        include: { material: true, batch: true },
      })

      await writeSystemLog(ctx, {
        action: 'RESOLVE',
        module: 'ALERT',
        summary: `现场处理预警：${alert.message}`,
        targetId: alert.id,
      })

      return result
    },
  }),
)
