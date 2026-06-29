import { builder } from '../builder.js'
import { calcExpiryLevel } from '../lib/utils.js'
import { writeSystemLog } from '../lib/system-log.js'
import { enrichPendingTasks, countMyPendingTasks } from '../lib/approval.js'

const ZONE_LABELS: Record<string, string> = {
  A: 'A区·抢险类',
  B: 'B区·救助类',
  C: 'C区·通用类',
  D: 'D区·恒温库',
}

builder.queryField('dashboard', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    resolve: async (_, __, ctx) => {
      const now = new Date()
      const in90 = new Date(now.getTime() + 90 * 86400000)
      const in30 = new Date(now.getTime() + 30 * 86400000)

      const [
        materialCount,
        warehouses,
        stockTotalAgg,
        stockItems,
        pendingInbound,
        pendingOutbound,
        alerts,
        inboundTasks,
        outboundTasks,
        inventorySummary,
        approvalTasksRaw,
        approvalInboxCount,
      ] = await Promise.all([
        ctx.prisma.material.count(),
        ctx.prisma.warehouse.findMany(),
        ctx.prisma.stockItem.aggregate({ where: { status: 'IN_STOCK' }, _sum: { quantity: true } }),
        ctx.prisma.stockItem.findMany({
          where: { status: 'IN_STOCK' },
          include: { material: { include: { category: true } }, batch: true, shelf: { include: { warehouse: true } } },
        }),
        ctx.prisma.inboundOrder.count({ where: { status: { in: ['PENDING', 'RECEIVING'] } } }),
        ctx.prisma.outboundOrder.count({ where: { status: { in: ['PENDING', 'APPROVED', 'PICKING'] } } }),
        ctx.prisma.alert.findMany({
          where: { resolved: false },
          take: 12,
          orderBy: [{ level: 'asc' }, { createdAt: 'desc' }],
          include: { material: true, batch: true },
        }),
        ctx.prisma.inboundOrder.findMany({
          where: { status: { in: ['PENDING', 'RECEIVING', 'DRAFT'] } },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: { supplier: true, createdBy: true },
        }),
        ctx.prisma.outboundOrder.findMany({
          where: { status: { in: ['PENDING', 'APPROVED', 'PICKING', 'DRAFT'] } },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: true },
        }),
        ctx.prisma.material.findMany({
          include: {
            category: true,
            stockItems: { where: { status: 'IN_STOCK' } },
          },
        }),
        ctx.prisma.approvalTask.findMany({
          where: { status: 'PENDING', assigneeRole: ctx.identity!.role },
          include: { instance: { include: { flow: true } } },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        countMyPendingTasks(ctx.prisma, ctx.identity!.role),
      ])

      const stockTotal = stockTotalAgg._sum.quantity ?? 0
      const totalCapacity = warehouses.reduce((s, w) => s + (w.capacity ?? 0), 0)
      const utilizationRate = totalCapacity > 0 ? Math.round((stockTotal / totalCapacity) * 100) : 0

      const expiryStats = { green: 0, yellow: 0, red: 0 }
      const zoneHeatmap: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 }

      for (const item of stockItems) {
        const level = calcExpiryLevel(item.batch.expiryDate)
        if (level === 'GREEN') expiryStats.green += item.quantity
        else if (level === 'YELLOW') expiryStats.yellow += item.quantity
        else expiryStats.red += item.quantity

        const zoneKey = item.shelf?.zone ?? 'C'
        if (zoneKey in zoneHeatmap) zoneHeatmap[zoneKey] += item.quantity
        else zoneHeatmap[zoneKey] = item.quantity
      }

      const expiryTotal = expiryStats.green + expiryStats.yellow + expiryStats.red || 1
      const expiryHealth = {
        ...expiryStats,
        greenPct: Math.round((expiryStats.green / expiryTotal) * 100),
        yellowPct: Math.round((expiryStats.yellow / expiryTotal) * 100),
        redPct: Math.round((expiryStats.red / expiryTotal) * 100),
        healthScore: Math.round((expiryStats.green / expiryTotal) * 100),
      }

      const stockWaterLevel = inventorySummary
        .map((m) => {
          const qty = m.stockItems.reduce((s, i) => s + i.quantity, 0)
          const min = m.category.safetyStockMin
          const max = m.category.safetyStockMax ?? min * 10
          let status: 'LOW' | 'NORMAL' | 'HIGH' = 'NORMAL'
          if (qty === 0) status = 'LOW'
          else if (qty < min) status = 'LOW'
          else if (qty > max) status = 'HIGH'
          const pct = Math.min(100, Math.round((qty / max) * 100))
          return { material: { id: m.id, code: m.code, name: m.name, unit: m.unit }, quantity: qty, min, max, status, pct }
        })
        .filter((x) => x.status !== 'NORMAL' || x.quantity > 0)
        .sort((a, b) => {
          const order = { LOW: 0, HIGH: 1, NORMAL: 2 }
          return order[a.status] - order[b.status]
        })
        .slice(0, 8)

      const expiringSoon = await ctx.prisma.materialBatch.count({ where: { expiryDate: { lte: in90, gte: now } } })
      const expiringCritical = await ctx.prisma.materialBatch.count({ where: { expiryDate: { lte: in30, gte: now } } })

      const pendingTaskCount = pendingInbound + pendingOutbound
      const alertCount = await ctx.prisma.alert.count({ where: { resolved: false } })
      const myApprovals = await enrichPendingTasks(ctx.prisma, approvalTasksRaw)

      const pendingTasks = [
        ...inboundTasks.map((o) => ({
          id: o.id,
          docType: '采购入库',
          orderNo: o.orderNo,
          status: o.status,
          partner: o.supplier?.name ?? '—',
          createdAt: o.createdAt,
          createdBy: o.createdBy?.name,
        })),
        ...outboundTasks.map((o) => ({
          id: o.id,
          docType: '物资出库',
          orderNo: o.orderNo,
          status: o.status,
          partner: o.destination ?? o.recipient ?? '—',
          createdAt: o.createdAt,
          createdBy: o.createdBy?.name,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return {
        center: {
          speciesCount: materialCount,
          stockTotal,
          utilizationRate,
          pendingTaskCount,
          alertCount,
          approvalInboxCount,
          warehouseArea: warehouses.reduce((s, w) => s + (w.area ?? 0), 0),
          totalCapacity,
        },
        overview: {
          materialCount,
          categoryCount: await ctx.prisma.materialCategory.count(),
          stockTotal,
          stockItemCount: stockItems.length,
          pendingInbound,
          pendingOutbound,
          expiringSoon,
          expiringCritical,
        },
        expiryHealth,
        stockWaterLevel,
        zoneHeatmap: Object.entries(zoneHeatmap).map(([zone, quantity]) => ({
          zone,
          label: ZONE_LABELS[zone] ?? zone,
          quantity,
          capacity: warehouses.find((w) => w.code === `WH-${zone}`)?.capacity ?? 0,
        })),
        pendingTasks,
        myApprovals,
        recentAlerts: alerts,
        exportSnapshot: {
          generatedAt: now.toISOString(),
          center: { speciesCount: materialCount, stockTotal, utilizationRate, pendingTaskCount },
          zones: zoneHeatmap,
          expiry: expiryHealth,
        },
      }
    },
  }),
)

builder.queryField('getAlerts', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      resolved: t.arg.boolean({ required: false }),
      take: t.arg.int({ required: false }),
    },
    resolve: async (_, { resolved, take }, ctx) => {
      const where = resolved !== undefined && resolved !== null ? { resolved } : {}
      const [alerts, count] = await Promise.all([
        ctx.prisma.alert.findMany({
          where,
          take: take ?? 50,
          orderBy: [{ resolved: 'asc' }, { createdAt: 'desc' }],
          include: { material: true, batch: true },
        }),
        ctx.prisma.alert.count({ where }),
      ])
      return { alerts, count }
    },
  }),
)

