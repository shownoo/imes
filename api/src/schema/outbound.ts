import { builder } from '../builder.js'
import { getOutboundOrderForPrint } from '../lib/print-data.js'
import { genOrderNo, genQrCode, calcExpiryLevel } from '../lib/utils.js'
import { formatStatus } from '../lib/log-diff.js'
import { writeSystemLog } from '../lib/system-log.js'
import { startApprovalInstance, findPendingTaskForBiz, completeApprovalTask } from '../lib/approval.js'
import { IdInput, PaginationInput } from './input-types.js'

function snapOutboundOrder(order: {
  purpose?: string | null
  destination?: string | null
  recipient?: string | null
  rejectReason?: string | null
  status?: string
  lines?: Array<{ material?: { name: string }; requestedQty: number }>
}) {
  return {
    purpose: order.purpose,
    destination: order.destination,
    recipient: order.recipient,
    rejectReason: order.rejectReason,
    status: order.status ? formatStatus(order.status) : undefined,
    lineCount: order.lines?.length ?? 0,
    lines: order.lines?.map((l) => `${l.material?.name ?? '?'}×${l.requestedQty}`).join('；') || '—',
  }
}

const OutboundLineInput = builder.inputType('OutboundLineInput', {
  fields: (t) => ({
    materialId: t.id({ required: true }),
    requestedQty: t.int({ required: true }),
  }),
})

const CreateOutboundInput = builder.inputType('CreateOutboundInput', {
  fields: (t) => ({
    purpose: t.string({ required: false }),
    destination: t.string({ required: false }),
    recipient: t.string({ required: false }),
    lines: t.field({ type: [OutboundLineInput], required: true }),
  }),
})

const UpdateOutboundInput = builder.inputType('UpdateOutboundInput', {
  fields: (t) => ({
    id: t.id({ required: true }),
    purpose: t.string({ required: false }),
    destination: t.string({ required: false }),
    recipient: t.string({ required: false }),
    lines: t.field({ type: [OutboundLineInput], required: false }),
  }),
})

const PickStockInput = builder.inputType('PickStockInput', {
  fields: (t) => ({
    lineId: t.id({ required: true }),
    stockQrCode: t.string({ required: true }),
    pickedQty: t.int({ required: true }),
  }),
})

builder.queryField('getOutboundOrders', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      status: t.arg.string({ required: false }),
      input: t.arg({ type: PaginationInput, required: false }),
    },
    resolve: async (_, { status, input }, ctx) => {
      const where = status ? { status: status as never } : {}
      const [orders, count] = await Promise.all([
        ctx.prisma.outboundOrder.findMany({
          where,
          take: input?.take ?? 20,
          skip: input?.skip ?? 0,
          include: {
            createdBy: true,
            approvedBy: true,
            lines: { include: { material: true, stockItem: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.outboundOrder.count({ where }),
      ])
      return { orders, count }
    },
  }),
)

builder.queryField('getOutboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) =>
      ctx.prisma.outboundOrder.findUnique({
        where: { id: input.id },
        include: {
          createdBy: true,
          approvedBy: true,
          lines: { include: { material: true, stockItem: true } },
        },
      }),
  }),
)

builder.queryField('getOutboundOrderForPrint', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => getOutboundOrderForPrint(ctx.prisma, input.id),
  }),
)

