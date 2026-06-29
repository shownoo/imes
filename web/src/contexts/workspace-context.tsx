import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  applyLayoutPreferences,
  applyLeaderStylePreset,
  DEFAULT_LEADER_STYLE_PRESET,
  DEFAULT_PREFERENCES,
  DEFAULT_WORKSPACE_WIDGETS,
  findOppositeModePreset,
  LEADER_STYLE_PRESET_CHANGE,
  LEADER_STYLE_PRESETS,
  PREFS_CHANGE_EVENT,
  readStoredLeaderStylePresetId,
  readWorkspacePreferences,
  saveWorkspacePreferences,
  VIEW_PERSPECTIVES,
  type ContentMarginId,
  type ContentMaxWidthId,
  type LeaderStylePreset,
  type LeaderStylePresetId,
  type ViewPerspectiveId,
  type WorkspacePreferences,
  type WorkspaceWidget,
  type WorkspaceWidgetId,
} from 'lib/workspace-theme'
import {
  useChetaVisualVariant,
  type ChetaVisualVariantId,
} from 'contexts/cheta-visual-variant-context'
import {
  readStoredColorSchemeId,
  readStoredDesignSystemId,
  resolveAppearanceApplication,
} from 'lib/ui-design-catalog'

type WorkspaceContextValue = {
  theme: LeaderStylePreset
  variant: ChetaVisualVariantId
  prefs: WorkspacePreferences
  setThemeId: (id: LeaderStylePresetId) => void
  setVisualVariant: (variant: ChetaVisualVariantId) => void
  setMargin: (margin: ContentMarginId) => void
  setMaxWidth: (maxWidth: ContentMaxWidthId) => void
  toggleWidget: (id: WorkspaceWidgetId) => void
  moveWidget: (id: WorkspaceWidgetId, dir: -1 | 1) => void
  applyPerspective: (id: ViewPerspectiveId) => void
  resetAll: () => void
  visibleWidgets: WorkspaceWidget[]
  toggleDarkMode: () => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { variant, setVariant } = useChetaVisualVariant()
  const [themeId, setThemeIdState] = useState<LeaderStylePresetId>(
    () => readStoredLeaderStylePresetId() ?? DEFAULT_LEADER_STYLE_PRESET.id,
  )
  const [prefs, setPrefs] = useState<WorkspacePreferences>(() => readWorkspacePreferences())

  const theme = useMemo(
    () => LEADER_STYLE_PRESETS.find((p) => p.id === themeId) ?? DEFAULT_LEADER_STYLE_PRESET,
    [themeId],
  )

  useEffect(() => {
    applyLayoutPreferences(prefs)
  }, [prefs.margin, prefs.maxWidth])

  /** 启动时：若目录选了 Geist Dark + Apple 蓝等组合，但 preset 仍是旧黑金，则自动纠正 */
  useEffect(() => {
    const dsId = readStoredDesignSystemId()
    const csId = readStoredColorSchemeId()
    if (!dsId || !csId) return
    const app = resolveAppearanceApplication(dsId, csId)
    if (app.presetId !== themeId) {
      const preset = LEADER_STYLE_PRESETS.find((p) => p.id === app.presetId)
      if (preset) applyLeaderStylePreset(preset, { setVariant })
      setThemeIdState(app.presetId)
    } else if (app.variant !== variant) {
      setVariant(app.variant)
    }
  }, [])

  useEffect(() => {
    const syncPrefs = () => setPrefs(readWorkspacePreferences())
    const syncTheme = () => {
      const id = readStoredLeaderStylePresetId()
      if (id) setThemeIdState(id)
    }
    window.addEventListener(PREFS_CHANGE_EVENT, syncPrefs)
    window.addEventListener(LEADER_STYLE_PRESET_CHANGE, syncTheme)
    window.addEventListener('storage', syncPrefs)
    return () => {
      window.removeEventListener(PREFS_CHANGE_EVENT, syncPrefs)
      window.removeEventListener(LEADER_STYLE_PRESET_CHANGE, syncTheme)
      window.removeEventListener('storage', syncPrefs)
    }
  }, [])

  const persist = useCallback((next: WorkspacePreferences) => {
    setPrefs(next)
    saveWorkspacePreferences(next)
  }, [])

  const setThemeId = useCallback((id: LeaderStylePresetId) => {
    const preset = LEADER_STYLE_PRESETS.find((p) => p.id === id)
    if (!preset) return
    applyLeaderStylePreset(preset, { setVariant })
    setThemeIdState(id)
  }, [setVariant])

  const setVisualVariant = useCallback((v: ChetaVisualVariantId) => {
    setVariant(v)
  }, [setVariant])

  const setMargin = useCallback((margin: ContentMarginId) => {
    persist({ ...prefs, margin })
  }, [prefs, persist])

  const setMaxWidth = useCallback((maxWidth: ContentMaxWidthId) => {
    persist({ ...prefs, maxWidth })
  }, [prefs, persist])

  const toggleWidget = useCallback((id: WorkspaceWidgetId) => {
    persist({
      ...prefs,
      widgets: prefs.widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
    })
  }, [prefs, persist])

  const moveWidget = useCallback((id: WorkspaceWidgetId, dir: -1 | 1) => {
    const idx = prefs.widgets.findIndex((w) => w.id === id)
    if (idx < 0) return
    const target = idx + dir
    if (target < 0 || target >= prefs.widgets.length) return
    const next = [...prefs.widgets]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    persist({ ...prefs, widgets: next })
  }, [prefs, persist])

  const applyPerspective = useCallback((id: ViewPerspectiveId) => {
    const p = VIEW_PERSPECTIVES.find((v) => v.id === id)
    if (!p) return
    const widgets = DEFAULT_WORKSPACE_WIDGETS.map((w) => ({
      ...w,
      visible: p.visible.includes(w.id),
    }))
    persist({ margin: p.margin, maxWidth: p.maxWidth, widgets })
  }, [persist])

  const resetAll = useCallback(() => {
    applyLeaderStylePreset(DEFAULT_LEADER_STYLE_PRESET, { setVariant })
    setThemeIdState(DEFAULT_LEADER_STYLE_PRESET.id)
    persist(DEFAULT_PREFERENCES)
  }, [persist, setVariant])

  const toggleDarkMode = useCallback(() => {
    setThemeId(findOppositeModePreset(theme).id)
  }, [theme, setThemeId])

  const visibleWidgets = useMemo(() => prefs.widgets.filter((w) => w.visible), [prefs.widgets])

  const value = useMemo(
    () => ({
      theme, variant, prefs, setThemeId, setVisualVariant, setMargin, setMaxWidth,
      toggleWidget, moveWidget, applyPerspective, resetAll, visibleWidgets, toggleDarkMode,
    }),
    [
      theme, variant, prefs, setThemeId, setVisualVariant, setMargin, setMaxWidth,
      toggleWidget, moveWidget, applyPerspective, resetAll, visibleWidgets, toggleDarkMode,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
