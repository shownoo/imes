import { builder } from '../builder.js'
import { getInboundOrderForPrint } from '../lib/print-data.js'
import { parseInboundText } from '../lib/parse-inbound-text.js'
import { genOrderNo, genQrCode, addMonths } from '../lib/utils.js'
import { formatStatus } from '../lib/log-diff.js'
import { writeSystemLog } from '../lib/system-log.js'
import { startApprovalInstance, findPendingTaskForBiz, completeApprovalTask } from '../lib/approval.js'
import { IdInput, PaginationInput } from './input-types.js'

function snapInboundOrder(order: {
  warehouseId?: string | null
  supplierId?: string | null
  contractNo?: string | null
  remark?: string | null
  status?: string
  lines?: Array<{ material?: { name: string }; expectedQty: number }>
}) {
  return {
    warehouseId: order.warehouseId,
    supplierId: order.supplierId,
    contractNo: order.contractNo,
    remark: order.remark,
    status: order.status ? formatStatus(order.status) : undefined,
    lineCount: order.lines?.length ?? 0,
    lines: order.lines?.map((l) => `${l.material?.name ?? '?'}×${l.expectedQty}`).join('；') || '—',
  }
}

const InboundLineInput = builder.inputType('InboundLineInput', {
  fields: (t) => ({
    materialId: t.id({ required: true }),
    expectedQty: t.int({ required: true }),
    batchNo: t.string({ required: false }),
    productionDate: t.field({ type: 'DateTime', required: false }),
  }),
})

const CreateInboundInput = builder.inputType('CreateInboundInput', {
  fields: (t) => ({
    type: t.string({ required: false }),
    warehouseId: t.id({ required: false }),
    supplierId: t.id({ required: false }),
    contractNo: t.string({ required: false }),
    remark: t.string({ required: false }),
    lines: t.field({ type: [InboundLineInput], required: true }),
  }),
})

const UpdateInboundInput = builder.inputType('UpdateInboundInput', {
  fields: (t) => ({
    id: t.id({ required: true }),
    warehouseId: t.id({ required: false }),
    supplierId: t.id({ required: false }),
    contractNo: t.string({ required: false }),
    remark: t.string({ required: false }),
    lines: t.field({ type: [InboundLineInput], required: false }),
  }),
})

const ReceiveInboundInput = builder.inputType('ReceiveInboundInput', {
  fields: (t) => ({
    orderId: t.id({ required: true }),
    lineId: t.id({ required: true }),
    actualQty: t.int({ required: true }),
    batchNo: t.string({ required: true }),
    productionDate: t.field({ type: 'DateTime', required: true }),
  }),
})

const ShelveStockInput = builder.inputType('ShelveStockInput', {
  fields: (t) => ({
    stockItemId: t.id({ required: true }),
    shelfQrCode: t.string({ required: true }),
  }),
})

builder.queryField('getInboundOrders', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      type: t.arg.string({ required: false }),
      status: t.arg.string({ required: false }),
      warehouseId: t.arg.id({ required: false }),
      input: t.arg({ type: PaginationInput, required: false }),
    },
    resolve: async (_, { type, status, warehouseId, input }, ctx) => {
      const where: Record<string, unknown> = {}
      if (type) where.type = type
      if (status) where.status = status
      if (warehouseId) where.warehouseId = warehouseId
      const [orders, count] = await Promise.all([
        ctx.prisma.inboundOrder.findMany({
          where,
          take: input?.take ?? 20,
          skip: input?.skip ?? 0,
          include: {
            warehouse: true,
            supplier: true,
            createdBy: true,
            approvedBy: true,
            lines: { include: { material: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.inboundOrder.count({ where }),
      ])
      return { orders, count }
    },
  }),
)

builder.queryField('getInboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.inboundOrder.findUnique({
        where: { id: input.id },
        include: {
          warehouse: true,
          supplier: true,
          createdBy: true,
          approvedBy: true,
          lines: { include: { material: { include: { category: true } } } },
          batches: true,
        },
      })
      if (!order) return null

      const lines = await Promise.all(
        order.lines.map(async (line) => {
          if (!line.batchNo || line.actualQty <= 0) return { ...line, stockItems: [] as unknown[] }
          const stockItems = await ctx.prisma.stockItem.findMany({
            where: {
              materialId: line.materialId,
              batch: { inboundOrderId: order.id, batchNo: line.batchNo },
            },
            include: { material: true, batch: true, shelf: { include: { warehouse: true } } },
            orderBy: { createdAt: 'asc' },
          })
          return { ...line, stockItems }
        }),
      )

      return { ...order, lines }
    },
  }),
)