builder.mutationField('resolveAlert', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_, { id }, ctx) => {
      const alert = await ctx.prisma.alert.findUniqueOrThrow({ where: { id } })
      const result = await ctx.prisma.alert.update({
        where: { id },
        data: { resolved: true, resolvedAt: new Date(), resolvedById: ctx.identity!.userId },
      })
      await writeSystemLog(ctx, {
        action: 'RESOLVE',
        module: 'ALERT',
        summary: `处理预警：${alert.message}`,
        targetId: alert.id,
      })
      return result
    },
  }),
)

builder.mutationField('syncAlerts', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    resolve: async (_, __, ctx) => {
      const now = new Date()
      const in90 = new Date(now.getTime() + 90 * 86400000)
      const batches = await ctx.prisma.materialBatch.findMany({
        where: { expiryDate: { lte: in90 } },
        include: { material: true },
      })
      let created = 0
      for (const batch of batches) {
        const level = calcExpiryLevel(batch.expiryDate)
        if (level === 'GREEN') continue
        const existing = await ctx.prisma.alert.findFirst({
          where: { batchId: batch.id, type: 'EXPIRY', resolved: false },
        })
        if (existing) continue
        await ctx.prisma.alert.create({
          data: {
            type: 'EXPIRY',
            level: level as 'YELLOW' | 'RED',
            materialId: batch.materialId,
            batchId: batch.id,
            message: `${batch.material.name} 批次 ${batch.batchNo} ${level === 'RED' ? '即将过期' : '临期预警'}`,
          },
        })
        created++
      }
      await writeSystemLog(ctx, {
        action: 'SYNC',
        module: 'ALERT',
        summary: `同步效期预警，新增 ${created} 条`,
        detail: { created },
      })
      return { created }
    },
  }),
)
