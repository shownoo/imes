/* eslint-disable no-restricted-syntax -- 界面方案 A–H 为内置中文标签与说明，不经 i18n 提取 */
/**
 * CHETA 领导端界面 token（方案 A–H 共用）
 *
 * **方案 D · 清朗（appleHig）** 对齐 Apple Human Interface Guidelines 的可 Web 化要点：
 * - **Clarity**：高对比层级、大号标题变量、分组背景不抢内容
 * - **Depth**：柔扩散阴影与材质分层（毛玻璃卡片在浅色下由组件叠加）
 * - **Deference**：弱粒子与深色下克制光晕，界面让位给数据
 * - **Hierarchy**：主色作强调与导航锚点，避免彩虹 KPI
 *
 * - KPI 左条色：`chetaKpiLeftAccent`
 * - 卡片阴影：`chetaSurfaceShadow` / `--cheta-surface-shadow`
 * - 浅色页底：`chetaPageBgLight` / `--cheta-page-bg-light`
 */

/** 与全局主题色正交：领导端界面密度/层次（A–H） */
export type ChetaVisualVariantId =
  | 'institutional'
  | 'vibrant'
  | 'minimal'
  | 'appleHig'
  | 'editorial'
  | 'command'
  | 'trust'
  | 'nightOps'

export const CHETA_VISUAL_VARIANT_OPTIONS: Array<{
  id: ChetaVisualVariantId
  label: string
  /** 顶栏触发器用，省横向空间（完整名见 label / title） */
  compactLabel: string
  description: string
}> = [
  {
    id: 'institutional',
    label: '方案 A · 政务经典',
    compactLabel: 'A',
    description: '高对比中性色、深字重标题、清晰分区边界，稳健政务风',
  },
  {
    id: 'vibrant',
    label: '方案 B · 蓝脉锐显',
    compactLabel: 'B',
    description: '冷蓝高对比渐层、强化主强调与信息层级，现代展示风',
  },
  {
    id: 'minimal',
    label: '方案 C · 极简风',
    compactLabel: 'C',
    description: '白底扁平、细线分割、弱阴影',
  },
  {
    id: 'appleHig',
    label: '方案 D · 清朗',
    compactLabel: 'D',
    description: 'HIG 向领导展示：微渐变分组底、材质顶栏、加宽版心、柔阴影与浅色毛玻璃 KPI',
  },
  {
    id: 'editorial',
    label: '方案 E · 述职简报',
    compactLabel: 'E',
    description: '正式汇报向：暖中性底、标题加重、关键数字高对比呈现',
  },
  {
    id: 'command',
    label: '方案 F · 分析矩阵',
    compactLabel: 'F',
    description: '高密度分析向：深浅分区强对齐、窄间距栅格、数字优先',
  },
  {
    id: 'trust',
    label: '方案 G · 权衡蓝灰',
    compactLabel: 'G',
    description: '金融级蓝灰对比、稳重字阶与克制高光，专业决策氛围',
  },
  {
    id: 'nightOps',
    label: '方案 H · 夜航指挥',
    compactLabel: 'H',
    description: '指挥舱向：浅色暮灰底；深色下青蓝数据光晕、克制粒子，偏长时间盯屏',
  },
]

/** 浅色顶栏毛玻璃 + 加高（原 D 清朗） */
export function chetaLeaderFrostedNavLight(variant: ChetaVisualVariantId): boolean {
  return variant === 'appleHig' || variant === 'editorial'
}

/** 深色下关闭霓虹网格与多光斑 */
export function chetaLeaderCalmDarkBackdrop(variant: ChetaVisualVariantId): boolean {
  return (
    variant === 'appleHig' ||
    variant === 'editorial' ||
    variant === 'trust' ||
    variant === 'nightOps'
  )
}

/** 页头大标题/副标题展示向（D、E） */
export function chetaLeaderPageHeaderPresentation(variant: ChetaVisualVariantId): boolean {
  return variant === 'appleHig' || variant === 'editorial'
}

/** 实体详情页玻璃英雄区、字距收紧（D、E） */
export function chetaLeaderEntityPresentation(variant: ChetaVisualVariantId): boolean {
  return variant === 'appleHig' || variant === 'editorial'
}

/** 研判条 Apple 语义面 + 排版（D、E） */
export function chetaLeaderDecisionStripPresentation(variant: ChetaVisualVariantId): boolean {
  return variant === 'appleHig' || variant === 'editorial'
}

