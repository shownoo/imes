/**
 * 全站风格预设 — 领导端（对齐 neoWebSchool leader-style-presets.ts）
 */
import type { ChetaVisualVariantId } from 'lib/cheta-kpi-institutional'
import { applyPresetToDom, isDarkPreviewColor } from 'lib/preset-css'

const STORAGE_VARIANT = 'cheta-visual-variant'
const STORAGE_THEME = 'cheta-theme'
const STORAGE_OVERVIEW = 'v6-overview-theme'
const STORAGE_ANALYSIS = 'v6-analysis-theme'
const STORAGE_PRESET_ID = 'leader-style-preset-id'

export const LEADER_STYLE_PRESET_CHANGE = 'leader-style-preset-change'

export type OverviewTheme =
  | 'tech-blue'
  | 'hermes-tech'
  | 'deep-purple'
  | 'emerald'
  | 'apple-governance'
  | 'warm-gold'
  | 'forest-green'
  | 'vermilion-red'
  | 'royal-purple'
  | 'oxford-navy'
  | 'cambridge-green'
  | 'black-gold'
  | 'deep-sea'
  | 'bloomberg'
  | 'business-metal'
  | 'fintech-glow'
  | 'mesh-network'
  | 'molecular-blue'
  | 'liquid-glass'
  | 'hermes-blue'
  | 'aman-stone'
  | 'hermes-orange'
  | 'mckinsey-blue'
  | 'national-trend'
  | 'ink-academic'

export type AnalysisTheme = OverviewTheme | 'clear-blue' | 'neutral-gray' | 'warm-report'

export type LeaderStylePresetId =
  | 'modern-saas'
  | 'blue-professional'
  | 'apple-governance'
  | 'night-command'
  | 'hermes-tech'
  | 'gov-blue'
  | 'ink-minimal'
  | 'warm-gold'
  | 'forest-green'
  | 'vermilion-red'
  | 'royal-purple'
  // 深色系（大气 · 领导 · 高级感）
  | 'oxford-navy'
  | 'cambridge-green'
  | 'black-gold'
  | 'deep-sea'
  | 'bloomberg'
  | 'business-metal'
  | 'fintech-glow'
  | 'mesh-network'
  | 'molecular-blue'
  // 浅色系（院系 · 苹果 · 高级感）
  | 'liquid-glass'
  | 'hermes-blue'
  | 'aman-stone'
  | 'hermes-orange'
  | 'mckinsey-blue'
  | 'national-trend'
  | 'ink-academic'

export type LeaderStylePreset = {
  id: LeaderStylePresetId
  name: string
  /** 顶栏设置按钮缩写 */
  compactLabel: string
  desc: string
  variant: ChetaVisualVariantId
  themeId: string
  overview: OverviewTheme
  analysis: AnalysisTheme
  /** 缩略色卡 */
  preview: { bg: string; nav: string; card: string; border: string; accent: string }
}

