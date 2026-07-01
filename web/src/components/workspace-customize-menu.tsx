import { StyleSwitcherMenuShell } from 'components/style-switcher-menu-shell'
import { WorkspaceWidgetPanel } from 'components/workspace-widget-panel'
import { useLeaderVi } from 'hooks/use-leader-vi'

/** 工作台页内自定义 — 对齐 neoWebSchool StyleSwitcherMenu + extraPanel */
export function WorkspaceCustomizeMenu() {
  const { isLight } = useLeaderVi()

  return (
    <StyleSwitcherMenuShell
      label="自定义"
      theme={isLight ? 'light' : 'dark'}
      panelMinWidth={300}
      ariaLabel="自定义工作台模块"
    >
      <WorkspaceWidgetPanel theme={isLight ? 'light' : 'dark'} />
    </StyleSwitcherMenuShell>
  )
}
