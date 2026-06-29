import type { ApprovalNotifyEvent, ApprovalNotifyPayload } from './approval-types.js'

export function eventTitle(event: ApprovalNotifyEvent) {
  return {
    task_created: '📋 新审批待办',
    task_remind: '⏰ 审批催办提醒',
    task_timeout: '🔔 审批超时提醒',
  }[event]
}

export function buildNotifyLines(payload: ApprovalNotifyPayload) {
  return [
    `- **类型**：${payload.bizLabel}`,
    `- **单号**：${payload.orderNo}`,
    `- **节点**：${payload.nodeLabel}（${payload.assigneeRole}）`,
    `- **摘要**：${payload.summary}`,
    `- **提交人**：${payload.submitter}`,
    payload.dueAt ? `- **截止**：${payload.dueAt.toLocaleString('zh-CN')}` : null,
    payload.remindCount != null ? `- **已催办**：${payload.remindCount} 次` : null,
    '',
    payload.message,
  ].filter(Boolean) as string[]
}

export function markdownBody(payload: ApprovalNotifyPayload) {
  return [`### ${eventTitle(payload.event)}`, ...buildNotifyLines(payload), '', `[立即处理](${payload.docUrl})`].join('\n')
}

export function plainTextBody(payload: ApprovalNotifyPayload) {
  return [
    eventTitle(payload.event),
    ...buildNotifyLines(payload).map((l) => l.replace(/\*\*/g, '')),
    '',
    `立即处理：${payload.docUrl}`,
  ].join('\n')
}

export function genericWebhookBody(payload: ApprovalNotifyPayload) {
  return {
    source: 'imes',
    version: 1,
    event: payload.event,
    title: eventTitle(payload.event),
    text: plainTextBody(payload),
    markdown: markdownBody(payload),
    link: payload.docUrl,
    payload: {
      ...payload,
      dueAt: payload.dueAt?.toISOString() ?? null,
    },
  }
}

export function testPayload(appBaseUrl: string): ApprovalNotifyPayload {
  return {
    event: 'task_created',
    taskId: 'test',
    bizType: 'outbound',
    bizId: 'test',
    bizLabel: '物资出库',
    orderNo: 'OUT-TEST-001',
    summary: '这是一条测试通知',
    submitter: '系统',
    nodeLabel: '主管审批',
    assigneeRole: '仓储主管',
    docUrl: `${appBaseUrl.replace(/\/$/, '')}/tasks`,
    message: 'IMES 审批通知通道测试成功，可正常接收待办提醒。',
  }
}
