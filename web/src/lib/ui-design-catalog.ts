import type { ChetaVisualVariantId } from 'lib/cheta-kpi-institutional'
import type { LeaderStylePresetId } from 'lib/leader-style-presets'

export type StylePreviewWire = {
  bg: string
  stripe: string
  nav: string
  card: string
  border: string
  accent: string
  /** 双层容器（Material 3 等） */
  layered?: boolean
  dark?: boolean
}

export type UiDesignSystemId =
  | 'material-3'
  | 'modern-admin'
  | 'apple-hig'
  | 'fluent-2'
  | 'ibm-carbon'
  | 'gov-standard'
  | 'linear-pro'
  | 'geist-dark'
  | 'stripe-dashboard'
  | 'figma-ui3'

export type UiColorSchemeId =
  | 'admin-neutral'
  | 'gov-blue'
  | 'harvard-red'
  | 'burgundy'
  | 'cobalt-blue'
  | 'oxford-navy'
  | 'apple-system-blue'
  | 'm3-seed-purple'
  | 'm3-official-blue'
  | 'fluent-comm-blue'
  | 'carbon-default-blue'

export type UiRecommendedComboId =
  | 'fluent-standard-blue'
  | 'carbon-data-blue'
  | 'm3-official-saturated'
  | 'm3-seed-purple-light'
  | 'gov-fluent-neutral'
  | 'apple-hig-exhibition'
  | 'geist-leader-blue'
  | 'apple-leader-blue'
  | 'apple-exhibition-dark'
  | 'stripe-fintech-light'
  | 'linear-pro-saas'
  | 'figma-collab-light'

export type UiDesignSystem = {
  id: UiDesignSystemId
  name: string
  desc: string
  preview: StylePreviewWire
  variant: ChetaVisualVariantId
}

export type UiColorScheme = {
  id: UiColorSchemeId
  name: string
  desc: string
  preview: StylePreviewWire
  presetId: LeaderStylePresetId
}

export type UiRecommendedCombo = {
  id: UiRecommendedComboId
  name: string
  desc: string
  preview: StylePreviewWire
  designSystemId: UiDesignSystemId
  colorSchemeId: UiColorSchemeId
  presetId: LeaderStylePresetId
  variant: ChetaVisualVariantId
}

export const UI_DESIGN_SYSTEMS: UiDesignSystem[] = [
  {
    id: 'material-3',
    name: 'Material 3',
    desc: '表面容器分层 · M3 动效 · 可与 Fluent 对比',
    variant: 'appleHig',
    preview: { bg: '#EEF2FF', stripe: '#7C3AED', nav: '#7C3AED', card: '#FFFFFF', border: '#C7D2FE', accent: '#7C3AED', layered: true },
  },
  {
    id: 'modern-admin',
    name: '现代行政',
    desc: 'Fluent 式中性灰 · 圆角卡片 · 日常治理与汇报',
    variant: 'institutional',
    preview: { bg: '#F3F4F6', stripe: '#374151', nav: '#374151', card: '#FFFFFF', border: '#D1D5DB', accent: '#374151' },
  },
  {
    id: 'apple-hig',
    name: 'Apple HIG',
    desc: '毛玻璃 · SF Pro 字阶 · 正蓝顶栏 · 领导参观首选',
    variant: 'appleHig',
    preview: { bg: '#F2F2F7', stripe: '#0A84FF', nav: '#0A84FF', card: 'rgba(255,255,255,0.72)', border: 'rgba(10,132,255,0.2)', accent: '#0A84FF' },
  },
  {
    id: 'fluent-2',
    name: 'Fluent 2',
    desc: '微软 Communication Blue · 中性灰底 · 企业协作',
    variant: 'trust',
    preview: { bg: '#F5F5F5', stripe: '#0078D4', nav: '#0078D4', card: '#FFFFFF', border: '#E1DFDD', accent: '#0078D4' },
  },
  {
    id: 'ibm-carbon',
    name: 'IBM Carbon',
    desc: '扁平层级 · 直角 · 1px 边 · IBM Plex · 数据密集 BI',
    variant: 'command',
    preview: { bg: '#F4F4F4', stripe: '#0F62FE', nav: '#161616', card: '#FFFFFF', border: '#C6C6C6', accent: '#0F62FE' },
  },
  {
    id: 'gov-standard',
    name: '政务规范风',
    desc: '严格间距字阶 · 极简装饰 · 政务蓝 · 迎评迎检',
    variant: 'institutional',
    preview: { bg: '#E8F0FB', stripe: '#1D4ED8', nav: '#1D4ED8', card: '#F7FAFF', border: '#B9CAE6', accent: '#1D4ED8' },
  },
  {
    id: 'linear-pro',
    name: 'Linear Pro',
    desc: 'Geist 线框 · 紫蓝强调 · 微悬停光晕 · 国际 SaaS',
    variant: 'vibrant',
    preview: { bg: '#EEF2FF', stripe: '#6366F1', nav: '#6366F1', card: '#FFFFFF', border: '#C7D2FE', accent: '#6366F1' },
  },
  {
    id: 'geist-dark',
    name: 'Geist Dark',
    desc: 'Vercel 深色 · 纯黑底 · 线框微光 · 指挥大屏',
    variant: 'nightOps',
    preview: { bg: '#0A0A0A', stripe: '#3B82F6', nav: '#3B82F6', card: 'rgba(255,255,255,0.04)', border: 'rgba(59,130,246,0.25)', accent: '#3B82F6', dark: true },
  },
  {
    id: 'stripe-dashboard',
    name: 'Stripe Dashboard',
    desc: '金融科技 · 浅 Elevation · 海军蓝字阶 · 高清晰',
    variant: 'trust',
    preview: { bg: '#F6F9FC', stripe: '#0A2540', nav: '#0A2540', card: '#FFFFFF', border: '#E6EBF1', accent: '#635BFF' },
  },
  {
    id: 'figma-ui3',
    name: 'Figma UI3',
    desc: '大圆角 · 柔和灰阶 · Notion 协作生产力美学',
    variant: 'minimal',
    preview: { bg: '#FAFAFA', stripe: '#E03E3E', nav: '#37352F', card: '#FFFFFF', border: '#E5E5E5', accent: '#E03E3E' },
  },
]

