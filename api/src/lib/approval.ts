import type { Prisma, PrismaClient } from '@prisma/client'
import type { FlowGraph, FlowNode, TaskAction } from './approval-types.js'
import { getApprovalNotifyConfig, calcDueAt, resolveNodeTiming } from './approval-notify-config.js'
import { queueApprovalTaskNotify, flushApprovalNotifies } from './approval-notify.js'

type Tx = Prisma.TransactionClient

function parseGraph(raw: unknown): FlowGraph {
  const g = raw as FlowGraph
  if (!g?.nodes?.length) throw new Error('流程定义无效')
  return g
}

function nodeById(graph: FlowGraph, id: string): FlowNode | undefined {
  return graph.nodes.find((n) => n.id === id)
}

function edgesFrom(graph: FlowGraph, nodeId: string, action?: TaskAction) {
  return graph.edges.filter((e) => {
    if (e.source !== nodeId) return false
    if (action && e.data?.action) return e.data.action === action
    return true
  })
}

function nextNodeId(graph: FlowGraph, fromId: string, action?: TaskAction): string | null {
  const edges = edgesFrom(graph, fromId, action)
  if (!edges.length) {
    const fallback = graph.edges.filter((e) => e.source === fromId)
    return fallback[0]?.target ?? null
  }
  return edges[0]?.target ?? null
}

export function canActOnTask(role: string, assigneeRole: string | null | undefined): boolean {
  if (!assigneeRole) return true
  if (role === 'ADMIN') return true
  return role === assigneeRole
}

async function applyBizOutcome(
  tx: Tx,
  bizType: string,
  bizId: string,
  outcome: 'approved' | 'rejected',
  userId: string,
  comment?: string,
) {
  if (bizType === 'outbound') {
    if (outcome === 'approved') {
      await tx.outboundOrder.update({
        where: { id: bizId },
        data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date() },
      })
    } else {
      await tx.outboundOrder.update({
        where: { id: bizId },
        data: { status: 'REJECTED', rejectReason: comment ?? '审批驳回' },
      })
    }
    return
  }
  if (bizType === 'inbound') {
    if (outcome === 'approved') {
      await tx.inboundOrder.update({
        where: { id: bizId },
        data: { status: 'RECEIVING', approvedById: userId, approvedAt: new Date() },
      })
    } else {
      await tx.inboundOrder.update({
        where: { id: bizId },
        data: { status: 'CANCELLED' },
      })
    }
  }
}

async function enterNode(
  tx: Tx,
  instance: { id: string; bizType: string; bizId: string },
  graph: FlowGraph,
  nodeId: string,
  userId: string,
  comment?: string,
): Promise<{ taskId?: string }> {
  const node = nodeById(graph, nodeId)
  if (!node) throw new Error(`流程节点 ${nodeId} 不存在`)

  await tx.approvalInstance.update({
    where: { id: instance.id },
    data: { currentNode: nodeId },
  })

  if (node.type === 'approval') {
    const config = await getApprovalNotifyConfig(tx as unknown as PrismaClient)
    const timing = resolveNodeTiming(node.data, config)
    const dueAt = calcDueAt(new Date(), timing.timeoutHours)
    const task = await tx.approvalTask.create({
      data: {
        instanceId: instance.id,
        nodeId: node.id,
        nodeLabel: node.data.label,
        assigneeRole: node.data.role ?? null,
        status: 'PENDING',
        dueAt,
      },
    })
    return { taskId: task.id }
  }

  if (node.type === 'end') {
    const outcome = node.data.outcome ?? 'approved'
    const status = outcome === 'approved' ? 'APPROVED' : 'REJECTED'
    await tx.approvalInstance.update({
      where: { id: instance.id },
      data: { status, currentNode: nodeId },
    })
    await applyBizOutcome(tx, instance.bizType, instance.bizId, outcome, userId, comment)
  }
  return {}
}

