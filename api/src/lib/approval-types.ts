export type FlowNodeType = 'start' | 'approval' | 'end'

export type TimeoutAction = 'remind' | 'approve' | 'reject'

export type FlowNodeData = {
  label: string
  role?: string
  mode?: 'any' | 'all'
  outcome?: 'approved' | 'rejected'
  /** 超时小时数，超时后执行 onTimeout */
  timeoutHours?: number
  /** 超时后动作：催办 / 自动通过 / 自动驳回 */
  onTimeout?: TimeoutAction
  /** 催办间隔（小时） */
  remindIntervalHours?: number
  /** 最大催办次数（超时前） */
  maxRemindCount?: number
}

export type FlowNode = {
  id: string
  type: FlowNodeType
  position: { x: number; y: number }
  data: FlowNodeData
}

export type FlowEdgeData = {
  label?: string
  action?: 'approved' | 'rejected'
}

export type FlowEdge = {
  id: string
  source: string
  target: string
  data?: FlowEdgeData
}

export type FlowGraph = {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export type TaskAction = 'approved' | 'rejected'

export type ApprovalNotifyConfig = {
  enabled: boolean
  appBaseUrl: string
  /** 钉钉 */
  dingtalkEnabled: boolean
  dingtalkWebhook: string
  /** 企业微信 */
  wecomEnabled: boolean
  wecomWebhook: string
  /** 飞书 */
  feishuEnabled: boolean
  feishuWebhook: string
  /** Slack */
  slackEnabled: boolean
  slackWebhook: string
  /** 通用 Webhook */
  genericEnabled: boolean
  genericWebhook: string
  /** 邮件 SMTP */
  emailEnabled: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  smtpPass: string
  smtpFrom: string
  emailExtraRecipients: string
  schedulerEnabled: boolean
  defaultTimeoutHours: number
  defaultRemindIntervalHours: number
  defaultMaxRemindCount: number
  defaultOnTimeout: TimeoutAction
}

export const DEFAULT_NOTIFY_CONFIG: ApprovalNotifyConfig = {
  enabled: false,
  appBaseUrl: 'http://localhost:5174',
  dingtalkEnabled: false,
  dingtalkWebhook: '',
  wecomEnabled: false,
  wecomWebhook: '',
  feishuEnabled: false,
  feishuWebhook: '',
  slackEnabled: false,
  slackWebhook: '',
  genericEnabled: false,
  genericWebhook: '',
  emailEnabled: false,
  smtpHost: '',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  emailExtraRecipients: '',
  schedulerEnabled: true,
  defaultTimeoutHours: 48,
  defaultRemindIntervalHours: 4,
  defaultMaxRemindCount: 5,
  defaultOnTimeout: 'remind',
}

export type ApprovalNotifyEvent = 'task_created' | 'task_remind' | 'task_timeout'

export type ApprovalNotifyPayload = {
  event: ApprovalNotifyEvent
  taskId: string
  bizType: string
  bizId: string
  bizLabel: string
  orderNo: string
  summary: string
  submitter: string
  nodeLabel: string
  assigneeRole: string
  docUrl: string
  dueAt?: Date | null
  remindCount?: number
  message: string
}