builder.queryField('getPickSuggestions', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { materialId: t.arg.id({ required: true }), qty: t.arg.int({ required: true }) },
    resolve: async (_, { materialId, qty }, ctx) => {
      const items = await ctx.prisma.stockItem.findMany({
        where: { materialId, status: 'IN_STOCK', quantity: { gt: 0 } },
        include: { batch: true, shelf: true, material: true },
      })

      const shelfSortKey = (shelf: { zone?: string; row?: string | null; level?: number | null; code?: string } | null) => {
        if (!shelf) return '\uffff'
        return `${shelf.zone}\0${shelf.row ?? ''}\0${String(shelf.level ?? 0).padStart(4, '0')}\0${shelf.code}`
      }

      items.sort((a, b) => {
        const expiry = a.batch.expiryDate.getTime() - b.batch.expiryDate.getTime()
        if (expiry !== 0) return expiry
        return shelfSortKey(a.shelf).localeCompare(shelfSortKey(b.shelf), 'zh-CN')
      })

      const suggestions = []
      let remaining = qty
      let routeStep = 0
      for (const item of items) {
        if (remaining <= 0) break
        routeStep += 1
        const level = calcExpiryLevel(item.batch.expiryDate)
        suggestions.push({
          stockItem: item,
          expiryLevel: level,
          shelfCode: item.shelf?.code,
          zone: item.shelf?.zone,
          routeStep,
          available: item.quantity,
          pickQty: Math.min(item.quantity, remaining),
        })
        remaining -= Math.min(item.quantity, remaining)
      }
      return {
        suggestions,
        routeTotal: suggestions.length,
        fulfilled: remaining <= 0,
        shortage: Math.max(0, remaining),
      }
    },
  }),
)

builder.mutationField('createOutboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: CreateOutboundInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const result = await ctx.prisma.outboundOrder.create({
        data: {
          orderNo: genOrderNo('OUT'),
          status: 'DRAFT',
          purpose: input.purpose,
          destination: input.destination,
          recipient: input.recipient,
          createdById: ctx.identity!.userId,
          lines: {
            create: input.lines.map((l) => ({
              materialId: l.materialId,
              requestedQty: l.requestedQty,
            })),
          },
        },
        include: { lines: { include: { material: true } } },
      })
      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'OUTBOUND',
        summary: `创建出库单 ${result.orderNo}`,
        targetId: result.id,
        targetLabel: result.orderNo,
      })
      return result
    },
  }),
)

builder.mutationField('updateOutboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: UpdateOutboundInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.outboundOrder.findUniqueOrThrow({
        where: { id: input.id },
        include: { lines: { include: { material: true } } },
      })
      if (order.status !== 'DRAFT') throw new Error('仅草稿状态可编辑')

      const beforeSnap = snapOutboundOrder(order)
      const { id, lines, ...data } = input
      if (lines) {
        await ctx.prisma.outboundOrderLine.deleteMany({ where: { orderId: id } })
        await ctx.prisma.outboundOrderLine.createMany({
          data: lines.map((l) => ({
            orderId: id,
            materialId: l.materialId,
            requestedQty: l.requestedQty,
          })),
        })
      }
      const result = await ctx.prisma.outboundOrder.update({
        where: { id },
        data: data as never,
        include: { lines: { include: { material: true } } },
      })
      await writeSystemLog(ctx, {
        action: 'UPDATE',
        module: 'OUTBOUND',
        summary: `编辑出库单 ${order.orderNo}`,
        targetId: result.id,
        targetLabel: result.orderNo,
        before: beforeSnap,
        after: snapOutboundOrder(result),
      })
      return result
    },
  }),
)

builder.mutationField('delOutboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.outboundOrder.findUniqueOrThrow({ where: { id: input.id } })
      if (!['DRAFT', 'REJECTED'].includes(order.status)) throw new Error('仅草稿或已驳回的单据可删除')
      const result = await ctx.prisma.outboundOrder.delete({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'DELETE',
        module: 'OUTBOUND',
        summary: `删除出库单 ${order.orderNo}`,
        targetId: order.id,
        targetLabel: order.orderNo,
        before: snapOutboundOrder(order),
      })
      return result
    },
  }),
)

