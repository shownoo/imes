import type { ApprovalNotifyConfig, ApprovalNotifyPayload } from './approval-types.js'
import {
  eventTitle,
  genericWebhookBody,
  markdownBody,
  plainTextBody,
} from './approval-notify-message.js'

export type NotifyChannelId =
  | 'dingtalk'
  | 'wecom'
  | 'feishu'
  | 'slack'
  | 'generic'
  | 'email'

export const NOTIFY_CHANNEL_META: Record<
  NotifyChannelId,
  { label: string; desc: string; placeholder?: string }
> = {
  dingtalk: {
    label: '钉钉',
    desc: '群机器人 Webhook',
    placeholder: 'https://oapi.dingtalk.com/robot/send?access_token=...',
  },
  wecom: {
    label: '企业微信',
    desc: '群机器人 Webhook',
    placeholder: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...',
  },
  feishu: {
    label: '飞书',
    desc: '群机器人 Webhook',
    placeholder: 'https://open.feishu.cn/open-apis/bot/v2/hook/...',
  },
  slack: {
    label: 'Slack',
    desc: 'Incoming Webhook',
    placeholder: 'https://hooks.slack.com/services/...',
  },
  generic: {
    label: '通用 Webhook',
    desc: 'n8n / 自建集成，接收标准 JSON',
    placeholder: 'https://your-server.com/hooks/imes',
  },
  email: {
    label: '邮件 SMTP',
    desc: '邮件通知审批角色对应账号',
  },
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = (await res.json().catch(() => ({}))) as {
    errcode?: number
    errmsg?: string
    code?: number
    msg?: string
  }
  if (data.errcode != null && data.errcode !== 0) {
    throw new Error(data.errmsg ?? `errcode ${data.errcode}`)
  }
  if (data.code != null && data.code !== 0) {
    throw new Error(data.msg ?? `code ${data.code}`)
  }
}

export async function sendDingTalk(webhook: string, payload: ApprovalNotifyPayload) {
  await postJson(webhook, {
    msgtype: 'markdown',
    markdown: { title: 'IMES 审批通知', text: markdownBody(payload) },
  })
}

export async function sendWeCom(webhook: string, payload: ApprovalNotifyPayload) {
  await postJson(webhook, {
    msgtype: 'markdown',
    markdown: { content: markdownBody(payload) },
  })
}

export async function sendFeishu(webhook: string, payload: ApprovalNotifyPayload) {
  const title = eventTitle(payload.event)
  const md = markdownBody(payload)
  await postJson(webhook, {
    msg_type: 'interactive',
    card: {
      header: { title: { tag: 'plain_text', content: title } },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: md } },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: { tag: 'plain_text', content: '立即处理' },
              url: payload.docUrl,
              type: 'primary',
            },
          ],
        },
      ],
    },
  })
}

export async function sendSlack(webhook: string, payload: ApprovalNotifyPayload) {
  await postJson(webhook, {
    text: eventTitle(payload.event),
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: eventTitle(payload.event) },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: markdownBody(payload) },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '立即处理' },
            url: payload.docUrl,
          },
        ],
      },
    ],
  })
}

export async function sendGenericWebhook(webhook: string, payload: ApprovalNotifyPayload) {
  await postJson(webhook, genericWebhookBody(payload))
}

export async function sendEmailSmtp(
  config: ApprovalNotifyConfig,
  payload: ApprovalNotifyPayload,
  recipients: string[],
) {
  if (!recipients.length) throw new Error('无邮件收件人')
  const { createTransport } = await import('nodemailer')
  const transport = createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
  })
  await transport.sendMail({
    from: config.smtpFrom || config.smtpUser,
    to: recipients.join(','),
    subject: `[IMES] ${eventTitle(payload.event)} · ${payload.orderNo}`,
    text: plainTextBody(payload),
    html: `<pre style="font-family:sans-serif;line-height:1.6">${plainTextBody(payload).replace(/\n/g, '<br>')}</pre><p><a href="${payload.docUrl}">立即处理</a></p>`,
  })
}

export async function dispatchNotifyChannel(
  channel: NotifyChannelId,
  config: ApprovalNotifyConfig,
  payload: ApprovalNotifyPayload,
  emailRecipients: string[],
) {
  switch (channel) {
    case 'dingtalk':
      if (config.dingtalkEnabled && config.dingtalkWebhook) await sendDingTalk(config.dingtalkWebhook, payload)
      break
    case 'wecom':
      if (config.wecomEnabled && config.wecomWebhook) await sendWeCom(config.wecomWebhook, payload)
      break
    case 'feishu':
      if (config.feishuEnabled && config.feishuWebhook) await sendFeishu(config.feishuWebhook, payload)
      break
    case 'slack':
      if (config.slackEnabled && config.slackWebhook) await sendSlack(config.slackWebhook, payload)
      break
    case 'generic':
      if (config.genericEnabled && config.genericWebhook) await sendGenericWebhook(config.genericWebhook, payload)
      break
    case 'email':
      if (config.emailEnabled) await sendEmailSmtp(config, payload, emailRecipients)
      break
  }
}

export async function dispatchAllNotifyChannels(
  config: ApprovalNotifyConfig,
  payload: ApprovalNotifyPayload,
  emailRecipients: string[],
) {
  const channels: NotifyChannelId[] = ['dingtalk', 'wecom', 'feishu', 'slack', 'generic', 'email']
  const results: string[] = []
  for (const ch of channels) {
    const enabled =
      ch === 'email'
        ? config.emailEnabled
        : ch === 'dingtalk'
          ? config.dingtalkEnabled && config.dingtalkWebhook
          : ch === 'wecom'
            ? config.wecomEnabled && config.wecomWebhook
            : ch === 'feishu'
              ? config.feishuEnabled && config.feishuWebhook
              : ch === 'slack'
                ? config.slackEnabled && config.slackWebhook
                : config.genericEnabled && config.genericWebhook
    if (!enabled) continue
    try {
      await dispatchNotifyChannel(ch, config, payload, emailRecipients)
      results.push(`${ch}:ok`)
    } catch (e) {
      results.push(`${ch}:${e instanceof Error ? e.message : 'fail'}`)
    }
  }
  return results
}

export async function sendTestNotifyChannel(
  channel: NotifyChannelId,
  config: ApprovalNotifyConfig,
  opts?: { webhook?: string; appBaseUrl?: string; emailTo?: string },
) {
  const { testPayload } = await import('./approval-notify-message.js')
  const payload = testPayload(opts?.appBaseUrl ?? config.appBaseUrl)

  switch (channel) {
    case 'dingtalk':
      await sendDingTalk(opts?.webhook ?? config.dingtalkWebhook, payload)
      break
    case 'wecom':
      await sendWeCom(opts?.webhook ?? config.wecomWebhook, payload)
      break
    case 'feishu':
      await sendFeishu(opts?.webhook ?? config.feishuWebhook, payload)
      break
    case 'slack':
      await sendSlack(opts?.webhook ?? config.slackWebhook, payload)
      break
    case 'generic':
      await sendGenericWebhook(opts?.webhook ?? config.genericWebhook, payload)
      break
    case 'email': {
      const recipients = (opts?.emailTo ?? config.emailExtraRecipients)
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean)
      await sendEmailSmtp(config, payload, recipients)
      break
    }
    default:
      throw new Error(`未知通道 ${channel}`)
  }
}

export {
  sendDingTalk as sendDingTalkWebhook,
  sendWeCom as sendWeComWebhook,
  dispatchAllNotifyChannels as dispatchWebhooks,
}
