import { useLayoutEffect, useEffect, useState } from 'react'
import { chetaLeaderNavPattern } from 'lib/cheta-kpi-institutional'
import { presetToLeaderSkinCss } from 'lib/leader-overview-skin'
import {
  applyLeaderStylePreset,
  DEFAULT_LEADER_STYLE_PRESET,
  LEADER_STYLE_PRESET_CHANGE,
  readStoredLeaderStylePreset,
  readStoredLeaderStylePresetId,
} from 'lib/leader-style-presets'
import {
  useChetaVisualStyleVars,
  useChetaVisualVariant,
} from 'contexts/cheta-visual-variant-context'
import {
  readActiveDesignSystemId,
  resolveDesignSystemCssVars,
} from 'lib/ui-design-tokens'

const LEADER_SKIN_PROPS = [
  '--leader-page-bg',
  '--leader-page-bg-gradient',
  '--leader-card-bg',
  '--leader-card-border',
  '--leader-card-shadow',
  '--leader-card-radius',
  '--leader-text',
  '--leader-text-secondary',
  '--leader-text-muted',
  '--leader-accent',
  '--leader-font-body',
  '--leader-font-number',
  '--leader-grid-gap',
  '--leader-kpi-value-size',
  '--leader-kpi-label-size',
  '--leader-card-backdrop',
  '--leader-card-padding',
  '--leader-card-shadow-hover',
  '--cheta-card-radius',
  '--cheta-surface-shadow',
  '--cheta-nav-accent',
  '--cheta-nav-accent-soft',
  '--cheta-nav-accent-border',
  '--cheta-brand-bg',
  '--cheta-brand-title',
  '--cheta-brand-subtitle',
  '--cheta-light-nav-muted',
  '--cheta-light-nav-bg',
  '--cheta-light-nav-border',
  '--cheta-page-overlay',
  '--cheta-page-bg-light',
  '--cheta-page-content-max',
  '--cheta-leader-page-title-size',
  '--cheta-leader-page-subtitle-size',
  '--cheta-card-border-strong',
  '--cheta-card-inset',
  '--cheta-title-weight',
  '--cheta-kpi-weight',
  '--cheta-kpi-scale',
] as const

/** 全站注入：界面方案 A–H + 风格预设色系 → body CSS 变量（对齐 neoWebSchool LeaderSkinBridge） */
export function LeaderSkinBridge() {
  const { variant: chetaVisualVariant } = useChetaVisualVariant()
  const chetaVisualCssVars = useChetaVisualStyleVars()
  const navPattern = chetaLeaderNavPattern(chetaVisualVariant)
  const [presetTick, setPresetTick] = useState(0)

  useEffect(() => {
    const bump = () => setPresetTick((n) => n + 1)
    window.addEventListener(LEADER_STYLE_PRESET_CHANGE, bump)
    return () => window.removeEventListener(LEADER_STYLE_PRESET_CHANGE, bump)
  }, [])

  useLayoutEffect(() => {
    if (!readStoredLeaderStylePresetId()) {
      applyLeaderStylePreset(DEFAULT_LEADER_STYLE_PRESET)
    } else {
      applyLeaderStylePreset(readStoredLeaderStylePreset())
    }
  }, [])

  useLayoutEffect(() => {
    const body = document.body
    const preset = readStoredLeaderStylePreset()
    const designSystemId = readActiveDesignSystemId(preset.id, chetaVisualVariant)
    body.setAttribute('data-leader-skin', 'true')
    body.setAttribute('data-v6-overview-theme', preset.overview)
    body.setAttribute('data-cheta-nav-pattern', navPattern)
    body.setAttribute('data-cheta-visual', chetaVisualVariant)
    body.setAttribute('data-ui-design-system', designSystemId)

    for (const key of LEADER_SKIN_PROPS) {
      body.style.removeProperty(key)
    }

    // 界面方案 A–H 打底 → 色系 preset → 设计语言 token（后者覆盖圆角/材质/页底）
    const overviewSkin = presetToLeaderSkinCss(preset)
    const designSystemSkin = resolveDesignSystemCssVars(designSystemId, preset, chetaVisualVariant)
    const mergedSkin = { ...chetaVisualCssVars, ...overviewSkin, ...designSystemSkin }
    for (const [key, value] of Object.entries(mergedSkin)) {
      if (value != null && value !== '') {
        body.style.setProperty(key, String(value))
      }
    }
  }, [chetaVisualVariant, chetaVisualCssVars, navPattern, presetTick])

  useLayoutEffect(() => {
    const sync = () => applyLeaderStylePreset(readStoredLeaderStylePreset())
    window.addEventListener(LEADER_STYLE_PRESET_CHANGE, sync)
    return () => window.removeEventListener(LEADER_STYLE_PRESET_CHANGE, sync)
  }, [])

  return null
}
