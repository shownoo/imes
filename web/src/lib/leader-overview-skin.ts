import type { CSSProperties } from 'react'
import { chetaPageBgLight, chetaLiquidGlassPageBg, chetaLeaderCardBackdrop, chetaSurfaceShadow } from 'lib/cheta-kpi-institutional'
import { LEADER_FONT } from 'lib/leader-fonts'
import type { LeaderStylePreset } from 'lib/leader-style-presets'
import { isDarkPreviewColor } from 'lib/preset-css'

function solidCardBg(card: string): string {
  if (card.startsWith('rgba') || card.startsWith('rgb(')) return '#ffffff'
  return card
}

/** 风格预设 preview → 全站 --leader-* CSS 变量（对齐 neoWebSchool overviewThemeToLeaderSkinCss） */
export function presetToLeaderSkinCss(preset: LeaderStylePreset): Record<string, string> {
  const { preview: pv, variant } = preset
  const light = !isDarkPreviewColor(pv.bg)
  const cardSurface = solidCardBg(pv.card)
  const cardShadow = chetaSurfaceShadow(variant, pv.accent)
  const pageBg = light
    ? preset.overview === 'liquid-glass' && variant === 'appleHig'
      ? chetaLiquidGlassPageBg(variant, pv.accent)
      : chetaPageBgLight(variant)
    : pv.bg
  const cardBackdrop = chetaLeaderCardBackdrop(variant, preset.overview, light)

  const lightChrome: Record<string, string> = light
    ? {
        '--cheta-nav-accent': pv.accent,
        '--cheta-nav-accent-soft': `color-mix(in srgb, ${pv.accent} 12%, transparent)`,
        '--cheta-nav-accent-border': `color-mix(in srgb, ${pv.accent} 24%, transparent)`,
        '--cheta-light-nav-muted': light ? '#64748B' : '#94A3B8',
        '--cheta-light-nav-bg': `color-mix(in srgb, ${pv.bg} 36%, ${cardSurface})`,
        '--cheta-light-nav-border': pv.border,
        '--cheta-brand-bg': pv.nav,
        '--cheta-brand-title': light ? '#0F172A' : '#F8FAFC',
        '--cheta-brand-subtitle': light ? '#64748B' : '#94A3B8',
        '--cheta-page-overlay': `linear-gradient(90deg, color-mix(in srgb, ${pv.accent} 6%, transparent) 0%, transparent 52%, color-mix(in srgb, ${pv.accent} 6%, transparent) 100%)`,
      }
    : {
        '--cheta-nav-accent': pv.accent,
        '--cheta-nav-accent-soft': `color-mix(in srgb, ${pv.accent} 14%, transparent)`,
        '--cheta-nav-accent-border': `color-mix(in srgb, ${pv.accent} 26%, transparent)`,
        '--cheta-card-border-strong': pv.border,
        '--cheta-card-inset': `0 0 0 1px ${pv.border} inset`,
      }

  return {
    ...lightChrome,
    '--leader-page-bg': pageBg,
    '--leader-card-bg': pv.card,
    '--leader-card-border': pv.border,
    '--leader-card-shadow': cardShadow,
    '--leader-card-backdrop': cardBackdrop,
    '--leader-card-radius': variant === 'appleHig' ? '18px' : variant === 'minimal' ? '10px' : '14px',
    '--leader-text': light ? '#0F172A' : '#F8FAFC',
    '--leader-text-secondary': light ? '#334155' : '#CBD5E1',
    '--leader-text-muted': light ? '#64748B' : '#94A3B8',
    '--leader-accent': pv.accent,
    '--leader-font-body': LEADER_FONT.body,
    '--leader-font-number': LEADER_FONT.number,
    '--cheta-card-radius': variant === 'appleHig' ? '18px' : '14px',
    '--cheta-surface-shadow': cardShadow,
    '--leader-grid-gap': variant === 'command' ? '10px' : '16px',
    '--leader-kpi-value-size': variant === 'command' ? '1.48rem' : '1.75rem',
    '--leader-kpi-label-size': '0.8125rem',
  } as Record<string, string>
}