builder.queryField('getInboundOrderForPrint', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => getInboundOrderForPrint(ctx.prisma, input.id),
  }),
)

builder.mutationField('createInboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: CreateInboundInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const inboundType = (input.type ?? 'PURCHASE') as 'PURCHASE' | 'TRANSFER' | 'RETURN'
      if (!input.warehouseId) throw new Error('请选择收货仓库')
      await ctx.prisma.warehouse.findUniqueOrThrow({ where: { id: input.warehouseId } })
      const prefix = inboundType === 'PURCHASE' ? 'CG' : inboundType === 'TRANSFER' ? 'DB' : 'TH'
      const result = await ctx.prisma.inboundOrder.create({
        data: {
          orderNo: genOrderNo(prefix),
          type: inboundType,
          status: 'DRAFT',
          warehouseId: input.warehouseId,
          supplierId: input.supplierId,
          contractNo: input.contractNo,
          remark: input.remark,
          createdById: ctx.identity!.userId,
          lines: {
            create: input.lines.map((l) => ({
              materialId: l.materialId,
              expectedQty: l.expectedQty,
              batchNo: l.batchNo,
              productionDate: l.productionDate,
            })),
          },
        },
        include: { warehouse: true, lines: { include: { material: true } }, supplier: true },
      })
      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'INBOUND',
        summary: `创建入库单 ${result.orderNo}`,
        targetId: result.id,
        targetLabel: result.orderNo,
      })
      return result
    },
  }),
)

builder.mutationField('updateInboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: UpdateInboundInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.inboundOrder.findUniqueOrThrow({
        where: { id: input.id },
        include: { lines: { include: { material: true } } },
      })
      if (order.status !== 'DRAFT') throw new Error('仅草稿状态可编辑')

      const beforeSnap = snapInboundOrder(order)
      const { id, lines, ...data } = input
      if (lines) {
        await ctx.prisma.inboundOrderLine.deleteMany({ where: { orderId: id } })
        await ctx.prisma.inboundOrderLine.createMany({
          data: lines.map((l) => ({
            orderId: id,
            materialId: l.materialId,
            expectedQty: l.expectedQty,
            batchNo: l.batchNo,
            productionDate: l.productionDate,
          })),
        })
      }
      const result = await ctx.prisma.inboundOrder.update({
        where: { id },
        data: data as never,
        include: { warehouse: true, lines: { include: { material: true } }, supplier: true },
      })
      await writeSystemLog(ctx, {
        action: 'UPDATE',
        module: 'INBOUND',
        summary: `编辑入库单 ${order.orderNo}`,
        targetId: result.id,
        targetLabel: result.orderNo,
        before: beforeSnap,
        after: snapInboundOrder(result),
      })
      return result
    },
  }),
)

builder.mutationField('delInboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.inboundOrder.findUniqueOrThrow({ where: { id: input.id } })
      if (!['DRAFT', 'CANCELLED'].includes(order.status)) throw new Error('仅草稿或已取消的单据可删除')
      const result = await ctx.prisma.inboundOrder.delete({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'DELETE',
        module: 'INBOUND',
        summary: `删除入库单 ${order.orderNo}`,
        targetId: order.id,
        targetLabel: order.orderNo,
        before: snapInboundOrder(order),
      })
      return result
    },
  }),
)

