import { gql } from '@apollo/client'

export const GET_NOTIFY_SETTINGS = gql`query GetApprovalNotifySettings { getApprovalNotifySettings }`
export const GET_NOTIFY_CHANNELS = gql`query GetApprovalNotifyChannels { getApprovalNotifyChannels }`
export const SAVE_NOTIFY_SETTINGS = gql`
  mutation SaveApprovalNotifySettings($input: SaveApprovalNotifyInput!) {
    saveApprovalNotifySettings(input: $input)
  }
`
export const TEST_WEBHOOK = gql`
  mutation TestApprovalNotifyWebhook($channel: String!, $webhook: String, $appBaseUrl: String, $emailTo: String) {
    testApprovalNotifyWebhook(channel: $channel, webhook: $webhook, appBaseUrl: $appBaseUrl, emailTo: $emailTo)
  }
`
export const RUN_SCHEDULER = gql`mutation RunApprovalSchedulerNow { runApprovalSchedulerNow }`

export type NotifySettings = {
  enabled: boolean
  appBaseUrl: string
  dingtalkEnabled: boolean
  dingtalkWebhook: string
  wecomEnabled: boolean
  wecomWebhook: string
  feishuEnabled: boolean
  feishuWebhook: string
  slackEnabled: boolean
  slackWebhook: string
  genericEnabled: boolean
  genericWebhook: string
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
  defaultOnTimeout: 'remind' | 'approve' | 'reject'
}

export const defaultNotifySettings = (): NotifySettings => ({
  enabled: false,
  appBaseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174',
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
})

export type WebhookChannel = 'dingtalk' | 'wecom' | 'feishu' | 'slack' | 'generic'

export const WEBHOOK_CHANNELS: Array<{
  id: WebhookChannel
  label: string
  desc: string
  enabledKey: keyof NotifySettings
  webhookKey: keyof NotifySettings
  placeholder: string
}> = [
  {
    id: 'dingtalk',
    label: '钉钉',
    desc: '群机器人 Webhook',
    enabledKey: 'dingtalkEnabled',
    webhookKey: 'dingtalkWebhook',
    placeholder: 'https://oapi.dingtalk.com/robot/send?access_token=...',
  },
  {
    id: 'wecom',
    label: '企业微信',
    desc: '群机器人 Webhook',
    enabledKey: 'wecomEnabled',
    webhookKey: 'wecomWebhook',
    placeholder: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...',
  },
  {
    id: 'feishu',
    label: '飞书',
    desc: '群机器人 Webhook',
    enabledKey: 'feishuEnabled',
    webhookKey: 'feishuWebhook',
    placeholder: 'https://open.feishu.cn/open-apis/bot/v2/hook/...',
  },
  {
    id: 'slack',
    label: 'Slack',
    desc: 'Incoming Webhook',
    enabledKey: 'slackEnabled',
    webhookKey: 'slackWebhook',
    placeholder: 'https://hooks.slack.com/services/...',
  },
  {
    id: 'generic',
    label: '通用 Webhook',
    desc: 'n8n / 自建集成',
    enabledKey: 'genericEnabled',
    webhookKey: 'genericWebhook',
    placeholder: 'https://your-server.com/hooks/imes',
  },
]
