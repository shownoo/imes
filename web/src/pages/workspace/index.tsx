import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, RotateCcw, Sparkles } from 'lucide-react'
import { useWorkspace } from 'contexts/workspace-context'
import { VIEW_PERSPECTIVES } from 'lib/workspace-theme'
import { AppearanceCatalogSection } from 'pages/workspace/appearance-catalog'
import { LayoutSection } from 'pages/workspace/layout-section'
import { PageHeader, Button, Card, CardContent, CardHeader, CardTitle, Badge } from 'components/common'

export default function WorkspaceSettings() {
  const {
    prefs,
    toggleWidget, moveWidget, applyPerspective, resetAll, theme,
  } = useWorkspace()

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
        <Card className="leader-panel-card">
          <CardHeader>
            <CardTitle>工作台模块</CardTitle>
            <p className="text-sm text-muted-foreground">控制首页卡片显示与排列顺序</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {prefs.widgets.map((w, i) => (
                <li key={w.id} className="flex items-center justify-between rounded-lg border border-[var(--leader-card-border)] bg-[var(--leader-card-bg)] px-4 py-3">
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={w.visible} onChange={() => toggleWidget(w.id)} />
                    <span className="text-sm font-medium">{w.label}</span>
                    {!w.visible && <Badge variant="secondary">已隐藏</Badge>}
                  </label>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-8" disabled={i === 0} onClick={() => moveWidget(w.id, -1)}>
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" disabled={i === prefs.widgets.length - 1} onClick={() => moveWidget(w.id, 1)}>
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="leader-panel-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              角色视角一键应用
            </CardTitle>
            <p className="text-sm text-muted-foreground">按岗位快速切换工作台模块组合与内容区布局</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {VIEW_PERSPECTIVES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPerspective(p.id)}
                  className="rounded-xl border border-[var(--leader-card-border)] bg-[var(--leader-card-bg)] p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <p className="font-medium">{p.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
