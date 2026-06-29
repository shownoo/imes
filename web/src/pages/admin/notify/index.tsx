import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { Bell, Mail, Save, Send } from 'lucide-react'
import { Button, Card, CardContent } from 'components/common'
import { SectionPanelHeader } from 'components/section-menu'
import { FormField } from 'components/form-page'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import {
  GET_NOTIFY_SETTINGS,
  SAVE_NOTIFY_SETTINGS,
  TEST_WEBHOOK,
  RUN_SCHEDULER,
  WEBHOOK_CHANNELS,
  defaultNotifySettings,
  type NotifySettings,
  type WebhookChannel,
} from './queries'

export default function NotifySettingsPage() {
  const [form, setForm] = useState<NotifySettings>(defaultNotifySettings())
  const [saved, setSaved] = useState(false)
  const { data, refetch } = useQuery(GET_NOTIFY_SETTINGS)
  const [saveSettings, { loading: saving }] = useMutation(SAVE_NOTIFY_SETTINGS)
  const [testWebhook] = useMutation(TEST_WEBHOOK)
  const [runScheduler, { loading: running }] = useMutation(RUN_SCHEDULER)

  useEffect(() => {
    const s = data?.getApprovalNotifySettings as NotifySettings | undefined
    if (s) setForm({ ...defaultNotifySettings(), ...s })
  }, [data])

  const patch = (p: Partial<NotifySettings>) => {
    setForm((f) => ({ ...f, ...p }))
    setSaved(false)
  }

  const handleSave = async () => {
    try {
      await saveSettings({ variables: { input: form } })
      setSaved(true)
      refetch()
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  const handleTestWebhook = async (channel: WebhookChannel) => {
    const meta = WEBHOOK_CHANNELS.find((c) => c.id === channel)!
    const webhook = String(form[meta.webhookKey] ?? '').trim()
    if (!webhook) {
      alert('请先填写 Webhook 地址')
      return
    }
    try {
      await saveSettings({ variables: { input: form } })
      await testWebhook({ variables: { channel, webhook, appBaseUrl: form.appBaseUrl } })
      alert('测试消息已发送')
    } catch (e) {
      alert(e instanceof Error ? e.message : '发送失败')
    }
  }

  const handleTestEmail = async () => {
    const emailTo = form.emailExtraRecipients.trim()
    if (!emailTo) {
      alert('请填写额外收件人（测试用）')
      return
    }
    if (!form.smtpHost) {
      alert('请填写 SMTP 主机')
      return
    }
    try {
      await saveSettings({ variables: { input: form } })
      await testWebhook({ variables: { channel: 'email', emailTo, appBaseUrl: form.appBaseUrl } })
      alert('测试邮件已发送')
    } catch (e) {
      alert(e instanceof Error ? e.message : '发送失败')
    }
  }

  return (
    <div>
      <SectionPanelHeader
        desc="接入钉钉、企业微信、飞书、Slack、邮件 SMTP、通用 Webhook 等主流通知平台"
        action={
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {saved ? '已保存' : '保存配置'}
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.enabled} onChange={(e) => patch({ enabled: e.target.checked })} />
            启用外部通知（新待办 / 催办 / 超时）
          </label>
          <FormField label="前端访问地址（通知内跳转链接）">
            <Input value={form.appBaseUrl} onChange={(e) => patch({ appBaseUrl: e.target.value })} placeholder="http://localhost:5174" />
          </FormField>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {WEBHOOK_CHANNELS.map((ch) => (
          <Card key={ch.id}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{ch.label}</h3>
                  <p className="text-xs text-muted-foreground">{ch.desc}</p>
                </div>
                <label className="flex shrink-0 items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(form[ch.enabledKey])}
                    onChange={(e) => patch({ [ch.enabledKey]: e.target.checked } as Partial<NotifySettings>)}
                  />
                  启用
                </label>
              </div>
              <Input
                value={String(form[ch.webhookKey] ?? '')}
                onChange={(e) => patch({ [ch.webhookKey]: e.target.value } as Partial<NotifySettings>)}
                placeholder={ch.placeholder}
              />
              <Button variant="outline" size="sm" onClick={() => handleTestWebhook(ch.id)}>
                <Send className="size-3.5" /> 发送测试
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="flex items-center gap-2 font-medium">
              <Mail className="size-4" /> 邮件 SMTP
            </h3>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.emailEnabled} onChange={(e) => patch({ emailEnabled: e.target.checked })} />
              启用邮件通知（按审批角色匹配用户邮箱 + 额外收件人）
            </label>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="SMTP 主机">
                <Input value={form.smtpHost} onChange={(e) => patch({ smtpHost: e.target.value })} placeholder="smtp.example.com" />
              </FormField>
              <FormField label="端口">
                <Input type="number" value={form.smtpPort} onChange={(e) => patch({ smtpPort: Number(e.target.value) })} />
              </FormField>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.smtpSecure} onChange={(e) => patch({ smtpSecure: e.target.checked })} />
              SSL/TLS（465 端口通常勾选）
            </label>
            <FormField label="用户名">
              <Input value={form.smtpUser} onChange={(e) => patch({ smtpUser: e.target.value })} autoComplete="off" />
            </FormField>
            <FormField label="密码 / 授权码">
              <Input type="password" value={form.smtpPass} onChange={(e) => patch({ smtpPass: e.target.value })} autoComplete="new-password" />
            </FormField>
            <FormField label="发件人地址">
              <Input value={form.smtpFrom} onChange={(e) => patch({ smtpFrom: e.target.value })} placeholder="imes@example.com" />
            </FormField>
            <FormField label="额外收件人（逗号分隔，用于测试或抄送）">
              <Input value={form.emailExtraRecipients} onChange={(e) => patch({ emailExtraRecipients: e.target.value })} placeholder="supervisor@example.com,admin@example.com" />
            </FormField>
            <Button variant="outline" size="sm" onClick={handleTestEmail}>
              <Send className="size-3.5" /> 发送测试邮件
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="flex items-center gap-2 font-medium">
              <Bell className="size-4" /> 超时与催办
            </h3>
            <p className="text-xs text-muted-foreground">可在「审批流程」各节点单独覆盖；定时任务每 5 分钟扫描。</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.schedulerEnabled} onChange={(e) => patch({ schedulerEnabled: e.target.checked })} />
              启用超时扫描定时任务
            </label>
            <FormField label="超时时间（小时）">
              <Input type="number" min={1} value={form.defaultTimeoutHours} onChange={(e) => patch({ defaultTimeoutHours: Number(e.target.value) })} />
            </FormField>
            <FormField label="催办间隔（小时）">
              <Input type="number" min={1} value={form.defaultRemindIntervalHours} onChange={(e) => patch({ defaultRemindIntervalHours: Number(e.target.value) })} />
            </FormField>
            <FormField label="最大催办次数">
              <Input type="number" min={0} value={form.defaultMaxRemindCount} onChange={(e) => patch({ defaultMaxRemindCount: Number(e.target.value) })} />
            </FormField>
            <FormField label="超时后动作">
              <Select value={form.defaultOnTimeout} onValueChange={(v) => patch({ defaultOnTimeout: v as NotifySettings['defaultOnTimeout'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remind">继续催办</SelectItem>
                  <SelectItem value="approve">自动通过</SelectItem>
                  <SelectItem value="reject">自动驳回</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <Button variant="outline" size="sm" disabled={running} onClick={async () => {
              try {
                const r = await runScheduler()
                alert(JSON.stringify(r.data?.runApprovalSchedulerNow))
              } catch (e) {
                alert(e instanceof Error ? e.message : '执行失败')
              }
            }}>
              立即执行一次超时扫描
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
