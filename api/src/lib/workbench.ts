import type { PrismaClient } from '@prisma/client'
import { enrichPendingTasks, countMyPendingTasks } from './approval.js'

const ACTIVE_INBOUND_STATUSES = ['PENDING', 'RECEIVING', 'DRAFT'] as const
const ACTIVE_OUTBOUND_STATUSES = ['PENDING', 'APPROVED', 'PICKING', 'DRAFT'] as const

const BIZ_META: Record<string, { label: string; path: string }> = {
  outbound: { label: '物资出库', path: '/outbound' },
  inbound: { label: '采购入库', path: '/inbound' },
}

export type WorkbenchIdentity = { userId: string; role: string }

export async function fetchActiveDocuments(prisma: PrismaClient, take = 50) {
  const [inboundTasks, outboundTasks] = await Promise.all([
    prisma.inboundOrder.findMany({
      where: { status: { in: [...ACTIVE_INBOUND_STATUSES] } },
      take,
      orderBy: { createdAt: 'desc' },
      include: { supplier: true, createdBy: true },
    }),
    prisma.outboundOrder.findMany({
      where: { status: { in: [...ACTIVE_OUTBOUND_STATUSES] } },
      take,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: true },
    }),
  ])

  return [
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
}

export async function countActiveDocuments(prisma: PrismaClient) {
  const [pendingInbound, pendingOutbound] = await Promise.all([
    prisma.inboundOrder.count({ where: { status: { in: ['PENDING', 'RECEIVING'] } } }),
    prisma.outboundOrder.count({ where: { status: { in: ['PENDING', 'APPROVED', 'PICKING'] } } }),
  ])
  return pendingInbound + pendingOutbound
}

export async function fetchMyPendingApprovals(prisma: PrismaClient, role: string, take = 50) {
  const tasks = await prisma.approvalTask.findMany({
    where: { status: 'PENDING', assigneeRole: role },
    include: { instance: { include: { flow: true } } },
    orderBy: { createdAt: 'desc' },
    take,
  })
  return enrichPendingTasks(prisma, tasks)
}

async function myBizIds(prisma: PrismaClient, userId: string) {
  const [inboundIds, outboundIds] = await Promise.all([
    prisma.inboundOrder.findMany({ where: { createdById: userId }, select: { id: true } }),
    prisma.outboundOrder.findMany({ where: { createdById: userId }, select: { id: true } }),
  ])
  return { inboundIds: inboundIds.map((o) => o.id), outboundIds: outboundIds.map((o) => o.id) }
}

export async function countMySubmittedApprovals(prisma: PrismaClient, userId: string) {
  const { inboundIds, outboundIds } = await myBizIds(prisma, userId)
  if (!inboundIds.length && !outboundIds.length) return 0
  return prisma.approvalInstance.count({
    where: {
      status: 'RUNNING',
      OR: [
        ...(inboundIds.length ? [{ bizType: 'inbound', bizId: { in: inboundIds } }] : []),
        ...(outboundIds.length ? [{ bizType: 'outbound', bizId: { in: outboundIds } }] : []),
      ],
    },
  })
}

export async function fetchMySubmittedApprovals(prisma: PrismaClient, userId: string, take = 50) {
  const { inboundIds, outboundIds } = await myBizIds(prisma, userId)
  if (!inboundIds.length && !outboundIds.length) return []

  const instances = await prisma.approvalInstance.findMany({
    where: {
      status: 'RUNNING',
      OR: [
        ...(inboundIds.length ? [{ bizType: 'inbound', bizId: { in: inboundIds } }] : []),
        ...(outboundIds.length ? [{ bizType: 'outbound', bizId: { in: outboundIds } }] : []),
      ],
    },
    include: {
      tasks: { where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { updatedAt: 'desc' },
    take,
  })

  const [outbounds, inbounds] = await Promise.all([
    outboundIds.length
      ? prisma.outboundOrder.findMany({
          where: { id: { in: outboundIds } },
          select: { id: true, orderNo: true, purpose: true, destination: true, createdAt: true },
        })
      : [],
    inboundIds.length
      ? prisma.inboundOrder.findMany({
          where: { id: { in: inboundIds } },
          select: { id: true, orderNo: true, supplier: { select: { name: true } }, createdAt: true },
        })
      : [],
  ])

  const outboundMap = new Map(outbounds.map((o) => [o.id, o]))
  const inboundMap = new Map(inbounds.map((o) => [o.id, o]))

  return instances.map((inst) => {
    const meta = BIZ_META[inst.bizType] ?? { label: inst.bizType, path: '/' }
    const outbound = outboundMap.get(inst.bizId)
    const inbound = inboundMap.get(inst.bizId)
    const pendingTask = inst.tasks[0]
    return {
      instanceId: inst.id,
      bizType: inst.bizType,
      bizId: inst.bizId,
      bizLabel: meta.label,
      docPath: `${meta.path}/${inst.bizId}`,
      orderNo: outbound?.orderNo ?? inbound?.orderNo ?? '—',
      summary: outbound
        ? `${outbound.destination ?? outbound.purpose ?? '出库申请'}`
        : `${inbound?.supplier?.name ?? '入库申请'}`,
      currentNodeLabel: pendingTask?.nodeLabel ?? '审批中',
      waitingRole: pendingTask?.assigneeRole ?? null,
      submittedAt: inst.createdAt,
      updatedAt: inst.updatedAt,
    }
  })
}

export async function fetchWorkbenchSummary(
  prisma: PrismaClient,
  identity: WorkbenchIdentity,
  opts?: { take?: number },
) {
  const take = opts?.take ?? 50
  const [myApprovals, mySubmitted, activeDocuments, counts] = await Promise.all([
    fetchMyPendingApprovals(prisma, identity.role, take),
    fetchMySubmittedApprovals(prisma, identity.userId, take),
    fetchActiveDocuments(prisma, take),
    Promise.all([
      countMyPendingTasks(prisma, identity.role),
      countMySubmittedApprovals(prisma, identity.userId),
      countActiveDocuments(prisma),
    ]).then(([myApprovalsCount, mySubmittedCount, activeDocumentsCount]) => ({
      myApprovals: myApprovalsCount,
      mySubmitted: mySubmittedCount,
      activeDocuments: activeDocumentsCount,
    })),
  ])

  return { counts, myApprovals, mySubmitted, activeDocuments }
}