builder.mutationField('submitInboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.inboundOrder.findUniqueOrThrow({
        where: { id: input.id },
        include: { lines: true },
      })
      if (!order.lines.length) throw new Error('请添加入库明细')
      if (!order.warehouseId) throw new Error('请选择收货仓库后再提交')
      const result = await ctx.prisma.inboundOrder.update({
        where: { id: input.id },
        data: { status: 'PENDING' },
      })
      await startApprovalInstance(ctx.prisma, 'inbound', input.id)
      await writeSystemLog(ctx, {
        action: 'SUBMIT',
        module: 'INBOUND',
        summary: `提交入库单 ${order.orderNo} 待审核`,
        targetId: order.id,
        targetLabel: order.orderNo,
        before: { status: formatStatus(order.status) },
        after: { status: formatStatus('PENDING') },
      })
      return result
    },
  }),
)

builder.mutationField('approveInboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.inboundOrder.findUniqueOrThrow({ where: { id: input.id } })
      const pending = await findPendingTaskForBiz(ctx.prisma, 'inbound', input.id, ctx.identity!.role)
      if (pending) {
        await completeApprovalTask(
          ctx.prisma,
          pending.id,
          'approved',
          ctx.identity!.userId,
          ctx.identity!.role,
        )
      } else {
        await ctx.prisma.inboundOrder.update({
          where: { id: input.id },
          data: { status: 'RECEIVING', approvedById: ctx.identity!.userId, approvedAt: new Date() },
        })
      }
      const result = await ctx.prisma.inboundOrder.findUniqueOrThrow({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'APPROVE',
        module: 'INBOUND',
        summary: `审核通过入库单 ${order.orderNo}`,
        targetId: order.id,
        targetLabel: order.orderNo,
        before: { status: formatStatus(order.status) },
        after: { status: formatStatus('RECEIVING') },
      })
      return result
    },
  }),
)

builder.mutationField('rejectInboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: {
      input: t.arg({ type: IdInput, required: true }),
      reason: t.arg.string({ required: false }),
    },
    resolve: async (_, { input, reason }, ctx) => {
      const order = await ctx.prisma.inboundOrder.findUniqueOrThrow({ where: { id: input.id } })
      const pending = await findPendingTaskForBiz(ctx.prisma, 'inbound', input.id, ctx.identity!.role)
      if (pending) {
        await completeApprovalTask(
          ctx.prisma,
          pending.id,
          'rejected',
          ctx.identity!.userId,
          ctx.identity!.role,
          reason ?? '审核驳回',
        )
      } else {
        await ctx.prisma.inboundOrder.update({
          where: { id: input.id },
          data: { status: 'CANCELLED', remark: reason ?? '审核驳回' },
        })
      }
      const result = await ctx.prisma.inboundOrder.findUniqueOrThrow({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'REJECT',
        module: 'INBOUND',
        summary: `驳回入库单 ${order.orderNo}`,
        targetId: order.id,
        targetLabel: order.orderNo,
        before: { status: formatStatus(order.status), remark: order.remark },
        after: { status: formatStatus('CANCELLED'), remark: reason ?? '审核驳回' },
      })
      return result
    },
  }),
)

builder.mutationField('receiveInboundLine', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: ReceiveInboundInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const line = await ctx.prisma.inboundOrderLine.findUniqueOrThrow({
        where: { id: input.lineId },
        include: { material: { include: { category: true } }, order: true },
      })

      if (line.order.status !== 'RECEIVING') throw new Error('单据未处于收货状态')

      const expiryDate = addMonths(input.productionDate, line.material.category.shelfLifeMonths)

      const batch = await ctx.prisma.materialBatch.upsert({
        where: {
          materialId_batchNo: { materialId: line.materialId, batchNo: input.batchNo },
        },
        create: {
          batchNo: input.batchNo,
          materialId: line.materialId,
          supplierId: line.order.supplierId,
          productionDate: input.productionDate,
          expiryDate,
          inboundOrderId: input.orderId,
        },
        update: {},
      })

      const qrCode = genQrCode(line.material.code, input.batchNo, Date.now() % 10000)
      const item = await ctx.prisma.stockItem.create({
        data: {
          qrCode,
          materialId: line.materialId,
          batchId: batch.id,
          quantity: input.actualQty,
          status: 'IN_STOCK',
        },
      })
      await ctx.prisma.stockMovement.create({
        data: {
          type: 'INBOUND',
          stockItemId: item.id,
          quantity: input.actualQty,
          afterQty: input.actualQty,
          operatorId: ctx.identity!.userId,
          refType: 'InboundOrder',
          refId: input.orderId,
          note: `采购入库赋码 ${qrCode}，数量 ${input.actualQty}`,
        },
      })

      await ctx.prisma.inboundOrderLine.update({
        where: { id: input.lineId },
        data: {
          actualQty: input.actualQty,
          batchNo: input.batchNo,
          productionDate: input.productionDate,
          expiryDate,
        },
      })

      await writeSystemLog(ctx, {
        action: 'RECEIVE',
        module: 'INBOUND',
        summary: `入库收货赋码 ${qrCode}，数量 ${input.actualQty}`,
        targetId: line.orderId,
        targetLabel: line.order.orderNo,
        detail: { qrCode, material: line.material.name, qty: input.actualQty },
      })

      return { batch, stockItem: item, qrCode }
    },
  }),
)