/** 合作分析顶区：浅色下毛玻璃 KPI + 深色字（D、E） */
export function chetaLeaderCoopHeroLightKpi(
  variant: ChetaVisualVariantId,
  viLight: boolean,
): boolean {
  return viLight && (variant === 'appleHig' || variant === 'editorial')
}

/** KPI 栅格 12 列宽屏（D、E、F） */
export function chetaLeaderKpiWideGrid(variant: ChetaVisualVariantId): boolean {
  return variant === 'appleHig' || variant === 'editorial' || variant === 'command'
}

/** KPI 展示向排版（毛玻璃/字阶/最小高度），不含 F */
export function chetaLeaderKpiPresentationStyle(variant: ChetaVisualVariantId): boolean {
  return variant === 'appleHig' || variant === 'editorial'
}

/** 决策舱高密度 KPI 皮肤 */
export function chetaLeaderKpiCommandStyle(variant: ChetaVisualVariantId): boolean {
  return variant === 'command'
}

/** 主内容区 max-width（注入 `--cheta-page-content-max`） */
export function chetaPageContentMax(variant: ChetaVisualVariantId): string {
  if (variant === 'appleHig' || variant === 'editorial') return '1860px'
  if (variant === 'command') return '1780px'
  if (variant === 'institutional' || variant === 'trust') return '1740px'
  return '1680px'
}

export function chetaLeaderTitleSizeVar(variant: ChetaVisualVariantId): string {
  if (variant === 'appleHig' || variant === 'editorial') return 'clamp(1.65rem, 2.75vw, 2.2rem)'
  if (variant === 'command') return 'clamp(1.5rem, 2.4vw, 2.05rem)'
  if (variant === 'institutional') return 'clamp(1.58rem, 2.45vw, 2.08rem)'
  if (variant === 'vibrant') return 'clamp(1.62rem, 2.5vw, 2.12rem)'
  if (variant === 'trust') return 'clamp(1.56rem, 2.42vw, 2.06rem)'
  return '1.5rem'
}

export function chetaLeaderSubtitleSizeVar(variant: ChetaVisualVariantId): string {
  if (variant === 'appleHig' || variant === 'editorial') return '0.93rem'
  if (variant === 'command') return '0.9rem'
  if (variant === 'institutional' || variant === 'trust') return '0.89rem'
  if (variant === 'vibrant') return '0.9rem'
  return '0.85rem'
}

/** 卡片表面阴影（浅色页内卡片；需传入当前主题 primary 以渲染炫动风色晕） */
export function chetaSurfaceShadow(variant: ChetaVisualVariantId, primary: string): string {
  switch (variant) {
    case 'institutional':
      return '0 1px 2px rgba(15,23,42,0.08), 0 10px 28px rgba(15,23,42,0.07)'
    /** Apple HIG + 领导投屏：多层柔扩散 + 略抬升，仍避免炫动方案色晕 */
    case 'appleHig':
      return '0 1px 2px rgba(0,0,0,0.045), 0 8px 32px rgba(0,0,0,0.072), 0 22px 56px rgba(0,0,0,0.048)'
    case 'editorial':
      return '0 1px 2px rgba(62,48,32,0.07), 0 12px 34px rgba(62,48,32,0.08), 0 24px 52px rgba(15,23,42,0.05)'
    case 'command':
      return '0 0 0 1px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.07)'
    case 'trust':
      return '0 1px 2px rgba(15,23,42,0.08), 0 12px 30px rgba(15,23,42,0.09), 0 0 0 1px rgba(176,140,62,0.12)'
    case 'nightOps':
      return `0 0 0 1px color-mix(in srgb, ${primary} 22%, rgba(15,23,42,0.25)), 0 4px 18px rgba(0,0,0,0.12)`
    case 'vibrant':
      return `0 6px 20px rgba(15,23,42,0.12), 0 14px 38px -12px ${primary}40`
    case 'minimal':
      return '0 1px 0 rgba(15,23,42,0.06)'
  }
}

