import { useMemo } from 'react'
import { useWorkspace } from 'contexts/workspace-context'
import { isDarkPreviewColor } from 'lib/preset-css'

export type LeaderVi = {
  text: string
  textMuted: string
  bgCard: string
  bgElevated: string
  border: string
  primary: string
  isLight: boolean
}

/** KPI / 面板组件用 VI 色板（来自当前风格预设 preview） */
export function useLeaderVi(): LeaderVi {
  const { theme } = useWorkspace()
  return useMemo(() => {
    const pv = theme.preview
    const light = !isDarkPreviewColor(pv.bg)
    return {
      text: light ? '#0F172A' : '#F8FAFC',
      textMuted: light ? '#64748B' : '#94A3B8',
      bgCard: pv.card,
      bgElevated: pv.bg,
      border: pv.border,
      primary: pv.accent,
      isLight: light,
    }
  }, [theme])
}
