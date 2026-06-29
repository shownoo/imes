import type { PrismaClient } from '@prisma/client'
import {
  DEFAULT_NOTIFY_CONFIG,
  type ApprovalNotifyConfig,
  type FlowNodeData,
  type TimeoutAction,
} from './approval-types.js'

const SETTING_KEY = 'approval_notify'

function hasActiveChannel(c: Partial<ApprovalNotifyConfig>) {
  return (
    (c.dingtalkEnabled && c.dingtalkWebhook) ||
    (c.wecomEnabled && c.wecomWebhook) ||
    (c.feishuEnabled && c.feishuWebhook) ||
    (c.slackEnabled && c.slackWebhook) ||
    (c.genericEnabled && c.genericWebhook) ||
    c.emailEnabled
  )
}

function migrateStored(stored: Partial<ApprovalNotifyConfig>): Partial<ApprovalNotifyConfig> {
  const m = { ...stored }
  if (stored.dingtalkWebhook && stored.dingtalkEnabled == null) m.dingtalkEnabled = true
  if (stored.wecomWebhook && stored.wecomEnabled == null) m.wecomEnabled = true
  return m
}

export async function getApprovalNotifyConfig(prisma: PrismaClient): Promise<ApprovalNotifyConfig> {
  const row = await prisma.systemSetting.findUnique({ where: { key: SETTING_KEY } })
  const stored = migrateStored((row?.value ?? {}) as Partial<ApprovalNotifyConfig>)
  const merged: ApprovalNotifyConfig = {
    ...DEFAULT_NOTIFY_CONFIG,
    ...stored,
    dingtalkWebhook: stored.dingtalkWebhook ?? process.env.DINGTALK_WEBHOOK ?? '',
    wecomWebhook: stored.wecomWebhook ?? process.env.WECOM_WEBHOOK ?? '',
    feishuWebhook: stored.feishuWebhook ?? process.env.FEISHU_WEBHOOK ?? '',
    slackWebhook: stored.slackWebhook ?? process.env.SLACK_WEBHOOK ?? '',
    genericWebhook: stored.genericWebhook ?? process.env.GENERIC_WEBHOOK ?? '',
    appBaseUrl: stored.appBaseUrl ?? process.env.APP_BASE_URL ?? DEFAULT_NOTIFY_CONFIG.appBaseUrl,
    smtpHost: stored.smtpHost ?? process.env.SMTP_HOST ?? '',
    smtpPort: stored.smtpPort ?? Number(process.env.SMTP_PORT ?? 465),
    smtpUser: stored.smtpUser ?? process.env.SMTP_USER ?? '',
    smtpPass: stored.smtpPass ?? process.env.SMTP_PASS ?? '',
    smtpFrom: stored.smtpFrom ?? process.env.SMTP_FROM ?? '',
    emailExtraRecipients: stored.emailExtraRecipients ?? process.env.EMAIL_RECIPIENTS ?? '',
  }
  if (process.env.DINGTALK_WEBHOOK && !stored.dingtalkEnabled) merged.dingtalkEnabled = true
  if (process.env.WECOM_WEBHOOK && !stored.wecomEnabled) merged.wecomEnabled = true
  if (process.env.FEISHU_WEBHOOK && !stored.feishuEnabled) merged.feishuEnabled = true
  if (stored.enabled == null) merged.enabled = Boolean(hasActiveChannel(merged))
  return merged
}

export async function saveApprovalNotifyConfig(prisma: PrismaClient, config: ApprovalNotifyConfig) {
  return prisma.systemSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: config as never },
    update: { value: config as never },
  })
}

export function resolveNodeTiming(
  nodeData: FlowNodeData,
  config: ApprovalNotifyConfig,
): {
  timeoutHours: number
  remindIntervalHours: number
  maxRemindCount: number
  onTimeout: TimeoutAction
} {
  return {
    timeoutHours: nodeData.timeoutHours ?? config.defaultTimeoutHours,
    remindIntervalHours: nodeData.remindIntervalHours ?? config.defaultRemindIntervalHours,
    maxRemindCount: nodeData.maxRemindCount ?? config.defaultMaxRemindCount,
    onTimeout: nodeData.onTimeout ?? config.defaultOnTimeout,
  }
}

export function calcDueAt(from: Date, timeoutHours: number): Date {
  return new Date(from.getTime() + timeoutHours * 3600_000)
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: '系统管理员',
  SUPERVISOR: '仓储主管',
  WAREHOUSE_KEEPER: '仓管员',
  VIEWER: '只读访客',
}

export function roleLabel(code?: string | null) {
  return code ? (ROLE_LABELS[code] ?? code) : '—'
}

export { SETTING_KEY }
