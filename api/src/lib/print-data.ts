import type { PrismaClient } from '@prisma/client'
import { formatStatus } from './log-diff.js'

function formatDate(d: Date | string | null | undefined) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

export async function getInboundOrderForPrint(prisma: PrismaClient, id: string) {
  const order = await prisma.inboundOrder.findUnique({
    where: { id },
    include: {
      supplier: { select: { name: true } },
      createdBy: { select: { name: true, username: true } },
      approvedBy: { select: { name: true, username: true } },
      lines: {
        include: { material: { select: { name: true, spec: true, unit: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!order) return null

  return {
    orderNo: order.orderNo,
    createdAt: formatDate(order.orderDate ?? order.createdAt),
    status: formatStatus(order.status),
    contractNo: order.contractNo ?? '',
    remark: order.remark ?? '',
    supplier: order.supplier,
    createdBy: {
      name: order.createdBy.name ?? order.createdBy.username,
    },
    approvedBy: order.approvedBy
      ? { name: order.approvedBy.name ?? order.approvedBy.username }
      : { name: '' },
    approvedAt: formatDate(order.approvedAt),
    items: order.lines.map((line, index) => ({
      odr: index + 1,
      name: line.material.name,
      spec: line.material.spec ?? '',
      manufacturer: line.manufacturer ?? '',
      unit: line.material.unit,
      expectedQty: line.expectedQty,
      actualQty: line.actualQty,
      batchNo: line.batchNo ?? '',
    })),
  }
}

export async function getOutboundOrderForPrint(prisma: PrismaClient, id: string) {
  const order = await prisma.outboundOrder.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, username: true } },
      approvedBy: { select: { name: true, username: true } },
      lines: {
        include: { material: { select: { name: true, spec: true, unit: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!order) return null

  return {
    orderNo: order.orderNo,
    createdAt: formatDate(order.createdAt),
    status: formatStatus(order.status),
    purpose: order.purpose ?? '',
    destination: order.destination ?? '',
    recipient: order.recipient ?? '',
    remark: order.rejectReason ? `驳回原因：${order.rejectReason}` : '',
    createdBy: {
      name: order.createdBy.name ?? order.createdBy.username,
    },
    approvedBy: order.approvedBy
      ? { name: order.approvedBy.name ?? order.approvedBy.username }
      : { name: '' },
    approvedAt: formatDate(order.approvedAt),
    completedAt: formatDate(order.completedAt),
    items: order.lines.map((line, index) => ({
      odr: index + 1,
      name: line.material.name,
      spec: line.material.spec ?? '',
      unit: line.material.unit,
      requestedQty: line.requestedQty,
      pickedQty: line.pickedQty,
    })),
  }
}
