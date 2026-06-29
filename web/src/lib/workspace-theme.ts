/**
 * 工作空间偏好 + 风格预设桥接（数据源自 neoWebSchool leader-style-presets.ts）
 */
import {
  LEADER_STYLE_PRESETS,
  LEADER_STYLE_PRESET_CHANGE,
  DEFAULT_LEADER_STYLE_PRESET,
  applyLeaderStylePreset,
  readStoredLeaderStylePreset,
  readStoredLeaderStylePresetId,
  resolveColorModeFromLeader,
  type LeaderStylePreset,
  type LeaderStylePresetId,
} from './leader-style-presets'

export {
  LEADER_STYLE_PRESETS,
  LEADER_STYLE_PRESET_CHANGE,
  DEFAULT_LEADER_STYLE_PRESET,
  applyLeaderStylePreset,
  readStoredLeaderStylePreset,
  readStoredLeaderStylePresetId,
  readStoredVisualVariant,
  matchCurrentPreset,
  resolveColorModeFromLeader,
  type LeaderStylePreset,
  type LeaderStylePresetId,
  type OverviewTheme,
  type AnalysisTheme,
} from './leader-style-presets'

export {
  CHETA_VISUAL_VARIANT_OPTIONS,
  type ChetaVisualVariantId,
} from './cheta-kpi-institutional'

import { CHETA_VISUAL_VARIANT_OPTIONS } from './cheta-kpi-institutional'

/** @deprecated 使用 LeaderStylePresetId */
export type ThemePresetId = LeaderStylePresetId
/** @deprecated 使用 LeaderStylePreset */
export type ThemePreset = LeaderStylePreset

export const THEME_PRESETS = LEADER_STYLE_PRESETS

export const RECOMMENDED_PRESET_IDS: LeaderStylePresetId[] = [
  'modern-saas',
  'blue-professional',
  'apple-governance',
  'night-command',
  'hermes-tech',
  'gov-blue',
  'liquid-glass',
  'deep-sea',
]

export const RECOMMENDED_PRESETS = LEADER_STYLE_PRESETS.filter((p) =>
  RECOMMENDED_PRESET_IDS.includes(p.id),
)

export function getPresetComboLabel(preset: LeaderStylePreset): string {
  const lang = CHETA_VISUAL_VARIANT_OPTIONS.find((d) => d.id === preset.variant)
  return `${preset.compactLabel} · ${lang?.compactLabel ?? preset.variant}`
}

export function getPresetComboDetail(preset: LeaderStylePreset): string {
  const lang = CHETA_VISUAL_VARIANT_OPTIONS.find((d) => d.id === preset.variant)
  const langName = lang?.label.split(' · ')[1] ?? lang?.label ?? preset.variant
  const mode = resolveColorModeFromLeader(preset.id) === 'light' ? '浅色模式' : '深色模式'
  return `${preset.name} · ${lang?.label ?? ''} · 色系：${preset.overview} · ${mode} · 组合：${langName} × ${preset.name}`
}

export const STORAGE_THEME_KEY = 'leader-style-preset-id'
export const STORAGE_WORKSPACE_KEY = 'imes-workspace-layout'
export const STORAGE_PREFS_KEY = 'imes-workspace-prefs'
export const THEME_CHANGE_EVENT = LEADER_STYLE_PRESET_CHANGE
export const PREFS_CHANGE_EVENT = 'imes-prefs-change'

export type ContentMarginId = '24' | '32' | '40' | '48'
export type ContentMaxWidthId = '1280' | '1440' | '1680' | '1920' | 'full'
export type ViewPerspectiveId = 'leader' | 'operator' | 'warehouse'

export const CONTENT_MARGIN_OPTIONS: Array<{ id: ContentMarginId; px: number }> = [
  { id: '24', px: 24 },
  { id: '32', px: 32 },
  { id: '40', px: 40 },
  { id: '48', px: 48 },
]

export const CONTENT_MAX_WIDTH_OPTIONS: Array<{ id: ContentMaxWidthId; max: string }> = [
  { id: '1280', max: '1280px' },
  { id: '1440', max: '1440px' },
  { id: '1680', max: '1680px' },
  { id: '1920', max: '1920px' },
  { id: 'full', max: '100%' },
]

const LEGACY_MARGIN_MAP: Record<string, ContentMarginId> = {
  compact: '24',
  standard: '24',
  relaxed: '32',
  wide: '48',
}

