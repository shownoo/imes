import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { HardDrive, Save } from 'lucide-react'
import { Button, Card, CardContent } from 'components/common'
import { SectionPanelHeader } from 'components/section-menu'
import { FormField } from 'components/form-page'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import {
  GET_UPLOAD_SETTINGS,
  SAVE_UPLOAD_SETTINGS,
  UPLOAD_MODE_OPTIONS,
  STORAGE_PROVIDER_OPTIONS,
  defaultUploadSettings,
  type UploadSettings,
  type UploadMode,
} from './queries'

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-4 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      {children}
    </span>
  )
}

export default function UploadSettingsPage() {
  const [form, setForm] = useState<UploadSettings>(defaultUploadSettings())
  const [saved, setSaved] = useState(false)
  const { data, refetch } = useQuery(GET_UPLOAD_SETTINGS)
  const [saveSettings, { loading: saving }] = useMutation(SAVE_UPLOAD_SETTINGS)

  useEffect(() => {
    const s = data?.getUploadSettings as UploadSettings | undefined
    if (s) setForm({ ...defaultUploadSettings(), ...s })
  }, [data])

  const patch = (p: Partial<UploadSettings>) => {
    setForm((f) => ({ ...f, ...p }))
    setSaved(false)
  }

  const showCloudFields = form.uploadMode !== 'local' && form.uploadMode !== 'off'
  const showEndpoint =
    form.storageProvider === 's3' || form.storageProvider === 'minio'
  const showLegacyCos =
    showCloudFields &&
    (form.uploadMode === 'cos' || form.uploadMode === 'auto') &&
    form.storageProvider === 'cos'

  const handleSave = async () => {
    try {
      const { uploadStatusText, uploadEnabled, uploadProvider, uploadSecretsConfigured, ...input } = form
      await saveSettings({ variables: { input } })
      setSaved(true)
      refetch()
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  return (
    <div>
      <SectionPanelHeader
        desc="配置附件上传方式：默认本机存储，也可接入腾讯云 COS 等云存储"
        action={
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {saved ? '已保存' : '保存配置'}
          </Button>
        }
      />

      {form.uploadStatusText ? <StatusPill>{form.uploadStatusText}</StatusPill> : null}

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h3 className="font-medium">文件大小限制</h3>
          <p className="text-xs text-muted-foreground">
            控制上传图片与其他附件的单文件大小上限，保存后立即生效。
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="图片上限 (MB)">
              <Input
                type="number"
                min={1}
                max={50}
                value={form.maxImageMB}
                onChange={(e) => patch({ maxImageMB: Number(e.target.value) || 2 })}
              />
            </FormField>
            <FormField label="其他文件上限 (MB)">
              <Input
                type="number"
                min={1}
                max={100}
                value={form.maxFileMB}
                onChange={(e) => patch({ maxFileMB: Number(e.target.value) || 10 })}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 font-medium">
            <HardDrive className="size-4" /> 上传模式
          </h3>
          <FormField label="存储策略">
            <Select
              value={form.uploadMode}
              onValueChange={(v) => patch({ uploadMode: v as UploadMode })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UPLOAD_MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {UPLOAD_MODE_OPTIONS.find((o) => o.value === form.uploadMode)?.desc ? (
            <p className="text-xs text-muted-foreground">
              {UPLOAD_MODE_OPTIONS.find((o) => o.value === form.uploadMode)?.desc}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            当前生效：{form.uploadProvider || '—'} · {form.uploadEnabled ? '可用' : '不可用'}
          </p>
        </CardContent>
      </Card>

      {showCloudFields ? (
        <Card className="mb-6">
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-medium">云存储配置</h3>
            <FormField label="存储服务商">
              <Select
                value={form.storageProvider}
                onValueChange={(v) => patch({ storageProvider: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STORAGE_PROVIDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="AccessKey / SecretId">
              <Input
                value={form.storageAccessKey}
                onChange={(e) => patch({ storageAccessKey: e.target.value })}
                placeholder="访问密钥 ID"
                autoComplete="off"
              />
            </FormField>
            <FormField label="SecretKey">
              <Input
                type="password"
                value={form.storageSecretKey}
                onChange={(e) => patch({ storageSecretKey: e.target.value })}
                placeholder="留空表示不修改已保存的密钥"
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="存储桶名称">
              <Input
                value={form.storageBucket}
                onChange={(e) => patch({ storageBucket: e.target.value })}
                placeholder="Bucket 名称"
              />
            </FormField>
            <FormField label="区域（可选）">
              <Input
                value={form.storageRegion}
                onChange={(e) => patch({ storageRegion: e.target.value })}
                placeholder="留空使用默认区域，如 ap-guangzhou"
              />
            </FormField>
            {showEndpoint ? (
              <FormField label="Endpoint（S3 / MinIO）">
                <Input
                  value={form.storageEndpoint}
                  onChange={(e) => patch({ storageEndpoint: e.target.value })}
                  placeholder="https://s3.amazonaws.com 或 MinIO 地址"
                />
              </FormField>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {showLegacyCos ? (
        <Card className="mb-6">
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-medium">腾讯云 COS（环境变量兼容）</h3>
            <p className="text-xs text-muted-foreground">
              也可在服务端 <code className="rounded bg-muted px-1">.env</code> 中配置
              COS_SECRETID / COS_SECRETKEY；密钥请勿写入数据库。
              {form.uploadSecretsConfigured ? ' · 环境变量密钥已配置' : ' · 环境变量密钥未配置'}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="AppId">
                <Input
                  value={form.cosAppId}
                  onChange={(e) => patch({ cosAppId: e.target.value })}
                  placeholder="1250000000"
                />
              </FormField>
              <FormField label="普通桶">
                <Input
                  value={form.cosNormalBucket}
                  onChange={(e) => patch({ cosNormalBucket: e.target.value })}
                  placeholder="bucket-name"
                />
              </FormField>
              <FormField label="安全桶">
                <Input
                  value={form.cosSafeBucket}
                  onChange={(e) => patch({ cosSafeBucket: e.target.value })}
                  placeholder="bucket-name-safe"
                />
              </FormField>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {form.uploadMode === 'local' || form.uploadMode === 'auto' ? (
        <Card>
          <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
            <h3 className="font-medium text-foreground">本机存储说明</h3>
            <p>文件默认保存在 API 服务目录下的 <code className="rounded bg-muted px-1">uploads/</code>（可通过环境变量 UPLOAD_LOCAL_DIR 修改）。</p>
            <p>上传接口：<code className="rounded bg-muted px-1">POST /files/upload</code> · 访问：<code className="rounded bg-muted px-1">GET /files/:key</code></p>
            <p>单文件大小上限见上方「文件大小限制」配置（图片默认 2MB，其他文件默认 10MB）。</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