builder.mutationField('submitOutboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.outboundOrder.findUniqueOrThrow({
        where: { id: input.id },
        include: { lines: true },
      })
      if (!order.lines.length) throw new Error('请添加出库明细')
      const result = await ctx.prisma.outboundOrder.update({ where: { id: input.id }, data: { status: 'PENDING' } })
      await startApprovalInstance(ctx.prisma, 'outbound', input.id)
      await writeSystemLog(ctx, {
        action: 'SUBMIT',
        module: 'OUTBOUND',
        summary: `提交出库单 ${order.orderNo} 待审核`,
        targetId: order.id,
        targetLabel: order.orderNo,
        before: { status: formatStatus(order.status) },
        after: { status: formatStatus('PENDING') },
      })
      return result
    },
  }),
)

builder.mutationField('approveOutboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: {
      input: t.arg({ type: IdInput, required: true }),
      approved: t.arg.boolean({ required: true }),
      rejectReason: t.arg.string({ required: false }),
    },
    resolve: async (_, { input, approved, rejectReason }, ctx) => {
      const order = await ctx.prisma.outboundOrder.findUniqueOrThrow({ where: { id: input.id } })
      const pending = await findPendingTaskForBiz(ctx.prisma, 'outbound', input.id, ctx.identity!.role)
      if (pending) {
        await completeApprovalTask(
          ctx.prisma,
          pending.id,
          approved ? 'approved' : 'rejected',
          ctx.identity!.userId,
          ctx.identity!.role,
          rejectReason ?? undefined,
        )
      } else if (approved) {
        await ctx.prisma.outboundOrder.update({
          where: { id: input.id },
          data: { status: 'APPROVED', approvedById: ctx.identity!.userId, approvedAt: new Date() },
        })
      } else {
        await ctx.prisma.outboundOrder.update({
          where: { id: input.id },
          data: { status: 'REJECTED', rejectReason },
        })
      }
      const result = await ctx.prisma.outboundOrder.findUniqueOrThrow({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: approved ? 'APPROVE' : 'REJECT',
        module: 'OUTBOUND',
        summary: approved ? `审核通过出库单 ${order.orderNo}` : `驳回出库单 ${order.orderNo}`,
        targetId: order.id,
        targetLabel: order.orderNo,
        before: { status: formatStatus(order.status) },
        after: {
          status: formatStatus(approved ? 'APPROVED' : 'REJECTED'),
          rejectReason: approved ? order.rejectReason : (rejectReason ?? order.rejectReason),
        },
      })
      return result
    },
  }),
)

builder.mutationField('startPicking', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.outboundOrder.findUniqueOrThrow({ where: { id: input.id } })
      const result = await ctx.prisma.outboundOrder.update({ where: { id: input.id }, data: { status: 'PICKING' } })
      await writeSystemLog(ctx, {
        action: 'PICK',
        module: 'OUTBOUND',
        summary: `开始拣货 ${order.orderNo}`,
        targetId: order.id,
        targetLabel: order.orderNo,
        before: { status: formatStatus(order.status) },
        after: { status: formatStatus('PICKING') },
      })
      return result
    },
  }),
)