export const LEADER_STYLE_PRESETS: LeaderStylePreset[] = [
  {
    id: 'modern-saas',
    name: '现代 SaaS',
    compactLabel: 'SaaS',
    desc: '浅色 · 圆角卡片 · 柔和阴影，日常治理与汇报',
    variant: 'appleHig',
    themeId: 'apple',
    overview: 'deep-purple',
    analysis: 'clear-blue',
    preview: {
      bg: '#F2F2F7',
      nav: '#0A66D8',
      card: '#FFFFFF',
      border: '#D7DFEA',
      accent: '#0A66D8',
    },
  },
  {
    id: 'blue-professional',
    name: '蓝灰专业',
    compactLabel: '蓝灰',
    desc: '浅色 · 蓝灰对比 · 稳重字阶，专业决策氛围',
    variant: 'appleHig',
    themeId: 'apple',
    overview: 'emerald',
    analysis: 'neutral-gray',
    preview: {
      bg: '#DBE5F2',
      nav: '#1D4ED8',
      card: '#F7FAFF',
      border: '#B9CAE6',
      accent: '#1D4ED8',
    },
  },
  {
    id: 'apple-governance',
    name: 'Apple 治理',
    compactLabel: '治理',
    desc: '浅色 · 极简留白 · 克制高光，领导参观首选',
    variant: 'minimal',
    themeId: 'apple',
    overview: 'apple-governance',
    analysis: 'apple-governance',
    preview: {
      bg: '#FFFFFF',
      nav: '#0F172A',
      card: '#FFFFFF',
      border: '#CBD5E1',
      accent: '#0F172A',
    },
  },
  {
    id: 'night-command',
    name: '夜航指挥',
    compactLabel: '夜航',
    desc: '深色 · 指挥舱光晕，大屏值守与展厅',
    variant: 'nightOps',
    themeId: 'techBlue',
    overview: 'tech-blue',
    analysis: 'clear-blue',
    preview: {
      bg: '#E2E5ED',
      nav: '#0E7490',
      card: '#F8FBFC',
      border: '#B7CBD2',
      accent: '#0E7490',
    },
  },
  {
    id: 'hermes-tech',
    name: '科技蓝·Ant',
    compactLabel: 'Ant',
    desc: '深色 · Ant Design 企业蓝 #1677FF，正蓝非青/霓虹',
    variant: 'nightOps',
    themeId: 'techBlue',
    overview: 'hermes-tech',
    analysis: 'clear-blue',
    preview: {
      bg: '#101826',
      nav: '#1B2538',
      card: '#243247',
      border: 'rgba(22,119,255,0.2)',
      accent: '#1677FF',
    },
  },
  {
    id: 'gov-blue',
    name: '政务蓝',
    compactLabel: '政务',
    desc: '浅色 · 政务蓝块导航 · 端庄权威，迎评迎检与对外汇报',
    variant: 'institutional',
    themeId: 'apple',
    overview: 'emerald',
    analysis: 'clear-blue',
    preview: {
      bg: '#E8F0FB',
      nav: '#1D4ED8',
      card: '#F7FAFF',
      border: '#B9CAE6',
      accent: '#1D4ED8',
    },
  },
  {
    id: 'ink-minimal',
    name: '墨玉极简',
    compactLabel: '墨玉',
    desc: '浅色 · 墨黑灰阶 · 极简留白，品牌展示与高级汇报',
    variant: 'command',
    themeId: 'apple',
    overview: 'apple-governance',
    analysis: 'neutral-gray',
    preview: {
      bg: '#F4F5F7',
      nav: '#0F172A',
      card: '#FFFFFF',
      border: '#CBD5E1',
      accent: '#0F172A',
    },
  },
  {
    id: 'warm-gold',
    name: '校色暖金',
    compactLabel: '暖金',
    desc: '浅色 · 暖金校色 · 述职简报版式，校庆迎评与特色展示',
    variant: 'editorial',
    themeId: 'apple',
    overview: 'warm-gold',
    analysis: 'warm-gold',
    preview: {
      bg: '#F7ECDC',
      nav: '#b45309',
      card: '#FFFFFF',
      border: '#E2CBB0',
      accent: '#b45309',
    },
  },
  {
    id: 'forest-green',
    name: '松韵绿',
    compactLabel: '松绿',
    desc: '浅色 · 雾松底 + 深松绿强调，生态农林与绿色发展、双高建设',
    variant: 'institutional',
    themeId: 'apple',
    overview: 'forest-green',
    analysis: 'forest-green',
    preview: {
      bg: '#EAF2EC',
      nav: '#15803d',
      card: '#FFFFFF',
      border: '#CADfce',
      accent: '#15803d',
    },
  },
  {
    id: 'vermilion-red',
    name: '朱砂红',
    compactLabel: '朱砂',
    desc: '浅色 · 暖陶土底 + 朱砂强调，党建校庆与红色文化、重大典礼',
    variant: 'editorial',
    themeId: 'apple',
    overview: 'vermilion-red',
    analysis: 'vermilion-red',
    preview: {
      bg: '#F6ECE8',
      nav: '#b91c1c',
      card: '#FFFFFF',
      border: '#E6CFC8',
      accent: '#b91c1c',
    },
  },
  {
    id: 'royal-purple',
    name: '黛紫',
    compactLabel: '黛紫',
    desc: '浅色 · 雾霭紫灰底 + 黛紫强调，创新数字与艺术设计、产业前沿',
    variant: 'vibrant',
    themeId: 'apple',
    overview: 'royal-purple',
    analysis: 'royal-purple',
    preview: {
      bg: '#EFECF7',
      nav: '#7c3aed',
      card: '#FFFFFF',
      border: '#DBD2EE',
      accent: '#7c3aed',
    },
  },
  // 深色系（大气 · 领导 · 高级感）
  {
    id: 'oxford-navy',
    name: '牛津藏青',
    compactLabel: '牛津',
    desc: '深色 · 深藏青学院底 + 学位金强调，学术权威 / 院系展示',
    variant: 'institutional',
    themeId: 'oxfordNavy',
    overview: 'oxford-navy',
    analysis: 'oxford-navy',
    preview: {
      bg: '#0A1730',
      nav: '#D9B65B',
      card: 'rgba(255,255,255,0.05)',
      border: 'rgba(120,160,210,0.18)',
      accent: '#D9B65B',
    },
  },
  {
    id: 'cambridge-green',
    name: '剑桥墨绿',
    compactLabel: '剑桥',
    desc: '深色 · 深墨绿学院底 + 玉色强调，生态 / 农林 / 双高建设',
    variant: 'institutional',
    themeId: 'cambridgeGreen',
    overview: 'cambridge-green',
    analysis: 'cambridge-green',
    preview: {
      bg: '#0A211B',
      nav: '#5BC79E',
      card: 'rgba(255,255,255,0.05)',
      border: 'rgba(110,200,170,0.20)',
      accent: '#5BC79E',
    },
  },
  {
    id: 'black-gold',
    name: '经典黑金',
    compactLabel: '黑金',
    desc: '深色 · 近黑曜石底 + 鎏金强调，典礼 / 高规格汇报 / 品牌展示',
    variant: 'command',
    themeId: 'blackGold',
    overview: 'black-gold',
    analysis: 'black-gold',
    preview: {
      bg: '#0C0C0E',
      nav: '#D4AF37',
      card: 'rgba(255,255,255,0.04)',
      border: 'rgba(212,175,55,0.18)',
      accent: '#D4AF37',
    },
  },
  {
    id: 'deep-sea',
    name: '深海蓝',
    compactLabel: '深海',
    desc: '深色 · 深海靛蓝底 + 青绿数据光晕，指挥舱 / 大屏值守 / 展厅',
    variant: 'nightOps',
    themeId: 'deepSea',
    overview: 'deep-sea',
    analysis: 'deep-sea',
    preview: {
      bg: '#03121F',
      nav: '#37D6BE',
      card: 'rgba(255,255,255,0.04)',
      border: 'rgba(43,167,201,0.2)',
      accent: '#37D6BE',
    },
  },
  {
    id: 'bloomberg',
    name: '终端琥珀',
    compactLabel: '终端',
    desc: '深色 · 终端黑底 + 琥珀数据流，金融级数据密度 / 监测大屏',
    variant: 'command',
    themeId: 'bloomberg',
    overview: 'bloomberg',
    analysis: 'bloomberg',
    preview: {
      bg: '#080808',
      nav: '#FF9A1F',
      card: 'rgba(255,255,255,0.035)',
      border: 'rgba(255,154,31,0.18)',
      accent: '#FF9A1F',
    },
  },
  {
    id: 'business-metal',
    name: '商务金属',
    compactLabel: '金属',
    desc: '深色 · 石墨金属底 + 青铜强调，大气稳重 / 高级商务汇报',
    variant: 'trust',
    themeId: 'businessMetal',
    overview: 'business-metal',
    analysis: 'business-metal',
    preview: {
      bg: '#16140F',
      nav: '#C2A05A',
      card: 'rgba(255,255,255,0.04)',
      border: 'rgba(194,160,90,0.18)',
      accent: '#C2A05A',
    },
  },
  {
    id: 'fintech-glow',
    name: '数据流光',
    compactLabel: '数据',
    desc: '深色 · 金融科技深蓝底 + 电光蓝/青数据流光晕，指挥舱 / 大屏值守 / 监测',
    variant: 'nightOps',
    themeId: 'fintechGlow',
    overview: 'fintech-glow',
    analysis: 'fintech-glow',
    preview: {
      bg: '#060B1A',
      nav: '#38BDF8',
      card: 'rgba(255,255,255,0.04)',
      border: 'rgba(56,189,248,0.22)',
      accent: '#38BDF8',
    },
  },
  {
    id: 'mesh-network',
    name: '星链网格',
    compactLabel: '星链',
    desc: '深色 · 多边形网络深靛蓝底 + 散布节点发光与连线感，数据拓扑 / 大屏 / 展厅',
    variant: 'vibrant',
    themeId: 'meshNetwork',
    overview: 'mesh-network',
    analysis: 'mesh-network',
    preview: {
      bg: '#0A0E24',
      nav: '#818CF8',
      card: 'rgba(255,255,255,0.04)',
      border: 'rgba(129,140,248,0.22)',
      accent: '#818CF8',
    },
  },
  {
    id: 'molecular-blue',
    name: '分子蓝',
    compactLabel: '分子',
    desc: '深色 · 发光蓝分子结构悬浮 + 数据网格光晕，科研创新 / 大屏值守 / 展厅',
    variant: 'nightOps',
    themeId: 'molecularBlue',
    overview: 'molecular-blue',
    analysis: 'molecular-blue',
    preview: {
      bg: '#03101F',
      nav: '#5AC8FA',
      card: 'rgba(255,255,255,0.05)',
      border: 'rgba(90,200,250,0.22)',
      accent: '#5AC8FA',
    },
  },
  // 浅色系（院系 · 苹果 · 高级感）
  {
    id: 'liquid-glass',
    name: '苹果液态玻璃',
    compactLabel: '玻璃',
    desc: '浅色 · 高透毛玻璃卡片 + 冷调流光底，领导参观 / 高级感首选',
    variant: 'appleHig',
    themeId: 'apple',
    overview: 'liquid-glass',
    analysis: 'liquid-glass',
    preview: {
      bg: '#eef2f8',
      nav: '#0A84FF',
      card: 'rgba(255,255,255,0.55)',
      border: 'rgba(255,255,255,0.6)',
      accent: '#0A84FF',
    },
  },
  {
    id: 'hermes-blue',
    name: '清透蓝',
    compactLabel: '清透',
    desc: '深色 · 皇家蓝渐变底 + 毛玻璃卡片，Hermes Agent 风',
    variant: 'appleHig',
    themeId: 'starBlue',
    overview: 'hermes-blue',
    analysis: 'hermes-blue',
    preview: {
      bg: '#0f172a',
      nav: '#60a5fa',
      card: 'rgba(255,255,255,0.14)',
      border: 'rgba(255,255,255,0.22)',
      accent: '#60a5fa',
    },
  },
  {
    id: 'aman-stone',
    name: '雅缦石韵',
    compactLabel: '雅缦',
    desc: '浅色 · 石灰岩奶底 + 实白卡 + 哑光青铜，极简奢华 / 高端留白',
    variant: 'minimal',
    themeId: 'apple',
    overview: 'aman-stone',
    analysis: 'aman-stone',
    preview: {
      bg: '#ece7df',
      nav: '#6F6453',
      card: 'rgba(255,255,255,0.92)',
      border: 'rgba(90,80,60,0.18)',
      accent: '#6F6453',
    },
  },
  {
    id: 'hermes-orange',
    name: '爱马仕橙',
    compactLabel: '爱马仕',
    desc: '浅色 · 暖奶皮底 + 实白卡 + 爱马仕橙强调，品牌特色 / 校庆迎评',
    variant: 'editorial',
    themeId: 'apple',
    overview: 'hermes-orange',
    analysis: 'hermes-orange',
    preview: {
      bg: '#f7ece0',
      nav: '#e8730c',
      card: 'rgba(255,255,255,0.92)',
      border: 'rgba(150,90,30,0.18)',
      accent: '#e8730c',
    },
  },
  {
    id: 'mckinsey-blue',
    name: '麦肯锡蓝',
    compactLabel: '麦肯锡',
    desc: '浅色 · 冷白底 + 实白卡 + 深海军蓝，专业咨询 / 决策汇报',
    variant: 'trust',
    themeId: 'apple',
    overview: 'mckinsey-blue',
    analysis: 'mckinsey-blue',
    preview: {
      bg: '#eef2f7',
      nav: '#173c6e',
      card: 'rgba(255,255,255,0.96)',
      border: 'rgba(30,55,100,0.18)',
      accent: '#173c6e',
    },
  },
  {
    id: 'national-trend',
    name: '国潮朱金',
    compactLabel: '国潮',
    desc: '浅色 · 暖象牙底 + 实白卡 + 朱砂转金渐变，国潮 / 红色文化 / 重大典礼',
    variant: 'editorial',
    themeId: 'apple',
    overview: 'national-trend',
    analysis: 'national-trend',
    preview: {
      bg: '#f7efe3',
      nav: '#c8341f',
      card: 'rgba(255,255,255,0.92)',
      border: 'rgba(140,60,30,0.18)',
      accent: '#c8341f',
    },
  },
  {
    id: 'ink-academic',
    name: '墨黑学院',
    compactLabel: '墨黑',
    desc: '浅色 · 中性灰白底 + 实白卡 + 墨黑强调，学术沉稳 / 品牌极简',
    variant: 'minimal',
    themeId: 'apple',
    overview: 'ink-academic',
    analysis: 'ink-academic',
    preview: {
      bg: '#f3f3f4',
      nav: '#2b2b30',
      card: '#ffffff',
      border: 'rgba(30,30,35,0.16)',
      accent: '#2b2b30',
    },
  },
]