const LEGACY_MAX_WIDTH_MAP: Record<string, ContentMaxWidthId> = {
  follow: '1680',
  standard: '1680',
  wide: '1920',
  full: 'full',
}

export function normalizeContentMarginId(value: string | undefined): ContentMarginId {
  if (value && CONTENT_MARGIN_OPTIONS.some((o) => o.id === value)) return value as ContentMarginId
  return LEGACY_MARGIN_MAP[value ?? ''] ?? '24'
}

export function normalizeContentMaxWidthId(value: string | undefined): ContentMaxWidthId {
  if (value && CONTENT_MAX_WIDTH_OPTIONS.some((o) => o.id === value)) return value as ContentMaxWidthId
  return LEGACY_MAX_WIDTH_MAP[value ?? ''] ?? '1680'
}

export function getLayoutMaxWidthSummaryLabel(maxWidth: ContentMaxWidthId): string {
  if (maxWidth === '1680') return '标准宽度 1680px'
  if (maxWidth === 'full') return '全宽 100%'
  return `${maxWidth}px`
}

export function resolveEffectiveMaxWidth(maxWidth: ContentMaxWidthId): string {
  return CONTENT_MAX_WIDTH_OPTIONS.find((m) => m.id === maxWidth)?.max ?? '1680px'
}

export function getLayoutPreviewSummary(margin: ContentMarginId, maxWidth: ContentMaxWidthId): string {
  const px = CONTENT_MARGIN_OPTIONS.find((m) => m.id === margin)?.px ?? 24
  return `边距 ${px}px · ${getLayoutMaxWidthSummaryLabel(maxWidth)}`
}

export type WorkspacePreferences = {
  margin: ContentMarginId
  maxWidth: ContentMaxWidthId
  widgets: WorkspaceWidget[]
}

export const VIEW_PERSPECTIVES: Array<{
  id: ViewPerspectiveId
  label: string
  desc: string
  margin: ContentMarginId
  maxWidth: ContentMaxWidthId
  visible: WorkspaceWidgetId[]
}> = [
  {
    id: 'leader',
    label: '领导决策',
    desc: 'KPI · 热力图 · 预警一屏统览',
    margin: '32',
    maxWidth: '1680',
    visible: ['kpi', 'expiry', 'zoneHeatmap', 'pendingTasks', 'alerts', 'waterLevel'],
  },
  {
    id: 'operator',
    label: '仓储运营',
    desc: '待办 · 水位 · 效期为主',
    margin: '24',
    maxWidth: '1680',
    visible: ['kpi', 'expiry', 'waterLevel', 'pendingTasks', 'alerts'],
  },
  {
    id: 'warehouse',
    label: '仓管作业',
    desc: '待办单据 + 库存水位优先',
    margin: '24',
    maxWidth: '1440',
    visible: ['pendingTasks', 'waterLevel', 'expiry', 'kpi'],
  },
]

export type WorkspaceWidgetId =
  | 'kpi'
  | 'expiry'
  | 'waterLevel'
  | 'zoneHeatmap'
  | 'pendingTasks'
  | 'alerts'

export type WorkspaceWidget = {
  id: WorkspaceWidgetId
  label: string
  visible: boolean
}

export const WORKSPACE_WIDGET_DEFS: Record<WorkspaceWidgetId, string> = {
  kpi: '核心指标',
  expiry: '效期健康度',
  waterLevel: '库存水位线',
  zoneHeatmap: '库区热力图',
  pendingTasks: '待办单据',
  alerts: '智能预警',
}

export const DEFAULT_WORKSPACE_WIDGETS: WorkspaceWidget[] = [
  { id: 'kpi', label: '核心指标', visible: true },
  { id: 'expiry', label: '效期健康度', visible: true },
  { id: 'waterLevel', label: '库存水位线', visible: true },
  { id: 'zoneHeatmap', label: '库区热力图', visible: true },
  { id: 'pendingTasks', label: '待办单据', visible: true },
  { id: 'alerts', label: '智能预警', visible: true },
]

export const DEFAULT_PREFERENCES: WorkspacePreferences = {
  margin: '24',
  maxWidth: '1680',
  widgets: DEFAULT_WORKSPACE_WIDGETS,
}

