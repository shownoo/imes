import { builder } from '../builder.js'
import { DEFAULT_NOTIFY_CONFIG, type ApprovalNotifyConfig } from '../lib/approval-types.js'
import {
  getApprovalNotifyConfig,
  saveApprovalNotifyConfig,
} from '../lib/approval-notify-config.js'
import { sendTestNotifyChannel, type NotifyChannelId } from '../lib/approval-notify-channels.js'
import { runApprovalSchedulerTick } from '../lib/approval-scheduler.js'

const SaveApprovalNotifyInput = builder.inputType('SaveApprovalNotifyInput', {
  fields: (t) => ({
    enabled: t.boolean({ required: true }),
    appBaseUrl: t.string({ required: true }),
    dingtalkEnabled: t.boolean({ required: true }),
    dingtalkWebhook: t.string({ required: false }),
    wecomEnabled: t.boolean({ required: true }),
    wecomWebhook: t.string({ required: false }),
    feishuEnabled: t.boolean({ required: true }),
    feishuWebhook: t.string({ required: false }),
    slackEnabled: t.boolean({ required: true }),
    slackWebhook: t.string({ required: false }),
    genericEnabled: t.boolean({ required: true }),
    genericWebhook: t.string({ required: false }),
    emailEnabled: t.boolean({ required: true }),
    smtpHost: t.string({ required: false }),
    smtpPort: t.int({ required: true }),
    smtpSecure: t.boolean({ required: true }),
    smtpUser: t.string({ required: false }),
    smtpPass: t.string({ required: false }),
    smtpFrom: t.string({ required: false }),
    emailExtraRecipients: t.string({ required: false }),
    schedulerEnabled: t.boolean({ required: true }),
    defaultTimeoutHours: t.int({ required: true }),
    defaultRemindIntervalHours: t.int({ required: true }),
    defaultMaxRemindCount: t.int({ required: true }),
    defaultOnTimeout: t.string({ required: true }),
  }),
})

function normalizeConfig(input: typeof DEFAULT_NOTIFY_CONFIG): ApprovalNotifyConfig {
  return {
    ...DEFAULT_NOTIFY_CONFIG,
    ...input,
    dingtalkWebhook: input.dingtalkWebhook ?? '',
    wecomWebhook: input.wecomWebhook ?? '',
    feishuWebhook: input.feishuWebhook ?? '',
    slackWebhook: input.slackWebhook ?? '',
    genericWebhook: input.genericWebhook ?? '',
    smtpHost: input.smtpHost ?? '',
    smtpUser: input.smtpUser ?? '',
    smtpPass: input.smtpPass ?? '',
    smtpFrom: input.smtpFrom ?? '',
    emailExtraRecipients: input.emailExtraRecipients ?? '',
    defaultOnTimeout: (input.defaultOnTimeout as ApprovalNotifyConfig['defaultOnTimeout']) ?? 'remind',
  }
}

builder.queryField('getApprovalNotifySettings', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    resolve: async (_, __, ctx) => getApprovalNotifyConfig(ctx.prisma),
  }),
)

builder.mutationField('saveApprovalNotifySettings', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: SaveApprovalNotifyInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const config = normalizeConfig(input as ApprovalNotifyConfig)
      await saveApprovalNotifyConfig(ctx.prisma, config)
      return config
    },
  }),
)

builder.mutationField('testApprovalNotifyWebhook', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: {
      channel: t.arg.string({ required: true }),
      webhook: t.arg.string({ required: false }),
      appBaseUrl: t.arg.string({ required: false }),
      emailTo: t.arg.string({ required: false }),
    },
    resolve: async (_, { channel, webhook, appBaseUrl, emailTo }, ctx) => {
      const config = await getApprovalNotifyConfig(ctx.prisma)
      const ch = channel as NotifyChannelId
      await sendTestNotifyChannel(ch, config, {
        webhook: webhook ?? undefined,
        appBaseUrl: appBaseUrl ?? config.appBaseUrl,
        emailTo: emailTo ?? undefined,
      })
      return { ok: true, channel: ch }
    },
  }),
)

builder.mutationField('runApprovalSchedulerNow', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    resolve: async (_, __, ctx) => runApprovalSchedulerTick(ctx.prisma),
  }),
)

builder.queryField('getApprovalNotifyChannels', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    resolve: async () => {
      const { NOTIFY_CHANNEL_META } = await import('../lib/approval-notify-channels.js')
      return Object.entries(NOTIFY_CHANNEL_META).map(([id, meta]) => ({ id, ...meta }))
    },
  }),
)