export function resolveColorModeFromLeader(
  leaderPresetId: LeaderStylePresetId | OverviewTheme,
): 'light' | 'dark' {
  const preset = LEADER_STYLE_PRESETS.find((p) => p.id === leaderPresetId || p.overview === leaderPresetId)
  if (preset) return isDarkPreviewColor(preset.preview.bg) ? 'dark' : 'light'
  return 'light'
}

export function readStoredLeaderStylePresetId(): LeaderStylePresetId | null {
  try {
    const v = localStorage.getItem(STORAGE_PRESET_ID)
    if (v && LEADER_STYLE_PRESETS.some((p) => p.id === v)) return v as LeaderStylePresetId
  } catch {
    /* ignore */
  }
  return null
}

export function readStoredLeaderStylePreset(): LeaderStylePreset {
  const id = readStoredLeaderStylePresetId()
  return LEADER_STYLE_PRESETS.find((p) => p.id === id) ?? DEFAULT_LEADER_STYLE_PRESET
}

export function readStoredOverviewTheme(): OverviewTheme {
  try {
    const v = localStorage.getItem(STORAGE_OVERVIEW) as OverviewTheme | null
    if (v && LEADER_STYLE_PRESETS.some((p) => p.overview === v)) return v
    return readStoredLeaderStylePreset().overview
  } catch {
    /* ignore */
  }
  return DEFAULT_LEADER_STYLE_PRESET.overview
}