/** 卡片悬停阴影 — 对齐 neoWebSchool OverviewCard cardShadowHover */
export function chetaSurfaceShadowHover(variant: ChetaVisualVariantId, primary: string): string {
  switch (variant) {
    case 'appleHig':
      return '0 1px 0 rgba(255,255,255,0.95) inset, 0 14px 42px -18px rgba(15,23,42,0.18), 0 10px 30px rgba(0,0,0,0.08)'
    case 'editorial':
      return '0 1px 2px rgba(62,48,32,0.08), 0 16px 40px rgba(62,48,32,0.1), 0 24px 52px rgba(15,23,42,0.06)'
    case 'institutional':
      return '0 1px 2px rgba(15,23,42,0.1), 0 16px 36px rgba(15,23,42,0.12)'
    case 'command':
      return '0 0 0 1px rgba(15,23,42,0.16), 0 6px 16px rgba(15,23,42,0.1)'
    case 'trust':
      return '0 1px 2px rgba(15,23,42,0.1), 0 14px 34px rgba(15,23,42,0.11), 0 0 0 1px rgba(176,140,62,0.16)'
    case 'nightOps':
      return `0 0 0 1px color-mix(in srgb, ${primary} 32%, rgba(15,23,42,0.3)), 0 8px 28px rgba(0,0,0,0.18)`
    case 'vibrant':
      return `0 8px 24px rgba(15,23,42,0.14), 0 16px 42px -10px ${primary}55`
    case 'minimal':
      return '0 2px 8px rgba(15,23,42,0.08)'
  }
}

/** 浅色模式下整页背景（由 ChetaLayout 写入 --cheta-page-bg-light） */
export function chetaPageBgLight(variant: ChetaVisualVariantId): string {
  switch (variant) {
    case 'institutional':
      return 'linear-gradient(180deg, #e9eff8 0%, #dbe5f2 50%, #cfdced 100%)'
    case 'appleHig':
      return 'linear-gradient(180deg, oklch(0.979 0.004 264) 0%, oklch(0.965 0.006 264) 48%, oklch(0.958 0.006 264) 100%)'
    case 'editorial':
      return 'linear-gradient(180deg, #f5efe5 0%, #eadfcf 46%, #dfd1bc 100%)'
    case 'command':
      return 'linear-gradient(180deg, #e1e9f4 0%, #d3deec 52%, #c5d3e5 100%)'
    case 'trust':
      return 'linear-gradient(180deg, #e0e9f7 0%, #d1deef 50%, #c2d2e8 100%)'
    case 'nightOps':
      return 'linear-gradient(180deg, #eceef3 0%, #e2e5ed 48%, #d9dde8 100%)'
    case 'vibrant':
      return 'linear-gradient(180deg, #dce8ff 0%, #dce9ff 45%, #d2e1f8 100%)'
    case 'minimal':
      return '#ffffff'
  }
}

/** 浅色平台看板皮肤 — 启用卡片悬停抬升（与 neoWebSchool isOverviewPlatformSkin 对齐） */
export function chetaLeaderPlatformSkin(variant: ChetaVisualVariantId, isLight: boolean): boolean {
  return isLight && variant !== 'minimal'
}

/** Apple 液态玻璃 · 流光页底（叠加在 HIG 冷灰渐变上） */
export function chetaLiquidGlassPageBg(variant: ChetaVisualVariantId, accent: string): string {
  const base = chetaPageBgLight(variant)
  return [
    `radial-gradient(ellipse 120% 80% at 8% -18%, color-mix(in srgb, ${accent} 16%, transparent) 0%, transparent 52%)`,
    `radial-gradient(ellipse 90% 55% at 100% 0%, rgba(99,102,241,0.09) 0%, transparent 48%)`,
    `radial-gradient(ellipse 70% 45% at 50% 100%, color-mix(in srgb, ${accent} 9%, transparent) 0%, transparent 50%)`,
    base,
  ].join(', ')
}

/** 领导端卡片毛玻璃 backdrop（appleHig / liquid-glass） */
export function chetaLeaderCardBackdrop(
  variant: ChetaVisualVariantId,
  overviewTheme: string,
  isLight: boolean,
): string {
  if (!isLight) return 'none'
  if (overviewTheme === 'liquid-glass' && variant === 'appleHig') {
    return 'blur(36px) saturate(195%)'
  }
  if (variant === 'appleHig' || variant === 'editorial') {
    return 'blur(28px) saturate(190%)'
  }
  return 'none'
}

export function chetaParticleOpacity(variant: ChetaVisualVariantId, isLight: boolean): number {
  switch (variant) {
    case 'institutional':
      return isLight ? 0.05 : 0.4
    case 'appleHig':
      return isLight ? 0.018 : 0.24
    case 'editorial':
      return isLight ? 0.02 : 0.22
    case 'command':
      return isLight ? 0.03 : 0.24
    case 'trust':
      return isLight ? 0.025 : 0.2
    case 'nightOps':
      return isLight ? 0.05 : 0.38
    case 'vibrant':
      return isLight ? 0.08 : 0.42
    case 'minimal':
      return isLight ? 0.04 : 0.22
  }
}