builder.mutationField('pickOutboundLine', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: PickStockInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const line = await ctx.prisma.outboundOrderLine.findUniqueOrThrow({
        where: { id: input.lineId },
        include: { order: true, material: true },
      })

      const stockItem = await ctx.prisma.stockItem.findUniqueOrThrow({
        where: { qrCode: input.stockQrCode },
        include: { batch: true },
      })

      if (stockItem.materialId !== line.materialId) {
        throw new Error('扫码物资与单据不匹配')
      }
      if (stockItem.status !== 'IN_STOCK') {
        throw new Error('该物资不在库')
      }

      const level = calcExpiryLevel(stockItem.batch.expiryDate)
      if (level === 'RED' && stockItem.batch.expiryDate < new Date()) {
        throw new Error('物资已过期，禁止出库')
      }
      if (input.pickedQty > stockItem.quantity) {
        throw new Error(`出库数量超出在库数量 ${stockItem.quantity}`)
      }

      const remaining = stockItem.quantity - input.pickedQty
      let newStockItem = null
      let newQrCode = null

      if (remaining > 0) {
        newQrCode = genQrCode(line.material.code, stockItem.batch.batchNo, Date.now() % 1000)
        newStockItem = await ctx.prisma.stockItem.create({
          data: {
            qrCode: newQrCode,
            materialId: stockItem.materialId,
            batchId: stockItem.batchId,
            shelfId: stockItem.shelfId,
            quantity: remaining,
            status: 'IN_STOCK',
            parentId: stockItem.id,
            splitFrom: stockItem.qrCode,
          },
        })
        await ctx.prisma.stockMovement.create({
          data: {
            type: 'SPLIT',
            stockItemId: newStockItem.id,
            quantity: remaining,
            beforeQty: stockItem.quantity,
            afterQty: remaining,
            operatorId: ctx.identity!.userId,
            refType: 'OutboundOrder',
            refId: line.orderId,
            note: `拆零剩余 ${remaining}，新码 ${newQrCode}`,
          },
        })
      }

      if (input.pickedQty === stockItem.quantity) {
        await ctx.prisma.stockItem.update({
          where: { id: stockItem.id },
          data: { status: 'ISSUED', quantity: 0 },
        })
      } else {
        await ctx.prisma.stockItem.update({
          where: { id: stockItem.id },
          data: { quantity: input.pickedQty, status: 'ISSUED' },
        })
      }

      await ctx.prisma.stockMovement.create({
        data: {
          type: 'OUTBOUND',
          stockItemId: stockItem.id,
          quantity: input.pickedQty,
          beforeQty: stockItem.quantity,
          afterQty: remaining,
          fromShelfId: stockItem.shelfId,
          operatorId: ctx.identity!.userId,
          refType: 'OutboundOrder',
          refId: line.orderId,
          note: `出库 ${input.pickedQty}`,
        },
      })

      await ctx.prisma.outboundOrderLine.update({
        where: { id: input.lineId },
        data: { pickedQty: input.pickedQty, stockItemId: stockItem.id },
      })

      await writeSystemLog(ctx, {
        action: 'PICK',
        module: 'OUTBOUND',
        summary: `拣货 ${line.material.name} × ${input.pickedQty}`,
        targetId: line.orderId,
        targetLabel: line.order.orderNo,
        detail: { qrCode: input.stockQrCode, qty: input.pickedQty },
      })

      return {
        picked: input.pickedQty,
        remaining,
        newQrCode,
        newStockItem,
        message: remaining > 0 ? `请打印新标签：剩余 ${remaining} 件` : '出库完成',
      }
    },
  }),
)

builder.mutationField('shipOutboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.outboundOrder.findUniqueOrThrow({
        where: { id: input.id },
        include: { lines: true },
      })
      if (order.status !== 'PICKING') throw new Error('单据未处于拣货状态')
      const unpicked = order.lines.some((l) => l.pickedQty < l.requestedQty)
      if (unpicked) throw new Error('存在未完成拣货的明细')
      const result = await ctx.prisma.outboundOrder.update({ where: { id: input.id }, data: { status: 'SHIPPED' } })
      await writeSystemLog(ctx, {
        action: 'SHIP',
        module: 'OUTBOUND',
        summary: `出库发运 ${order.orderNo}`,
        targetId: order.id,
        targetLabel: order.orderNo,
        before: { status: formatStatus(order.status) },
        after: { status: formatStatus('SHIPPED') },
      })
      return result
    },
  }),
)

builder.mutationField('completeOutboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.outboundOrder.findUniqueOrThrow({ where: { id: input.id } })
      const result = await ctx.prisma.outboundOrder.update({
        where: { id: input.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })
      await writeSystemLog(ctx, {
        action: 'COMPLETE',
        module: 'OUTBOUND',
        summary: `完成出库单 ${order.orderNo}`,
        targetId: order.id,
        targetLabel: order.orderNo,
        before: { status: formatStatus(order.status) },
        after: { status: formatStatus('COMPLETED') },
      })
      return result
    },
  }),
)