export const UI_COLOR_SCHEMES: UiColorScheme[] = [
  { id: 'admin-neutral', name: '行政中性', desc: '90% 灰白 + 品牌色点缀 · 稳重日常', presetId: 'ink-minimal', preview: { bg: '#F5F5F5', stripe: '#DC2626', nav: '#525252', card: '#FFFFFF', border: '#E5E5E5', accent: '#DC2626' } },
  { id: 'gov-blue', name: '政务蓝', desc: '稳重 · 权威 · 柔和 · 迎评迎检', presetId: 'gov-blue', preview: { bg: '#E8F0FB', stripe: '#1D4ED8', nav: '#1D4ED8', card: '#F7FAFF', border: '#B9CAE6', accent: '#1D4ED8' } },
  { id: 'harvard-red', name: '哈佛红', desc: '深红学术风 · 庄重 vigor', presetId: 'vermilion-red', preview: { bg: '#F6ECE8', stripe: '#B91C1C', nav: '#B91C1C', card: '#FFFFFF', border: '#E6CFC8', accent: '#B91C1C' } },
  { id: 'burgundy', name: '经典勃艮第', desc: '传统 BI 权威感 · 深酒红强调', presetId: 'vermilion-red', preview: { bg: '#F3EBEB', stripe: '#881337', nav: '#881337', card: '#FFFFFF', border: '#E9D5D5', accent: '#881337' } },
  { id: 'cobalt-blue', name: '学院钴蓝', desc: '专业 · 权威 · 决策汇报', presetId: 'blue-professional', preview: { bg: '#DBE5F2', stripe: '#1E40AF', nav: '#1E40AF', card: '#F7FAFF', border: '#B9CAE6', accent: '#1E40AF' } },
  { id: 'oxford-navy', name: '牛津藏青', desc: '经典学术权威 · 深藏青 + 金线', presetId: 'oxford-navy', preview: { bg: '#0A1730', stripe: '#D9B65B', nav: '#D9B65B', card: 'rgba(255,255,255,0.05)', border: 'rgba(120,160,210,0.18)', accent: '#D9B65B', dark: true } },
  { id: 'apple-system-blue', name: 'Apple 系统蓝', desc: 'iOS / macOS 系统蓝 · 清朗展示', presetId: 'liquid-glass', preview: { bg: '#F2F2F7', stripe: '#0A84FF', nav: '#0A84FF', card: '#FFFFFF', border: '#D1D1D6', accent: '#0A84FF' } },
  { id: 'm3-seed-purple', name: 'M3 种子紫', desc: 'Material 3 Dynamic · 种子色紫', presetId: 'royal-purple', preview: { bg: '#EFECF7', stripe: '#7C3AED', nav: '#7C3AED', card: '#FFFFFF', border: '#DBD2EE', accent: '#7C3AED' } },
  { id: 'm3-official-blue', name: 'M3 官方蓝', desc: 'Material 3 baseline · #0061A4', presetId: 'modern-saas', preview: { bg: '#E8F1FA', stripe: '#0061A4', nav: '#0061A4', card: '#FFFFFF', border: '#B9CAE6', accent: '#0061A4' } },
  { id: 'fluent-comm-blue', name: 'Fluent 通信蓝', desc: 'Fluent 2 Communication Blue · 企业协作', presetId: 'blue-professional', preview: { bg: '#F5F5F5', stripe: '#0078D4', nav: '#0078D4', card: '#FFFFFF', border: '#E1DFDD', accent: '#0078D4' } },
  { id: 'carbon-default-blue', name: 'Carbon 默认蓝', desc: 'IBM Carbon 默认蓝 · 稳重扎实', presetId: 'ink-minimal', preview: { bg: '#F4F4F4', stripe: '#0F62FE', nav: '#161616', card: '#FFFFFF', border: '#C6C6C6', accent: '#0F62FE' } },
]

