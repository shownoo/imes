import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { Save } from 'lucide-react'
import { Button, Card, CardContent } from 'components/common'
import { SectionPanelHeader } from 'components/section-menu'
import { FormField } from 'components/form-page'
import { Input } from 'components/ui/input'
import { AppAboutPanel } from 'components/app-about-panel'
import { GET_ORG_LICENSEE, SET_ORG_LICENSEE } from 'lib/app-about-queries'

export default function DeploySettingsPage() {
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const { data, refetch } = useQuery(GET_ORG_LICENSEE)
  const [save, { loading }] = useMutation(SET_ORG_LICENSEE)

  useEffect(() => {
    const row = data?.getOrgLicensee as { name?: string } | undefined
    if (row?.name) setName(row.name)
  }, [data])

  const onSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    await save({ variables: { input: { name: trimmed } } })
    await refetch()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <SectionPanelHeader desc="配置「关于」中显示的客户方名称（Licensed to）。部署到新单位时请修改，开发单位与版权信息随产品安装包固定。" />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="font-medium">授权单位</h3>
          <div className="max-w-md space-y-4">
            <FormField label="授权单位名称" required>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSaved(false)
                }}
                placeholder="例如：武汉市应急物资保障中心"
              />
            </FormField>
            <Button onClick={() => void onSave()} disabled={loading || !name.trim()}>
              <Save className="size-4" />
              {saved ? '已保存' : '保存'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-3 font-medium">关于预览</h3>
          <AppAboutPanel className="rounded-lg border bg-muted/30 p-4" />
        </CardContent>
      </Card>
    </div>
  )
}
