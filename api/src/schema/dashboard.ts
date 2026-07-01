import { builder } from '../builder.js'
import { calcExpiryLevel } from '../lib/utils.js'
import { writeSystemLog } from '../lib/system-log.js'
import {
  countActiveDocuments,
  fetchActiveDocuments,
  fetchMyPendingApprovals,
} from '../lib/workbench.js'
import { countMyPendingTasks } from '../lib/approval.js'
import { readOrgCity } from '../lib/org-config.js'
import { STORAGE_ZONE_LABELS, storageZoneCapacity } from '../lib/warehouse-layout.js'

const ZONE_LABELS = STORAGE_ZONE_LABELS

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
        inventorySummary,
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
        ctx.prisma.material.findMany({
          include: {
            category: true,
            stockItems: { where: { status: 'IN_STOCK' } },
          },
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

      const pendingTaskCount = await countActiveDocuments(ctx.prisma)
      const alertCount = await ctx.prisma.alert.count({ where: { resolved: false } })
      const myApprovals = await fetchMyPendingApprovals(ctx.prisma, ctx.identity!.role, 8)
      const pendingTasks = await fetchActiveDocuments(ctx.prisma, 8)

      const [inboundByStatus, outboundByStatus, alertByType, recentMovements, orgCity, cityDestinations] = await Promise.all([
        ctx.prisma.inboundOrder.groupBy({ by: ['status'], _count: { _all: true } }),
        ctx.prisma.outboundOrder.groupBy({ by: ['status'], _count: { _all: true } }),
        ctx.prisma.alert.groupBy({ by: ['type'], where: { resolved: false }, _count: { _all: true } }),
        ctx.prisma.stockMovement.findMany({
          where: {
            createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
            type: { in: ['INBOUND', 'OUTBOUND'] },
          },
          select: { type: true, quantity: true, createdAt: true },
        }),
        readOrgCity(ctx.prisma),
        ctx.prisma.outboundDestination.findMany({
          where: { enabled: true },
          select: { name: true, district: true, city: true },
          orderBy: [{ sortOrder: 'asc' }, { district: 'asc' }],
        }),
      ])

      const orgDestinations = cityDestinations.filter((d) => d.city === orgCity)
      const destNames = orgDestinations.map((d) => d.name)

      const outboundOrdersWithLines = await ctx.prisma.outboundOrder.findMany({
        where: {
          destination: destNames.length ? { in: destNames } : { not: null },
          status: { notIn: ['DRAFT', 'REJECTED'] },
        },
        select: {
          destination: true,
          status: true,
          lines: { select: { requestedQty: true, pickedQty: true } },
        },
      })

      const destinationStats = new Map<string, { orderCount: number; quantity: number }>()
      for (const order of outboundOrdersWithLines) {
        if (!order.destination) continue
        const bucket = destinationStats.get(order.destination) ?? { orderCount: 0, quantity: 0 }
        bucket.orderCount += 1
        const usePicked = order.status === 'COMPLETED' || order.status === 'SHIPPED'
        for (const line of order.lines) {
          bucket.quantity += usePicked && line.pickedQty > 0 ? line.pickedQty : line.requestedQty
        }
        destinationStats.set(order.destination, bucket)
      }

      const INBOUND_STATUS_LABELS: Record<string, string> = {
        DRAFT: '草稿',
        PENDING: '待审核',
        RECEIVING: '收货中',
        COMPLETED: '已完成',
        CANCELLED: '已取消',
      }
      const OUTBOUND_STATUS_LABELS: Record<string, string> = {
        DRAFT: '草稿',
        PENDING: '待审核',
        APPROVED: '已审核',
        PICKING: '拣货中',
        SHIPPED: '已发运',
        COMPLETED: '已完成',
        REJECTED: '已驳回',
      }
      const ALERT_TYPE_LABELS: Record<string, string> = {
        EXPIRY: '效期',
        LOW_STOCK: '低库存',
        HIGH_STOCK: '高库存',
      }

      const categorySpecies = new Map<string, number>()
      for (const m of inventorySummary) {
        const qty = m.stockItems.reduce((s, i) => s + i.quantity, 0)
        if (qty <= 0) continue
        const name = m.category.name
        categorySpecies.set(name, (categorySpecies.get(name) ?? 0) + 1)
      }

      const trendBuckets = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return { month, label: `${d.getMonth() + 1}月`, inbound: 0, outbound: 0 }
      })
      const trendIndex = new Map(trendBuckets.map((b, i) => [b.month, i]))
      for (const mv of recentMovements) {
        const key = `${mv.createdAt.getFullYear()}-${String(mv.createdAt.getMonth() + 1).padStart(2, '0')}`
        const idx = trendIndex.get(key)
        if (idx === undefined) continue
        const qty = Math.abs(mv.quantity)
        if (mv.type === 'INBOUND') trendBuckets[idx]!.inbound += qty
        else trendBuckets[idx]!.outbound += qty
      }

      const charts = {
        expiryPie: [
          { key: 'green', label: '安全', value: expiryStats.green, color: '#10b981' },
          { key: 'yellow', label: '临期', value: expiryStats.yellow, color: '#fbbf24' },
          { key: 'red', label: '预警', value: expiryStats.red, color: '#ef4444' },
        ],
        zoneBar: Object.entries(zoneHeatmap).map(([zone, quantity]) => ({
          key: zone,
          label: ZONE_LABELS[zone] ?? zone,
          value: quantity,
        })),
        categoryBar: [...categorySpecies.entries()]
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6),
        inboundBar: inboundByStatus
          .filter((x) => x._count._all > 0)
          .map((x) => ({
            key: x.status,
            label: INBOUND_STATUS_LABELS[x.status] ?? x.status,
            value: x._count._all,
          })),
        outboundBar: outboundByStatus
          .filter((x) => x._count._all > 0)
          .map((x) => ({
            key: x.status,
            label: OUTBOUND_STATUS_LABELS[x.status] ?? x.status,
            value: x._count._all,
          })),
        alertPie: alertByType
          .filter((x) => x._count._all > 0)
          .map((x) => ({
            key: x.type,
            label: ALERT_TYPE_LABELS[x.type] ?? x.type,
            value: x._count._all,
            color: x.type === 'EXPIRY' ? '#f59e0b' : x.type === 'LOW_STOCK' ? '#ef4444' : '#8b5cf6',
          })),
        destinationBar: orgDestinations
          .map((dest) => {
            const stat = destinationStats.get(dest.name)
            return {
              key: dest.name,
              label: dest.district,
              value: stat?.quantity ?? 0,
              orderCount: stat?.orderCount ?? 0,
            }
          })
          .filter((x) => x.value > 0 || x.orderCount > 0)
          .sort((a, b) => b.value - a.value),
        destinationCity: orgCity,
        ioTrend: trendBuckets,
      }

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
        charts,
        zoneHeatmap: Object.entries(zoneHeatmap).map(([zone, quantity]) => ({
          zone,
          label: ZONE_LABELS[zone] ?? zone,
          quantity,
          capacity: storageZoneCapacity(zone),
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
