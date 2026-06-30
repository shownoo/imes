import type { ChetaVisualVariantId } from 'lib/cheta-kpi-institutional'
import {
  chetaLiquidGlassPageBg,
  chetaPageBgLight,
  chetaLeaderCardBackdrop,
} from 'lib/cheta-kpi-institutional'
import type { LeaderStylePreset } from 'lib/leader-style-presets'
import { isDarkPreviewColor } from 'lib/preset-css'
import {
  inferCatalogSelection,
  readStoredDesignSystemId,
  type UiDesignSystemId,
} from 'lib/ui-design-catalog'

export type UiDesignSystemFeatures = {
  /** Apple HIG 顶部微光 */
  glassSheen: boolean
  /** M3 表面容器分层 */
  layeredSurface: boolean
  /** Carbon 等扁平无阴影 */
  flatSurface: boolean
}

const FEATURES: Record<UiDesignSystemId, UiDesignSystemFeatures> = {
  'material-3': { glassSheen: false, layeredSurface: true, flatSurface: false },
  'modern-admin': { glassSheen: false, layeredSurface: false, flatSurface: false },
  'apple-hig': { glassSheen: true, layeredSurface: false, flatSurface: false },
  'fluent-2': { glassSheen: false, layeredSurface: false, flatSurface: false },
  'ibm-carbon': { glassSheen: false, layeredSurface: false, flatSurface: true },
  'gov-standard': { glassSheen: false, layeredSurface: false, flatSurface: false },
  'linear-pro': { glassSheen: false, layeredSurface: false, flatSurface: false },
  'geist-dark': { glassSheen: false, layeredSurface: false, flatSurface: false },
  'stripe-dashboard': { glassSheen: false, layeredSurface: false, flatSurface: false },
  'figma-ui3': { glassSheen: false, layeredSurface: false, flatSurface: false },
}

export function getDesignSystemFeatures(id: UiDesignSystemId): UiDesignSystemFeatures {
  return FEATURES[id]
}

export function readActiveDesignSystemId(
  presetId?: LeaderStylePreset['id'],
  variant?: ChetaVisualVariantId,
): UiDesignSystemId {
  const stored = readStoredDesignSystemId()
  if (stored) return stored
  if (presetId && variant) {
    return inferCatalogSelection(presetId, variant).designSystemId
  }
  return 'material-3'
}

