import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { useWorkspace } from 'contexts/workspace-context'
import { AppearanceCatalogSection } from 'pages/workspace/appearance-catalog'
import { LayoutSection } from 'pages/workspace/layout-section'
import { PageHeader, Button, Card, CardContent, CardHeader, CardTitle } from 'components/common'
import { WorkspaceWidgetPanel } from 'components/workspace-widget-panel'
import { useLeaderVi } from 'hooks/use-leader-vi'

export default function WorkspaceSettings() {
  const { resetAll } = useWorkspace()
  const { isLight } = useLeaderVi()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <div className="space-y-10">
      <PageHeader
        title="账号设置"
        desc="界面风格、内容区布局与工作台模块等个人偏好，保存在本机浏览器"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="size-4" /> 恢复全部默认
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">返回工作台</Link>
            </Button>
          </div>
        }
      />

      <LayoutSection />

      <AppearanceCatalogSection />

      <section id="widgets">
        <Card className="leader-panel-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>工作台模块</CardTitle>
            <p className="text-sm text-muted-foreground">
              控制首页各卡片的显示与排列；统计图可单独开关，「待我审批」与「进行中单据」亦可独立配置
            </p>
          </CardHeader>
          <CardContent className="p-0 pt-1">
            <WorkspaceWidgetPanel
              theme={isLight ? 'light' : 'dark'}
              showHeader={false}
              showSettingsLink={false}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