export function readStoredAnalysisTheme(): AnalysisTheme {
  try {
    const v = localStorage.getItem(STORAGE_ANALYSIS) as AnalysisTheme | null
    if (v) return v
  } catch {
    /* ignore */
  }
  return readStoredLeaderStylePreset().analysis
}

export function readStoredVisualVariant(): ChetaVisualVariantId | null {
  try {
    const v = localStorage.getItem(STORAGE_VARIANT) as ChetaVisualVariantId | null
    if (v) return v
  } catch {
    /* ignore */
  }
  return null
}

export function readStoredThemeId(): string | null {
  try {
    return localStorage.getItem(STORAGE_THEME)
  } catch {
    return null
  }
}

export type ApplyLeaderStylePresetOptions = {
  setVariant?: (v: ChetaVisualVariantId) => void
  setColorMode?: (mode: 'light' | 'dark') => void
}

export function applyLeaderStylePreset(
  preset: LeaderStylePreset,
  { setVariant, setColorMode }: ApplyLeaderStylePresetOptions = {},
): void {
  try {
    localStorage.setItem(STORAGE_VARIANT, preset.variant)
    localStorage.setItem(STORAGE_THEME, preset.themeId)
    localStorage.setItem(STORAGE_PRESET_ID, preset.id)
    localStorage.setItem(STORAGE_OVERVIEW, preset.overview)
    localStorage.setItem(STORAGE_ANALYSIS, preset.analysis)
    applyPresetToDom(preset)
    window.dispatchEvent(
      new CustomEvent(LEADER_STYLE_PRESET_CHANGE, { detail: { presetId: preset.id } }),
    )
  } catch {
    /* ignore */
  }

  setVariant?.(preset.variant)
  setColorMode?.(resolveColorModeFromLeader(preset.id))
}

export function matchCurrentPreset(
  variant: ChetaVisualVariantId,
  themeId: string,
  overview?: OverviewTheme,
  analysis?: AnalysisTheme,
): LeaderStylePreset | undefined {
  const ov = overview ?? readStoredOverviewTheme()
  const an = analysis ?? readStoredAnalysisTheme()
  return LEADER_STYLE_PRESETS.find(
    (p) => p.variant === variant && p.themeId === themeId && p.overview === ov && p.analysis === an,
  )
}

export const DEFAULT_LEADER_STYLE_PRESET: LeaderStylePreset = LEADER_STYLE_PRESETS[0]!