/** 设计语言 → 全站 CSS 变量（圆角 / 材质 / 页底），与色系 preset 合并注入 body */
export function resolveDesignSystemCssVars(
  designSystemId: UiDesignSystemId,
  preset: LeaderStylePreset,
  variant: ChetaVisualVariantId,
): Record<string, string> {
  const { preview: pv } = preset
  const light = !isDarkPreviewColor(pv.bg)
  const accent = pv.accent

  const base: Record<string, string> = {
    '--ui-ds-input-radius': '8px',
    '--ui-ds-button-radius': '8px',
    '--ui-ds-form-input-bg': light ? '#ffffff' : 'transparent',
    '--ui-ds-form-input-border': 'var(--leader-card-border, hsl(var(--border)))',
    '--ui-ds-primary-btn-shadow': 'none',
    '--leader-card-backdrop': chetaLeaderCardBackdrop(variant, preset.overview, light),
  }

  switch (designSystemId) {
    case 'material-3':
      return {
        ...base,
        '--cheta-card-radius': '16px',
        '--leader-card-radius': '16px',
        '--ui-ds-input-radius': '8px',
        '--ui-ds-button-radius': '9999px',
        /* 表单：白底 + 中性描边，避免主题色浸染发灰发蓝 */
        '--ui-ds-form-input-bg': light ? 'hsl(var(--background))' : 'transparent',
        '--ui-ds-form-input-border': light
          ? 'color-mix(in srgb, hsl(var(--border)) 68%, transparent)'
          : `color-mix(in srgb, ${accent} 35%, transparent)`,
        '--ui-ds-primary-btn-shadow': `0 1px 2px rgba(0,0,0,0.08)`,
        '--leader-page-bg': light ? chetaPageBgLight(variant) : pv.bg,
        '--cheta-surface-shadow': light
          ? '0 1px 2px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.35)',
      }

    case 'apple-hig':
      return {
        ...base,
        '--cheta-card-radius': '18px',
        '--leader-card-radius': '18px',
        '--ui-ds-input-radius': '10px',
        '--ui-ds-button-radius': '10px',
        /* 新建/修改：输入框与卡片同表面，仅描边区分（iOS Settings Inset Grouped） */
        '--ui-ds-form-input-bg': light ? 'transparent' : pv.card,
        '--ui-ds-form-input-border': light
          ? 'color-mix(in srgb, hsl(var(--border)) 58%, transparent)'
          : `color-mix(in srgb, ${accent} 28%, transparent)`,
        '--ui-ds-primary-btn-shadow': `0 1px 2px rgba(0,0,0,0.07), 0 6px 18px color-mix(in srgb, ${accent} 32%, transparent)`,
        '--leader-page-bg':
          light && preset.overview === 'liquid-glass'
            ? chetaLiquidGlassPageBg(variant, accent)
            : light
              ? chetaPageBgLight(variant)
              : pv.bg,
        '--leader-card-backdrop':
          preset.overview === 'liquid-glass'
            ? 'blur(36px) saturate(195%)'
            : chetaLeaderCardBackdrop(variant, preset.overview, light),
      }

    case 'fluent-2':
      return {
        ...base,
        '--cheta-card-radius': '8px',
        '--leader-card-radius': '8px',
        '--ui-ds-input-radius': '4px',
        '--ui-ds-button-radius': '4px',
        '--ui-ds-form-input-bg': light ? '#ffffff' : 'transparent',
        '--ui-ds-form-input-border': light ? '#e1dfdd' : pv.border,
        '--ui-ds-primary-btn-shadow': '0 1px 2px rgba(0,0,0,0.1)',
        '--leader-page-bg': light ? '#f5f5f5' : pv.bg,
        '--cheta-surface-shadow': '0 1.6px 3.6px rgba(0,0,0,0.13), 0 0.3px 0.9px rgba(0,0,0,0.11)',
      }

    case 'ibm-carbon':
      return {
        ...base,
        '--cheta-card-radius': '0px',
        '--leader-card-radius': '0px',
        '--ui-ds-input-radius': '0px',
        '--ui-ds-button-radius': '0px',
        '--ui-ds-form-input-bg': light ? '#f4f4f4' : '#262626',
        '--ui-ds-form-input-border': light ? '#8d8d8d' : '#525252',
        '--leader-page-bg': light ? '#f4f4f4' : pv.bg,
        '--cheta-surface-shadow': 'none',
        '--leader-card-backdrop': 'none',
      }

    case 'gov-standard':
      return {
        ...base,
        '--cheta-card-radius': '6px',
        '--leader-card-radius': '6px',
        '--ui-ds-input-radius': '4px',
        '--ui-ds-button-radius': '4px',
        '--leader-page-bg': light ? '#e8f0fb' : pv.bg,
        '--cheta-surface-shadow': '0 1px 2px rgba(29,78,216,0.08)',
      }

    case 'linear-pro':
      return {
        ...base,
        '--cheta-card-radius': '12px',
        '--leader-card-radius': '12px',
        '--ui-ds-input-radius': '8px',
        '--ui-ds-button-radius': '8px',
        '--ui-ds-primary-btn-shadow': `0 0 0 1px color-mix(in srgb, ${accent} 18%, transparent), 0 4px 14px color-mix(in srgb, ${accent} 22%, transparent)`,
        '--leader-page-bg': light ? '#eef2ff' : pv.bg,
      }

    case 'geist-dark':
      return {
        ...base,
        '--cheta-card-radius': '10px',
        '--leader-card-radius': '10px',
        '--ui-ds-input-radius': '8px',
        '--ui-ds-button-radius': '8px',
        '--ui-ds-form-input-bg': 'rgba(255,255,255,0.04)',
        '--ui-ds-form-input-border': `color-mix(in srgb, ${accent} 35%, rgba(255,255,255,0.12))`,
        '--leader-page-bg': pv.bg,
        '--cheta-surface-shadow': `0 0 0 1px color-mix(in srgb, ${accent} 28%, rgba(255,255,255,0.08))`,
      }

    case 'stripe-dashboard':
      return {
        ...base,
        '--cheta-card-radius': '10px',
        '--leader-card-radius': '10px',
        '--ui-ds-input-radius': '6px',
        '--ui-ds-button-radius': '6px',
        '--leader-page-bg': light ? '#f6f9fc' : pv.bg,
        '--cheta-surface-shadow': '0 2px 5px -1px rgba(50,50,93,0.1), 0 1px 3px -1px rgba(0,0,0,0.08)',
      }

    case 'figma-ui3':
      return {
        ...base,
        '--cheta-card-radius': '14px',
        '--leader-card-radius': '14px',
        '--ui-ds-input-radius': '10px',
        '--ui-ds-button-radius': '10px',
        '--leader-page-bg': light ? '#fafafa' : pv.bg,
        '--cheta-surface-shadow': '0 1px 2px rgba(0,0,0,0.04)',
      }

    case 'modern-admin':
    default:
      return {
        ...base,
        '--cheta-card-radius': '12px',
        '--leader-card-radius': '12px',
        '--leader-page-bg': light ? chetaPageBgLight(variant) : pv.bg,
      }
  }
}
