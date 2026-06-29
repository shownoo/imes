import {
  chetaLeaderNavPattern,
  chetaPageBgLight,
  chetaPageContentMax,
  chetaSurfaceShadow,
  type ChetaVisualVariantId,
} from 'lib/cheta-kpi-institutional'
import type { LeaderStylePreset } from 'lib/leader-style-presets'

function parseHex(input: string): { r: number; g: number; b: number } | null {
  if (!input.startsWith('#') || input.length < 7) return null
  const hex = input.slice(1, 7)
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

export function isDarkPreviewColor(input: string): boolean {
  const rgb = parseHex(input)
  if (!rgb) return input.includes('0.0') || input.startsWith('#0') || input.startsWith('#1')
  const l = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return l < 0.45
}

function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function accentToHsl(accent: string): string {
  const rgb = parseHex(accent)
  if (!rgb) return '221 83% 53%'
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

export function buildPresetCssVars(preset: LeaderStylePreset): Record<string, string> {
  const { preview: pv, variant } = preset
  const light = !isDarkPreviewColor(pv.bg)
  const accentHsl = accentToHsl(pv.accent)

  return {
    '--background': light ? '210 40% 98%' : '222 47% 5%',
    '--foreground': light ? '222 47% 11%' : '210 40% 98%',
    '--card': light ? '0 0% 100%' : '222 47% 7%',
    '--card-foreground': light ? '222 47% 11%' : '210 40% 98%',
    '--popover': light ? '0 0% 100%' : '222 47% 8%',
    '--popover-foreground': light ? '222 47% 11%' : '210 40% 98%',
    '--primary': accentHsl,
    '--primary-foreground': light ? '210 40% 98%' : '222 47% 5%',
    '--muted': light ? '210 40% 96%' : '217 33% 14%',
    '--muted-foreground': light ? '215 16% 47%' : '215 20% 55%',
    '--border': light ? '214 32% 91%' : '217 33% 18%',
    '--input': light ? '214 32% 91%' : '217 33% 18%',
    '--ring': light ? accentHsl : '199 89% 48%',
    '--secondary': light ? '210 40% 96%' : '217 33% 14%',
    '--secondary-foreground': light ? '222 47% 11%' : '210 40% 98%',
    '--accent': light ? '210 40% 96%' : '217 33% 16%',
    '--accent-foreground': light ? '222 47% 11%' : '210 40% 98%',
    '--leader-page-bg': light ? chetaPageBgLight(variant) : `linear-gradient(165deg, ${pv.bg} 0%, color-mix(in srgb, ${pv.bg} 85%, ${pv.accent}) 100%)`,
    '--leader-nav-bg': light ? 'hsla(0, 0%, 100%, 0.88)' : `color-mix(in srgb, ${pv.nav} 92%, transparent)`,
    '--leader-card-bg': pv.card.startsWith('rgba') ? pv.card : `color-mix(in srgb, ${pv.card} 95%, transparent)`,
    '--leader-card-border': pv.border,
    '--leader-card-shadow': chetaSurfaceShadow(variant, pv.accent),
    '--leader-accent': accentHsl,
    '--leader-content-max': chetaPageContentMax(variant),
    '--leader-grid-gap': variant === 'command' ? '10px' : variant === 'minimal' ? '12px' : '16px',
    '--leader-card-radius': variant === 'minimal' ? '8px' : variant === 'appleHig' ? '14px' : '12px',
    '--cheta-page-bg-light': chetaPageBgLight(variant),
    '--cheta-page-content-max': chetaPageContentMax(variant),
  }
}

export function applyPresetToDom(preset: LeaderStylePreset) {
  const root = document.documentElement
  const light = !isDarkPreviewColor(preset.preview.bg)
  root.classList.toggle('dark', !light)
  Object.entries(buildPresetCssVars(preset)).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  document.body.setAttribute('data-imes-skin', preset.id)
  document.body.setAttribute('data-cheta-visual', preset.variant)
  document.body.setAttribute('data-cheta-nav-pattern', chetaLeaderNavPattern(preset.variant))
  document.body.setAttribute('data-leader-skin', 'true')
  document.body.setAttribute('data-v6-overview-theme', preset.overview)
}

export function applyVisualVariantToDom(variant: ChetaVisualVariantId, accent = '#0A66D8') {
  document.body.setAttribute('data-cheta-visual', variant)
  document.body.setAttribute('data-cheta-nav-pattern', chetaLeaderNavPattern(variant))
  const root = document.documentElement
  root.style.setProperty('--cheta-page-bg-light', chetaPageBgLight(variant))
  root.style.setProperty('--cheta-page-content-max', chetaPageContentMax(variant))
  root.style.setProperty('--leader-card-shadow', chetaSurfaceShadow(variant, accent))
  root.style.setProperty('--leader-content-max', chetaPageContentMax(variant))
}