/** 深色模式下主内容区额外光晕（叠在 VI.bgDeep 上） */
export function chetaLayoutDarkBackgroundImage(
  variant: ChetaVisualVariantId,
  vi: { primary: string; secondary: string; accent: string },
): string | undefined {
  switch (variant) {
    case 'institutional':
      return `radial-gradient(circle at 12% 18%, ${vi.primary}16 0%, transparent 30%), radial-gradient(circle at 84% 4%, ${vi.secondary}14 0%, transparent 28%), radial-gradient(circle at 70% 78%, ${vi.accent}10 0%, transparent 34%)`
    case 'appleHig':
      return `radial-gradient(ellipse 100% 60% at 50% -12%, ${vi.primary}12 0%, transparent 58%), radial-gradient(ellipse 70% 45% at 100% 100%, ${vi.primary}08 0%, transparent 50%)`
    case 'editorial':
      return `radial-gradient(ellipse 90% 55% at 50% -8%, ${vi.primary}0e 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(180,140,90,0.09) 0%, transparent 48%)`
    case 'command':
      return `radial-gradient(ellipse 80% 50% at 8% 12%, ${vi.primary}10 0%, transparent 40%), radial-gradient(circle at 92% 88%, ${vi.secondary}09 0%, transparent 36%)`
    case 'trust':
      return `radial-gradient(ellipse 100% 55% at 50% -10%, ${vi.primary}10 0%, transparent 52%), radial-gradient(circle at 80% 92%, rgba(176,140,62,0.1) 0%, transparent 40%)`
    case 'nightOps':
      return `radial-gradient(ellipse 110% 70% at 50% -18%, ${vi.primary}18 0%, transparent 55%), radial-gradient(circle at 12% 72%, ${vi.accent}16 0%, transparent 38%), radial-gradient(circle at 92% 30%, ${vi.secondary}14 0%, transparent 35%)`
    case 'vibrant':
      return `radial-gradient(circle at 10% 20%, ${vi.primary}24 0%, transparent 34%), radial-gradient(circle at 88% 8%, ${vi.secondary}20 0%, transparent 32%), radial-gradient(circle at 72% 82%, ${vi.accent}18 0%, transparent 38%)`
    case 'minimal':
      return `radial-gradient(circle at 50% 0%, ${vi.primary}12 0%, transparent 42%)`
  }
}

/** 顶栏激活色（浅色模式） */
export function chetaLeaderNavAccent(variant: ChetaVisualVariantId): {
  solid: string
  softBg: string
  softBorder: string
} {
  switch (variant) {
    case 'minimal':
      return { solid: '#0F172A', softBg: 'rgba(15,23,42,0.1)', softBorder: 'rgba(15,23,42,0.22)' }
    case 'appleHig':
      return {
        solid: '#0A66D8',
        softBg: 'rgba(10,102,216,0.11)',
        softBorder: 'rgba(10,102,216,0.16)',
      }
    case 'nightOps':
      return {
        solid: '#0E7490',
        softBg: 'rgba(14,116,144,0.14)',
        softBorder: 'rgba(14,116,144,0.24)',
      }
    case 'institutional':
      return { solid: '#1D4ED8', softBg: 'rgba(29,78,216,0.13)', softBorder: 'rgba(29,78,216,0.2)' }
    case 'vibrant':
      return {
        solid: '#4F46E5',
        softBg: 'rgba(79,70,229,0.16)',
        softBorder: 'rgba(79,70,229,0.26)',
      }
    case 'editorial':
      return {
        solid: '#9A3412',
        softBg: 'rgba(154,52,18,0.14)',
        softBorder: 'rgba(154,52,18,0.24)',
      }
    case 'command':
      return { solid: '#0F172A', softBg: 'rgba(15,23,42,0.14)', softBorder: 'rgba(15,23,42,0.24)' }
    case 'trust':
      return {
        solid: '#1E3A8A',
        softBg: 'rgba(30,58,138,0.14)',
        softBorder: 'rgba(30,58,138,0.24)',
      }
  }
}

export type ChetaLeaderNavPattern = 'underline' | 'pill' | 'segmented' | 'block' | 'outlined'

/** 顶栏导航形态（让方案差异不只停留在色彩） */
export function chetaLeaderNavPattern(variant: ChetaVisualVariantId): ChetaLeaderNavPattern {
  switch (variant) {
    case 'minimal':
      return 'underline'
    case 'appleHig':
      return 'segmented'
    case 'nightOps':
      return 'outlined'
    case 'institutional':
      return 'block'
    case 'vibrant':
      return 'pill'
    case 'editorial':
      return 'underline'
    case 'command':
      return 'segmented'
    case 'trust':
      return 'outlined'
  }
}