export async function startApprovalInstance(
  prisma: PrismaClient,
  bizType: string,
  bizId: string,
) {
  const flow = await prisma.approvalFlow.findFirst({
    where: { bizType, active: true },
  })
  if (!flow) return null

  const graph = parseGraph(flow.graph)
  const start = graph.nodes.find((n) => n.type === 'start')
  if (!start) throw new Error('流程缺少开始节点')

  const firstNodeId = nextNodeId(graph, start.id)
  if (!firstNodeId) throw new Error('开始节点未连接后续步骤')

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.approvalInstance.findUnique({
      where: { bizType_bizId: { bizType, bizId } },
    })
    if (existing?.status === 'RUNNING') return existing

    if (existing) {
      await tx.approvalTask.deleteMany({ where: { instanceId: existing.id } })
      await tx.approvalInstance.delete({ where: { id: existing.id } })
    }

    const instance = await tx.approvalInstance.create({
      data: {
        flowId: flow.id,
        bizType,
        bizId,
        currentNode: firstNodeId,
        status: 'RUNNING',
      },
    })

    const entered = await enterNode(tx, instance, graph, firstNodeId, 'system', undefined)
    const inst = await tx.approvalInstance.findUniqueOrThrow({
      where: { id: instance.id },
      include: { tasks: { orderBy: { createdAt: 'asc' } }, flow: true },
    })
    if (entered.taskId) queueApprovalTaskNotify(entered.taskId)
    return inst
  })
  await flushApprovalNotifies(prisma)
  return result
}

export async function completeApprovalTask(
  prisma: PrismaClient,
  taskId: string,
  action: TaskAction,
  userId: string,
  userRole: string,
  comment?: string,
) {
  const result = await prisma.$transaction(async (tx) => {
    const task = await tx.approvalTask.findUniqueOrThrow({
      where: { id: taskId },
      include: { instance: { include: { flow: true } } },
    })

    if (task.status !== 'PENDING') throw new Error('该任务已处理')
    if (!canActOnTask(userRole, task.assigneeRole)) throw new Error('无权处理此审批')

    const graph = parseGraph(task.instance.flow.graph)
    const node = nodeById(graph, task.nodeId)
    if (!node || node.type !== 'approval') throw new Error('非审批节点')

    const taskStatus = action === 'approved' ? 'APPROVED' : 'REJECTED'
    await tx.approvalTask.update({
      where: { id: taskId },
      data: {
        status: taskStatus,
        action,
        comment,
        actedAt: new Date(),
        actedById: userId,
      },
    })

    if (action === 'rejected') {
      await tx.approvalTask.updateMany({
        where: { instanceId: task.instance.id, status: 'PENDING', id: { not: taskId } },
        data: { status: 'CANCELLED' },
      })
      const rejectTarget = nextNodeId(graph, task.nodeId, 'rejected')
      if (rejectTarget) {
        await enterNode(tx, task.instance, graph, rejectTarget, userId, comment)
      } else {
        await tx.approvalInstance.update({
          where: { id: task.instance.id },
          data: { status: 'REJECTED' },
        })
        await applyBizOutcome(tx, task.instance.bizType, task.instance.bizId, 'rejected', userId, comment)
      }
      return tx.approvalInstance.findUniqueOrThrow({
        where: { id: task.instance.id },
        include: { tasks: { orderBy: { createdAt: 'asc' } }, flow: true },
      })
    }

    const mode = node.data.mode ?? 'any'
    if (mode === 'all') {
      const pending = await tx.approvalTask.count({
        where: { instanceId: task.instance.id, nodeId: task.nodeId, status: 'PENDING' },
      })
      if (pending > 0) {
        return tx.approvalInstance.findUniqueOrThrow({
          where: { id: task.instance.id },
          include: { tasks: { orderBy: { createdAt: 'asc' } }, flow: true },
        })
      }
    }

    const nextId = nextNodeId(graph, task.nodeId, 'approved')
    if (!nextId) throw new Error('审批通过后无后续节点')

    await tx.approvalTask.updateMany({
      where: { instanceId: task.instance.id, nodeId: task.nodeId, status: 'PENDING', id: { not: taskId } },
      data: { status: 'CANCELLED' },
    })

    const entered = await enterNode(tx, task.instance, graph, nextId, userId, comment)

    const result = await tx.approvalInstance.findUniqueOrThrow({
      where: { id: task.instance.id },
      include: { tasks: { orderBy: { createdAt: 'asc' } }, flow: true },
    })
    if (entered.taskId) queueApprovalTaskNotify(entered.taskId)
    return result
  })
  await flushApprovalNotifies(prisma)
  return result
}

export async function getApprovalInstance(prisma: PrismaClient, bizType: string, bizId: string) {
  return prisma.approvalInstance.findUnique({
    where: { bizType_bizId: { bizType, bizId } },
    include: {
      flow: true,
      tasks: { orderBy: { createdAt: 'asc' }, include: { actedBy: { select: { id: true, name: true, username: true } } } },
    },
  })
}

