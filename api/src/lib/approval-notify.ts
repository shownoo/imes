import type { PrismaClient } from '@prisma/client'
import type { ApprovalNotifyEvent, ApprovalNotifyPayload } from './approval-types.js'
import { enrichPendingTasks } from './approval.js'
import { getApprovalNotifyConfig, roleLabel } from './approval-notify-config.js'
import { dispatchAllNotifyChannels } from './approval-notify-channels.js'

const BIZ_LABEL: Record<string, string> = {
  outbound: '物资出库',
  inbound: '采购入库',
}

const EVENT_MSG: Record<ApprovalNotifyEvent, string> = {
  task_created: '有新的审批任务等待您处理，请及时登录 IMES 办理。',
  task_remind: '该审批任务尚未处理，请尽快完成审核。',
  task_timeout: '该审批任务已超过截止时间，系统将按流程配置自动处理或继续催办。',
}

const notifyQueue: string[] = []
let flushing = false

export function queueApprovalTaskNotify(taskId: string) {
  if (!notifyQueue.includes(taskId)) notifyQueue.push(taskId)
}

export async function flushApprovalNotifies(prisma: PrismaClient) {
  if (flushing || notifyQueue.length === 0) return
  flushing = true
  const ids = notifyQueue.splice(0)
  try {
    for (const id of ids) {
      await notifyApprovalTask(prisma, id, 'task_created').catch((e) =>
        console.warn('[approval-notify]', id, e instanceof Error ? e.message : e),
      )
    }
  } finally {
    flushing = false
  }
}

async function resolveEmailRecipients(
  prisma: PrismaClient,
  assigneeRole: string | null | undefined,
  extra: string,
) {
  const list = extra
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!assigneeRole) return [...new Set(list)]

  const users = await prisma.user.findMany({
    where: {
      active: true,
      email: { not: null },
      role: { code: assigneeRole },
    },
    select: { email: true },
  })
  const fromUsers = users.map((u) => u.email!).filter(Boolean)
  return [...new Set([...fromUsers, ...list])]
}

export async function notifyApprovalTask(
  prisma: PrismaClient,
  taskId: string,
  event: ApprovalNotifyEvent,
) {
  const config = await getApprovalNotifyConfig(prisma)
  if (!config.enabled) return { skipped: true }

  const task = await prisma.approvalTask.findUnique({
    where: { id: taskId },
    include: { instance: { include: { flow: true } } },
  })
  if (!task || task.status !== 'PENDING') return { skipped: true }

  const [enriched] = await enrichPendingTasks(prisma, [task])
  if (!enriched) return { skipped: true }

  const base = config.appBaseUrl.replace(/\/$/, '')
  const payload: ApprovalNotifyPayload = {
    event,
    taskId: task.id,
    bizType: enriched.bizType,
    bizId: enriched.bizId,
    bizLabel: enriched.bizLabel ?? BIZ_LABEL[enriched.bizType] ?? enriched.bizType,
    orderNo: enriched.orderNo,
    summary: enriched.summary,
    submitter: enriched.submitter,
    nodeLabel: enriched.nodeLabel ?? '审批',
    assigneeRole: roleLabel(enriched.assigneeRole),
    docUrl: `${base}${enriched.docPath}`,
    dueAt: task.dueAt,
    remindCount: task.remindCount,
    message: EVENT_MSG[event],
  }

  const emailRecipients = await resolveEmailRecipients(
    prisma,
    task.assigneeRole,
    config.emailExtraRecipients,
  )
  const results = await dispatchAllNotifyChannels(config, payload, emailRecipients)
  return { sent: true, results }
}

export async function notifyApprovalTaskRemind(prisma: PrismaClient, taskId: string) {
  return notifyApprovalTask(prisma, taskId, 'task_remind')
}

export async function notifyApprovalTaskTimeout(prisma: PrismaClient, taskId: string) {
  return notifyApprovalTask(prisma, taskId, 'task_timeout')
}
