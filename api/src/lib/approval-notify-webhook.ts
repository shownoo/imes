/** @deprecated 使用 approval-notify-channels.js */
export {
  sendDingTalkWebhook,
  sendWeComWebhook,
  dispatchWebhooks,
  sendTestNotifyChannel,
  NOTIFY_CHANNEL_META,
  type NotifyChannelId,
} from './approval-notify-channels.js'

export async function sendTestWebhook(
  channel: 'dingtalk' | 'wecom' | 'feishu' | 'slack' | 'generic' | 'email',
  webhook: string,
  appBaseUrl: string,
  config?: import('./approval-types.js').ApprovalNotifyConfig,
) {
  const { sendTestNotifyChannel } = await import('./approval-notify-channels.js')
  const { DEFAULT_NOTIFY_CONFIG } = await import('./approval-types.js')
  await sendTestNotifyChannel(channel, config ?? DEFAULT_NOTIFY_CONFIG, {
    webhook: channel === 'email' ? undefined : webhook,
    appBaseUrl,
    emailTo: channel === 'email' ? webhook : undefined,
  })
}