export async function findPendingTaskForBiz(
  prisma: PrismaClient,
  bizType: string,
  bizId: string,
  userRole: string,
) {
  const instance = await getApprovalInstance(prisma, bizType, bizId)
  if (!instance || instance.status !== 'RUNNING') return null
  return instance.tasks.find((t) => t.status === 'PENDING' && canActOnTask(userRole, t.assigneeRole)) ?? null
}

export function buildInstanceProgress(instance: {
  status: string
  currentNode: string | null
  flow: { graph: unknown }
  tasks: Array<{ nodeId: string; status: string }>
}) {
  const graph = parseGraph(instance.flow.graph)
  const startId = graph.nodes.find((n) => n.type === 'start')?.id
  const completedNodes = new Set(
    instance.tasks.filter((t) => t.status !== 'PENDING').map((t) => t.nodeId),
  )
  if (startId && (instance.tasks.length > 0 || instance.currentNode !== startId)) {
    completedNodes.add(startId)
  }
  const activeNodes = new Set(
    instance.tasks.filter((t) => t.status === 'PENDING').map((t) => t.nodeId),
  )
  if (instance.currentNode) activeNodes.add(instance.currentNode)

  return graph.nodes.map((n) => {
    const outcome = n.data.outcome
    if (instance.status !== 'RUNNING' && n.type === 'end' && outcome) {
      const matched =
        (instance.status === 'APPROVED' && outcome === 'approved') ||
        (instance.status === 'REJECTED' && outcome === 'rejected')
      if (matched) {
        return { id: n.id, label: n.data.label, type: n.type, state: 'done' as const }
      }
    }
    const state = completedNodes.has(n.id)
      ? ('done' as const)
      : activeNodes.has(n.id)
        ? ('active' as const)
        : ('pending' as const)
    return { id: n.id, label: n.data.label, type: n.type, state }
  })
}

const BIZ_META: Record<string, { label: string; path: string }> = {
  outbound: { label: '物资出库', path: '/outbound' },
  inbound: { label: '采购入库', path: '/inbound' },
}

export async function enrichPendingTasks(
  prisma: PrismaClient,
  tasks: Array<{
    id: string
    nodeId: string
    nodeLabel: string | null
    assigneeRole: string | null
    createdAt: Date
    dueAt?: Date | null
    remindCount?: number
    instance: { bizType: string; bizId: string; status: string }
  }>,
) {
  const outboundIds = tasks.filter((t) => t.instance.bizType === 'outbound').map((t) => t.instance.bizId)
  const inboundIds = tasks.filter((t) => t.instance.bizType === 'inbound').map((t) => t.instance.bizId)

  const [outbounds, inbounds] = await Promise.all([
    outboundIds.length
      ? prisma.outboundOrder.findMany({
          where: { id: { in: outboundIds } },
          select: { id: true, orderNo: true, purpose: true, destination: true, createdBy: { select: { name: true } } },
        })
      : [],
    inboundIds.length
      ? prisma.inboundOrder.findMany({
          where: { id: { in: inboundIds } },
          select: { id: true, orderNo: true, supplier: { select: { name: true } }, createdBy: { select: { name: true } } },
        })
      : [],
  ])

  const outboundMap = new Map(outbounds.map((o) => [o.id, o]))
  const inboundMap = new Map(inbounds.map((o) => [o.id, o]))

  return tasks.map((t) => {
    const meta = BIZ_META[t.instance.bizType] ?? { label: t.instance.bizType, path: '/' }
    const outbound = outboundMap.get(t.instance.bizId)
    const inbound = inboundMap.get(t.instance.bizId)
    return {
      taskId: t.id,
      nodeId: t.nodeId,
      nodeLabel: t.nodeLabel,
      assigneeRole: t.assigneeRole,
      createdAt: t.createdAt,
      dueAt: t.dueAt,
      remindCount: t.remindCount,
      bizType: t.instance.bizType,
      bizId: t.instance.bizId,
      bizLabel: meta.label,
      docPath: `${meta.path}/${t.instance.bizId}`,
      orderNo: outbound?.orderNo ?? inbound?.orderNo ?? '—',
      summary: outbound
        ? `${outbound.destination ?? outbound.purpose ?? '出库申请'}`
        : `${inbound?.supplier?.name ?? '入库申请'}`,
      submitter: outbound?.createdBy?.name ?? inbound?.createdBy?.name ?? '—',
    }
  })
}

export async function countMyPendingTasks(prisma: PrismaClient, role: string) {
  return prisma.approvalTask.count({
    where: { status: 'PENDING', assigneeRole: role },
  })
}