/** 浅色模式的全局视觉语气（确保首屏一眼可辨） */
export function chetaLeaderLightTone(variant: ChetaVisualVariantId): {
  navBg: string
  navBorder: string
  navMuted: string
  brandBg: string
  brandText: string
  pageOverlay: string
} {
  switch (variant) {
    case 'minimal':
      return {
        navBg: 'rgba(255,255,255,0.96)',
        navBorder: 'rgba(15,23,42,0.14)',
        navMuted: '#6B7280',
        brandBg: '#0F172A',
        brandText: '#0F172A',
        pageOverlay: 'none',
      }
    case 'appleHig':
      return {
        navBg: 'rgba(255,255,255,0.72)',
        navBorder: 'rgba(10,102,216,0.14)',
        navMuted: '#6B7280',
        brandBg: '#1e40af',
        brandText: '#1C1C1E',
        pageOverlay: 'none',
      }
    case 'nightOps':
      return {
        navBg: 'rgba(232,242,246,0.88)',
        navBorder: 'rgba(14,116,144,0.2)',
        navMuted: '#4B5563',
        brandBg: '#0E7490',
        brandText: '#0B3B46',
        pageOverlay:
          'linear-gradient(90deg, rgba(14,116,144,0.1) 0%, rgba(14,116,144,0.02) 50%, rgba(14,116,144,0.1) 100%)',
      }
    case 'institutional':
      return {
        navBg: 'rgba(232,240,251,0.92)',
        navBorder: 'rgba(29,78,216,0.2)',
        navMuted: '#475569',
        brandBg: '#1D4ED8',
        brandText: '#1E3A8A',
        pageOverlay:
          'linear-gradient(90deg, rgba(29,78,216,0.09) 0%, rgba(29,78,216,0.02) 52%, rgba(29,78,216,0.09) 100%)',
      }
    case 'vibrant':
      return {
        navBg: 'rgba(235,231,255,0.92)',
        navBorder: 'rgba(79,70,229,0.24)',
        navMuted: '#4C4B63',
        brandBg: '#4F46E5',
        brandText: '#312E81',
        pageOverlay:
          'linear-gradient(90deg, rgba(79,70,229,0.14) 0%, rgba(79,70,229,0.03) 50%, rgba(79,70,229,0.14) 100%)',
      }
    case 'editorial':
      return {
        navBg: 'rgba(247,236,220,0.92)',
        navBorder: 'rgba(154,52,18,0.24)',
        navMuted: '#6B4F3C',
        brandBg: '#9A3412',
        brandText: '#7C2D12',
        pageOverlay:
          'linear-gradient(90deg, rgba(154,52,18,0.12) 0%, rgba(154,52,18,0.02) 50%, rgba(154,52,18,0.12) 100%)',
      }
    case 'command':
      return {
        navBg: 'rgba(226,235,246,0.94)',
        navBorder: 'rgba(15,23,42,0.24)',
        navMuted: '#334155',
        brandBg: '#0F172A',
        brandText: '#0F172A',
        pageOverlay:
          'linear-gradient(90deg, rgba(15,23,42,0.11) 0%, rgba(15,23,42,0.02) 50%, rgba(15,23,42,0.11) 100%)',
      }
    case 'trust':
      return {
        navBg: 'rgba(226,234,247,0.92)',
        navBorder: 'rgba(30,58,138,0.24)',
        navMuted: '#3F4E67',
        brandBg: '#1E3A8A',
        brandText: '#1E3A8A',
        pageOverlay:
          'linear-gradient(90deg, rgba(30,58,138,0.12) 0%, rgba(176,140,62,0.04) 50%, rgba(30,58,138,0.12) 100%)',
      }
  }
}

/**
 * @deprecated 使用 `chetaSurfaceShadow(variant, primary)` 或 CSS `var(--cheta-surface-shadow)`
 * 保留别名以免旧代码大量改动；新代码请用变量。
 */
export const CHETA_INSTITUTIONAL_SURFACE_SHADOW = chetaSurfaceShadow('institutional', '#000000')

export type ChetaKpiKind = 'brand' | 'success' | 'warning' | 'danger'

export function chetaKpiLeftAccent(
  vi: { primary: string; accent: string; warning: string; danger: string },
  kind: ChetaKpiKind,
): string {
  switch (kind) {
    case 'brand':
      return vi.primary
    case 'success':
      return vi.accent
    case 'warning':
      return vi.warning
    case 'danger':
      return vi.danger
    default:
      return vi.primary
  }
}