export const UI_RECOMMENDED_COMBOS: UiRecommendedCombo[] = [
  { id: 'fluent-standard-blue', name: 'Fluent 标准蓝', desc: 'Fluent 2 + 通信蓝 · 浅色 · 白卡 KPI · 日常治理', designSystemId: 'fluent-2', colorSchemeId: 'fluent-comm-blue', presetId: 'blue-professional', variant: 'trust', preview: { bg: '#F5F5F5', stripe: '#0078D4', nav: '#0078D4', card: '#FFFFFF', border: '#E1DFDD', accent: '#0078D4' } },
  { id: 'carbon-data-blue', name: 'Carbon 数据蓝', desc: 'Carbon + 默认蓝 · 1px 边 · BI 稳重', designSystemId: 'ibm-carbon', colorSchemeId: 'carbon-default-blue', presetId: 'ink-minimal', variant: 'command', preview: { bg: '#F4F4F4', stripe: '#0F62FE', nav: '#161616', card: '#FFFFFF', border: '#C6C6C6', accent: '#0F62FE' } },
  { id: 'm3-official-saturated', name: 'M3 官方蓝 · 饱和', desc: 'Material 3 + #0061A4 · primary-container KPI', designSystemId: 'material-3', colorSchemeId: 'm3-official-blue', presetId: 'modern-saas', variant: 'appleHig', preview: { bg: '#E8F1FA', stripe: '#0061A4', nav: '#0061A4', card: '#FFFFFF', border: '#B9CAE6', accent: '#0061A4', layered: true } },
  { id: 'm3-seed-purple-light', name: 'M3 种子紫 · 浅色', desc: 'Material 3 + 种子紫 · 创新展示', designSystemId: 'material-3', colorSchemeId: 'm3-seed-purple', presetId: 'royal-purple', variant: 'vibrant', preview: { bg: '#EFECF7', stripe: '#7C3AED', nav: '#7C3AED', card: '#FFFFFF', border: '#DBD2EE', accent: '#7C3AED', layered: true } },
  { id: 'gov-fluent-neutral', name: '政务 · 行政中性', desc: '政务规范 + 行政中性 · 迎评迎检', designSystemId: 'gov-standard', colorSchemeId: 'admin-neutral', presetId: 'gov-blue', variant: 'institutional', preview: { bg: '#F5F5F5', stripe: '#1D4ED8', nav: '#1D4ED8', card: '#FFFFFF', border: '#E5E5E5', accent: '#1D4ED8' } },
  { id: 'apple-hig-exhibition', name: 'Apple 参展 · 浅色', desc: 'Apple HIG + 系统蓝 · 毛玻璃 KPI · 参观', designSystemId: 'apple-hig', colorSchemeId: 'apple-system-blue', presetId: 'liquid-glass', variant: 'appleHig', preview: { bg: '#F2F2F7', stripe: '#0A84FF', nav: '#0A84FF', card: 'rgba(255,255,255,0.72)', border: 'rgba(10,132,255,0.2)', accent: '#0A84FF' } },
  { id: 'geist-leader-blue', name: 'Geist 领导蓝', desc: 'Geist Dark + 深蓝底 + 发光边 · 指挥大屏', designSystemId: 'geist-dark', colorSchemeId: 'cobalt-blue', presetId: 'hermes-tech', variant: 'nightOps', preview: { bg: '#0A0A0A', stripe: '#3B82F6', nav: '#3B82F6', card: 'rgba(255,255,255,0.04)', border: 'rgba(59,130,246,0.3)', accent: '#3B82F6', dark: true } },
  { id: 'apple-leader-blue', name: 'Apple 领导蓝', desc: 'Apple HIG + 毛玻璃 · 蓝色 KPI · 领导端', designSystemId: 'apple-hig', colorSchemeId: 'apple-system-blue', presetId: 'hermes-tech', variant: 'appleHig', preview: { bg: '#0f172a', stripe: '#60A5FA', nav: '#60A5FA', card: 'rgba(255,255,255,0.14)', border: 'rgba(255,255,255,0.22)', accent: '#60A5FA', dark: true } },
  { id: 'apple-exhibition-dark', name: 'Apple 参展 · 深色', desc: '纯黑毛玻璃 · Apple 系统蓝 · 展厅投屏', designSystemId: 'geist-dark', colorSchemeId: 'apple-system-blue', presetId: 'hermes-tech', variant: 'nightOps', preview: { bg: '#000000', stripe: '#0A84FF', nav: '#0A84FF', card: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', accent: '#0A84FF', dark: true } },
  { id: 'stripe-fintech-light', name: 'Stripe 金融浅色', desc: 'Stripe Dashboard + 海军蓝 · 金融科技', designSystemId: 'stripe-dashboard', colorSchemeId: 'cobalt-blue', presetId: 'blue-professional', variant: 'trust', preview: { bg: '#F6F9FC', stripe: '#0A2540', nav: '#0A2540', card: '#FFFFFF', border: '#E6EBF1', accent: '#635BFF' } },
  { id: 'linear-pro-saas', name: 'Linear SaaS', desc: 'Linear Pro + 种子紫 · 国际 SaaS 展示', designSystemId: 'linear-pro', colorSchemeId: 'm3-seed-purple', presetId: 'royal-purple', variant: 'vibrant', preview: { bg: '#EEF2FF', stripe: '#6366F1', nav: '#6366F1', card: '#FFFFFF', border: '#C7D2FE', accent: '#6366F1' } },
  { id: 'figma-collab-light', name: 'Figma 协作浅色', desc: 'Figma UI3 + 行政中性 · 协作生产力', designSystemId: 'figma-ui3', colorSchemeId: 'admin-neutral', presetId: 'ink-academic', variant: 'minimal', preview: { bg: '#FAFAFA', stripe: '#E03E3E', nav: '#37352F', card: '#FFFFFF', border: '#E5E5E5', accent: '#E03E3E' } },
]

export const STORAGE_DESIGN_SYSTEM = 'imes-ui-design-system-id'
export const STORAGE_COLOR_SCHEME = 'imes-ui-color-scheme-id'
export const STORAGE_COMBO = 'imes-ui-recommended-combo-id'

export function getDesignSystem(id: UiDesignSystemId) {
  return UI_DESIGN_SYSTEMS.find((d) => d.id === id)!
}

export function getColorScheme(id: UiColorSchemeId) {
  return UI_COLOR_SCHEMES.find((c) => c.id === id)!
}

export function getRecommendedCombo(id: UiRecommendedComboId) {
  return UI_RECOMMENDED_COMBOS.find((c) => c.id === id)!
}

export function readStoredDesignSystemId(): UiDesignSystemId | null {
  const v = localStorage.getItem(STORAGE_DESIGN_SYSTEM)
  return UI_DESIGN_SYSTEMS.some((d) => d.id === v) ? (v as UiDesignSystemId) : null
}

export function readStoredColorSchemeId(): UiColorSchemeId | null {
  const v = localStorage.getItem(STORAGE_COLOR_SCHEME)
  return UI_COLOR_SCHEMES.some((c) => c.id === v) ? (v as UiColorSchemeId) : null
}

export function readStoredComboId(): UiRecommendedComboId | null {
  const v = localStorage.getItem(STORAGE_COMBO)
  return UI_RECOMMENDED_COMBOS.some((c) => c.id === v) ? (v as UiRecommendedComboId) : null
}

export function formatCurrentComboLabel(designSystemId: UiDesignSystemId, colorSchemeId: UiColorSchemeId): string {
  const ds = getDesignSystem(designSystemId)
  const cs = getColorScheme(colorSchemeId)
  return `${cs.name} · ${ds.name}`
}

export function formatCurrentComboDetail(
  designSystemId: UiDesignSystemId,
  colorSchemeId: UiColorSchemeId,
  light: boolean,
): string {
  const ds = getDesignSystem(designSystemId)
  const cs = getColorScheme(colorSchemeId)
  const mode = light ? '浅色模式' : '深色模式'
  return `${cs.name} × ${ds.name} · ${mode} · ${ds.desc} · 色系：${cs.desc}`
}

/** 合并设计语言 + 色系 wireframe 预览 */
export function mergeAppearancePreview(
  designSystemId: UiDesignSystemId,
  colorSchemeId: UiColorSchemeId,
): StylePreviewWire {
  const ds = getDesignSystem(designSystemId)
  const cs = getColorScheme(colorSchemeId)
  const dark = !!(ds.preview.dark || cs.preview.dark)
  return {
    bg: dark ? (ds.preview.dark ? ds.preview.bg : '#0A0A0A') : cs.preview.bg,
    stripe: cs.preview.stripe,
    nav: cs.preview.nav,
    card: dark ? (ds.preview.card ?? 'rgba(255,255,255,0.05)') : cs.preview.card,
    border: dark ? cs.preview.border : cs.preview.border,
    accent: cs.preview.accent,
    layered: ds.preview.layered,
    dark,
  }
}

/** 设计语言 + 色系 → 统一 preset / variant（保证顶栏与 KPI 色系一致） */
export function resolveAppearanceApplication(
  designSystemId: UiDesignSystemId,
  colorSchemeId: UiColorSchemeId,
): {
  presetId: LeaderStylePresetId
  variant: ChetaVisualVariantId
  preview: StylePreviewWire
  comboId: UiRecommendedComboId | null
} {
  const exact = UI_RECOMMENDED_COMBOS.find(
    (c) => c.designSystemId === designSystemId && c.colorSchemeId === colorSchemeId,
  )
  if (exact) {
    return {
      presetId: exact.presetId,
      variant: exact.variant,
      preview: exact.preview,
      comboId: exact.id,
    }
  }

  const ds = getDesignSystem(designSystemId)
  const cs = getColorScheme(colorSchemeId)
  const dsDark = !!ds.preview.dark

  if (dsDark) {
    const dsCombo = UI_RECOMMENDED_COMBOS.find(
      (c) => c.designSystemId === designSystemId && c.preview.dark,
    )
    if (dsCombo) {
      return {
        presetId: dsCombo.presetId,
        variant: dsCombo.variant,
        preview: mergeAppearancePreview(designSystemId, colorSchemeId),
        comboId: null,
      }
    }
  }

  const lightCombo = UI_RECOMMENDED_COMBOS.find(
    (c) => c.designSystemId === designSystemId && !c.preview.dark,
  )
  if (lightCombo && !dsDark) {
    return {
      presetId: lightCombo.colorSchemeId === colorSchemeId ? lightCombo.presetId : cs.presetId,
      variant: ds.variant,
      preview: mergeAppearancePreview(designSystemId, colorSchemeId),
      comboId: lightCombo.colorSchemeId === colorSchemeId ? lightCombo.id : null,
    }
  }

  return {
    presetId: cs.presetId,
    variant: ds.variant,
    preview: mergeAppearancePreview(designSystemId, colorSchemeId),
    comboId: null,
  }
}

/** 从已应用 preset + variant 反推目录选中态 */
export function inferCatalogSelection(
  presetId: LeaderStylePresetId,
  variant: ChetaVisualVariantId,
): {
  designSystemId: UiDesignSystemId
  colorSchemeId: UiColorSchemeId
  comboId: UiRecommendedComboId | null
} {
  const byCombo = UI_RECOMMENDED_COMBOS.find(
    (c) => c.presetId === presetId && c.variant === variant,
  )
  if (byCombo) {
    return {
      designSystemId: byCombo.designSystemId,
      colorSchemeId: byCombo.colorSchemeId,
      comboId: byCombo.id,
    }
  }

  const byPreset = UI_RECOMMENDED_COMBOS.find((c) => c.presetId === presetId)
  if (byPreset) {
    return {
      designSystemId: byPreset.designSystemId,
      colorSchemeId: byPreset.colorSchemeId,
      comboId: null,
    }
  }

  const cs = UI_COLOR_SCHEMES.find((c) => c.presetId === presetId)
  const ds = UI_DESIGN_SYSTEMS.find((d) => d.variant === variant)
  return {
    designSystemId: ds?.id ?? 'material-3',
    colorSchemeId: cs?.id ?? 'm3-official-blue',
    comboId: null,
  }
}

export function syncStoredCatalogWithTheme(
  presetId: LeaderStylePresetId,
  variant: ChetaVisualVariantId,
) {
  const inferred = inferCatalogSelection(presetId, variant)
  localStorage.setItem(STORAGE_DESIGN_SYSTEM, inferred.designSystemId)
  localStorage.setItem(STORAGE_COLOR_SCHEME, inferred.colorSchemeId)
  if (inferred.comboId) localStorage.setItem(STORAGE_COMBO, inferred.comboId)
  else localStorage.removeItem(STORAGE_COMBO)
  return inferred
}
