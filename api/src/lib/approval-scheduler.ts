import type { PrismaClient } from '@prisma/client'
import { completeApprovalTask } from './approval.js'
import {
  getApprovalNotifyConfig,
  resolveNodeTiming,
} from './approval-notify-config.js'
import { notifyApprovalTaskRemind, notifyApprovalTaskTimeout } from './approval-notify.js'
import type { FlowGraph } from './approval-types.js'

function parseGraphSafe(raw: unknown): FlowGraph | null {
  try {
    const g = raw as FlowGraph
    if (!g?.nodes?.length) return null
    return g
  } catch {
    return null
  }
}

async function getSystemActor(prisma: PrismaClient) {
  const admin = await prisma.user.findFirst({
    where: { active: true, role: { code: 'ADMIN' } },
    include: { role: true },
  })
  if (!admin) throw new Error('未找到系统管理员账号，无法执行超时自动审批')
  return { userId: admin.id, role: admin.role.code }
}

export async function runApprovalSchedulerTick(prisma: PrismaClient) {
  const config = await getApprovalNotifyConfig(prisma)
  if (!config.schedulerEnabled) return { processed: 0 }

  const pending = await prisma.approvalTask.findMany({
    where: {
      status: 'PENDING',
      instance: { status: 'RUNNING' },
    },
    include: { instance: { include: { flow: true } } },
    take: 100,
  })

  const now = Date.now()
  let reminded = 0
  let autoHandled = 0

  for (const task of pending) {
    const graph = parseGraphSafe(task.instance.flow.graph)
    if (!graph) continue

    const node = graph.nodes.find((n) => n.id === task.nodeId)
    if (!node || node.type !== 'approval') continue

    const timing = resolveNodeTiming(node.data, config)
    const dueAt = task.dueAt?.getTime() ?? task.createdAt.getTime() + timing.timeoutHours * 3600_000
    const isOverdue = now >= dueAt

    if (isOverdue) {
      if (timing.onTimeout === 'approve' || timing.onTimeout === 'reject') {
        try {
          const actor = await getSystemActor(prisma)
          await completeApprovalTask(
            prisma,
            task.id,
            timing.onTimeout === 'approve' ? 'approved' : 'rejected',
            actor.userId,
            actor.role,
            timing.onTimeout === 'approve' ? '超时自动通过' : '超时自动驳回',
          )
          autoHandled++
        } catch (e) {
          console.warn('[approval-scheduler] auto', task.id, e instanceof Error ? e.message : e)
        }
        continue
      }
      if (task.remindCount < timing.maxRemindCount + 2) {
        const last = task.lastRemindedAt?.getTime() ?? 0
        if (now - last >= timing.remindIntervalHours * 3600_000) {
          await prisma.approvalTask.update({
            where: { id: task.id },
            data: { remindCount: { increment: 1 }, lastRemindedAt: new Date() },
          })
          if (config.enabled) await notifyApprovalTaskTimeout(prisma, task.id).catch(() => {})
          reminded++
        }
      }
      continue
    }

    const lastRemind = task.lastRemindedAt?.getTime() ?? task.createdAt.getTime()
    const remindDue = now - lastRemind >= timing.remindIntervalHours * 3600_000
    if (remindDue && task.remindCount < timing.maxRemindCount) {
      await prisma.approvalTask.update({
        where: { id: task.id },
        data: { remindCount: { increment: 1 }, lastRemindedAt: new Date() },
      })
      if (config.enabled) await notifyApprovalTaskRemind(prisma, task.id).catch(() => {})
      reminded++
    }
  }

  if (reminded || autoHandled) {
    console.log(`[approval-scheduler] reminded=${reminded} autoHandled=${autoHandled}`)
  }

  return { processed: pending.length, reminded, autoHandled }
}

let schedulerTimer: ReturnType<typeof setInterval> | null = null

export function startApprovalScheduler(prisma: PrismaClient, intervalMs = 5 * 60_000) {
  if (schedulerTimer) return
  const tick = () => {
    runApprovalSchedulerTick(prisma).catch((e) =>
      console.warn('[approval-scheduler]', e instanceof Error ? e.message : e),
    )
  }
  tick()
  schedulerTimer = setInterval(tick, intervalMs)
  console.log(`⏱️  Approval scheduler every ${intervalMs / 1000}s`)
}

export function stopApprovalScheduler() {
  if (schedulerTimer) clearInterval(schedulerTimer)
  schedulerTimer = null
}

// re-export parseGraph for scheduler - actually I imported parseGraph from approval.js but it's not exported. Used parseGraphSafe instead.