builder.mutationField('shelveStockItem', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: ShelveStockInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const shelf = await ctx.prisma.shelf.findUniqueOrThrow({
        where: { qrCode: input.shelfQrCode },
        include: { warehouse: true },
      })
      const existing = await ctx.prisma.stockItem.findUniqueOrThrow({
        where: { id: input.stockItemId },
        include: {
          batch: { include: { inboundOrder: { include: { warehouse: true } } } },
        },
      })
      const orderWarehouseId = existing.batch?.inboundOrder?.warehouseId
      if (orderWarehouseId && shelf.warehouseId !== orderWarehouseId) {
        const orderWh = existing.batch?.inboundOrder?.warehouse
        throw new Error(
          `该货位属于「${shelf.warehouse.name}」，本单收货库为「${orderWh?.name ?? '未知'}」`,
        )
      }
      const item = await ctx.prisma.stockItem.update({
        where: { id: input.stockItemId },
        data: { shelfId: shelf.id },
        include: { material: true, batch: true, shelf: { include: { warehouse: true } } },
      })
      await ctx.prisma.stockMovement.create({
        data: {
          type: 'TRANSFER',
          stockItemId: item.id,
          quantity: item.quantity,
          toShelfId: shelf.id,
          operatorId: ctx.identity!.userId,
          note: `上架至 ${shelf.code}`,
        },
      })
      await writeSystemLog(ctx, {
        action: 'SHELVE',
        module: 'STOCK',
        summary: `物资上架至货位 ${shelf.code}`,
        targetId: item.id,
        targetLabel: item.qrCode,
      })
      return item
    },
  }),
)

builder.mutationField('completeInboundOrder', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const order = await ctx.prisma.inboundOrder.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          lines: true,
          batches: { include: { stockItems: true } },
        },
      })
      const unreceived = order.lines.some((l) => l.actualQty < l.expectedQty)
      if (unreceived) throw new Error('存在未完成收货的明细')
      const unshelved = order.batches.flatMap((b) => b.stockItems).filter((s) => !s.shelfId)
      if (unshelved.length) throw new Error('存在未上架的物资，请先扫码上架')
      const result = await ctx.prisma.inboundOrder.update({
        where: { id: input.id },
        data: { status: 'COMPLETED' },
      })
      await writeSystemLog(ctx, {
        action: 'COMPLETE',
        module: 'INBOUND',
        summary: `完成入库单 ${order.orderNo}`,
        targetId: order.id,
        targetLabel: order.orderNo,
        before: { status: formatStatus(order.status) },
        after: { status: formatStatus('COMPLETED') },
      })
      return result
    },
  }),
)

/** 采购入库：从 OCR/PDF 提取的纯文本解析明细并匹配物资档案 */
builder.mutationField('parseInboundDocumentText', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { text: t.arg.string({ required: true }) },
    resolve: async (_, { text }, ctx) => {
      const trimmed = text.trim()
      if (!trimmed) return { rows: [], unmatched: [] }

      const materials = await ctx.prisma.material.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          spec: true,
          model: true,
          unit: true,
          manufacturer: true,
        },
        orderBy: { code: 'asc' },
      })

      const parsed = parseInboundText(trimmed, materials)
      const rows = parsed.filter((r) => r.materialId && r.expectedQty > 0)
      const unmatched = parsed.filter((r) => !r.materialId)

      return { rows, unmatched }
    },
  }),
)