export function readStoredThemeId(): LeaderStylePresetId | null {
  return readStoredLeaderStylePresetId()
}

export function applyThemePreset(preset: LeaderStylePreset) {
  applyLeaderStylePreset(preset)
}

export function findOppositeModePreset(current: LeaderStylePreset): LeaderStylePreset {
  const sameVariant = LEADER_STYLE_PRESETS.find(
    (p) => p.id !== current.id && p.variant === current.variant
      && resolveColorModeFromLeader(p.id) !== resolveColorModeFromLeader(current.id),
  )
  if (sameVariant) return sameVariant
  const opposite = LEADER_STYLE_PRESETS.find(
    (p) => resolveColorModeFromLeader(p.id) !== resolveColorModeFromLeader(current.id),
  )
  return opposite ?? LEADER_STYLE_PRESETS[0]!
}

export function applyLayoutPreferences(prefs: Pick<WorkspacePreferences, 'margin' | 'maxWidth'>) {
  const margin = CONTENT_MARGIN_OPTIONS.find((m) => m.id === prefs.margin)?.px ?? 24
  const maxOpt = CONTENT_MAX_WIDTH_OPTIONS.find((m) => m.id === prefs.maxWidth)
  const max = maxOpt?.max ?? '1440px'
  const root = document.documentElement
  root.style.setProperty('--leader-content-padding', `${margin}px`)
  if (max.startsWith('var(')) {
    root.style.removeProperty('--leader-content-max')
  } else {
    root.style.setProperty('--leader-content-max', max)
  }
}

function readLegacyWidgets(): WorkspaceWidget[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_WORKSPACE_KEY)
    if (!raw) return null
    return mergeWidgets(JSON.parse(raw) as WorkspaceWidget[])
  } catch {
    return null
  }
}

export function readWorkspacePreferences(): WorkspacePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_PREFS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WorkspacePreferences>
      return {
        margin: normalizeContentMarginId(parsed.margin),
        maxWidth: normalizeContentMaxWidthId(parsed.maxWidth),
        widgets: mergeWidgets(parsed.widgets),
      }
    }
  } catch { /* fall through */ }

  const legacyWidgets = readLegacyWidgets()
  if (legacyWidgets) {
    return { ...DEFAULT_PREFERENCES, widgets: legacyWidgets }
  }

  return DEFAULT_PREFERENCES
}

function mergeWidgets(widgets?: WorkspaceWidget[]): WorkspaceWidget[] {
  if (!widgets?.length) return DEFAULT_WORKSPACE_WIDGETS
  const ids = new Set(widgets.map((w) => w.id))
  const merged = [...widgets]
  for (const def of DEFAULT_WORKSPACE_WIDGETS) {
    if (!ids.has(def.id)) merged.push(def)
  }
  return merged.filter((w) => w.id in WORKSPACE_WIDGET_DEFS)
}

export function saveWorkspacePreferences(prefs: WorkspacePreferences) {
  localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(prefs))
  localStorage.setItem(STORAGE_WORKSPACE_KEY, JSON.stringify(prefs.widgets))
  applyLayoutPreferences(prefs)
  window.dispatchEvent(new Event(PREFS_CHANGE_EVENT))
}

export function readWorkspaceLayout(): WorkspaceWidget[] {
  return readWorkspacePreferences().widgets
}

export function saveWorkspaceLayout(widgets: WorkspaceWidget[]) {
  const prefs = readWorkspacePreferences()
  saveWorkspacePreferences({ ...prefs, widgets })
}

/** 色系目录 — 从全站预设 overview 去重 */
export const COLOR_FAMILIES = Array.from(
  new Map(
    LEADER_STYLE_PRESETS.map((p) => [
      p.overview,
      {
        id: p.overview,
        name: p.name,
        compactLabel: p.compactLabel,
        desc: p.desc,
        sample: p.preview.accent,
      },
    ]),
  ).values(),
)

export const DESIGN_LANGUAGES = CHETA_VISUAL_VARIANT_OPTIONS.map((d) => ({
  id: d.id,
  label: d.label,
  compactLabel: d.compactLabel,
  description: d.description,
}))

export function getDesignLanguage(id: string) {
  return DESIGN_LANGUAGES.find((d) => d.id === id)!
}

export function getColorFamily(id: string) {
  return COLOR_FAMILIES.find((c) => c.id === id)!
}
