/**
 * CHETA 领导端界面风格（方案 A–H）— 对齐 neoWebSchool cheta-visual-variant-context
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  CHETA_VISUAL_VARIANT_OPTIONS,
  chetaLeaderLightTone,
  chetaLeaderNavAccent,
  chetaLeaderSubtitleSizeVar,
  chetaLeaderTitleSizeVar,
  chetaPageBgLight,
  chetaPageContentMax,
  chetaSurfaceShadow,
  chetaSurfaceShadowHover,
  type ChetaVisualVariantId,
} from 'lib/cheta-kpi-institutional'
import { LEADER_STYLE_PRESET_CHANGE } from 'lib/leader-style-presets'
import { applyVisualVariantToDom } from 'lib/preset-css'

export type { ChetaVisualVariantId }
export { CHETA_VISUAL_VARIANT_OPTIONS }

const STORAGE_KEY = 'cheta-visual-variant'
const DEFAULT_VISUAL_VARIANT: ChetaVisualVariantId = 'appleHig'

const STORED_VARIANTS = new Set<ChetaVisualVariantId>([
  'institutional',
  'vibrant',
  'minimal',
  'appleHig',
  'editorial',
  'command',
  'trust',
  'nightOps',
])

function readStoredVariant(): ChetaVisualVariantId {
  if (typeof window === 'undefined') return DEFAULT_VISUAL_VARIANT
  const v = window.localStorage.getItem(STORAGE_KEY)
  if (v && STORED_VARIANTS.has(v as ChetaVisualVariantId)) return v as ChetaVisualVariantId
  return DEFAULT_VISUAL_VARIANT
}

type ChetaVisualVariantContextValue = {
  variant: ChetaVisualVariantId
  setVariant: (v: ChetaVisualVariantId) => void
}

const ChetaVisualVariantContext = createContext<ChetaVisualVariantContextValue | null>(null)

export function ChetaVisualVariantProvider({ children }: { children: ReactNode }) {
  const [variant, setVariantState] = useState<ChetaVisualVariantId>(readStoredVariant)

  const setVariant = useCallback((v: ChetaVisualVariantId) => {
    setVariantState(v)
    try {
      window.localStorage.setItem(STORAGE_KEY, v)
      const accent = chetaLeaderNavAccent(v).solid
      applyVisualVariantToDom(v, accent)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('imes-visual-variant-change'))
  }, [])

  useEffect(() => {
    const sync = () => setVariantState(readStoredVariant())
    window.addEventListener(LEADER_STYLE_PRESET_CHANGE, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(LEADER_STYLE_PRESET_CHANGE, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const value = useMemo(() => ({ variant, setVariant }), [variant, setVariant])

  return (
    <ChetaVisualVariantContext.Provider value={value}>
      {children}
    </ChetaVisualVariantContext.Provider>
  )
}

export function useChetaVisualVariant(): ChetaVisualVariantContextValue {
  const ctx = useContext(ChetaVisualVariantContext)
  if (!ctx) {
    return { variant: DEFAULT_VISUAL_VARIANT, setVariant: () => {} }
  }
  return ctx
}

function readPrimaryAccent(): string {
  if (typeof window === 'undefined') return '#0A66D8'
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--leader-accent').trim()
  if (raw) return `hsl(${raw})`
  return chetaLeaderNavAccent(readStoredVariant()).solid
}

export function useChetaVisualStyleVars(): CSSProperties {
  const { variant } = useChetaVisualVariant()
  const primary = readPrimaryAccent()

  return useMemo(() => {
    const navAccent = chetaLeaderNavAccent(variant)
    const lightTone = chetaLeaderLightTone(variant)
    const visualPreset =
      variant === 'minimal'
        ? {
            cardRadius: '10px',
            cardBorder: 'rgba(15,23,42,0.12)',
            cardInset: 'none',
            titleWeight: '620',
            kpiWeight: '680',
            kpiScale: '0.96',
          }
        : variant === 'appleHig'
          ? {
              cardRadius: '18px',
              cardBorder: 'rgba(255,255,255,0.58)',
              cardInset: '0 1px 0 rgba(255,255,255,0.88) inset',
              titleWeight: '680',
              kpiWeight: '630',
              kpiScale: '1',
            }
          : variant === 'nightOps'
            ? {
                cardRadius: '14px',
                cardBorder: 'rgba(14,116,144,0.28)',
                cardInset: '0 0 0 1px rgba(14,116,144,0.22) inset',
                titleWeight: '700',
                kpiWeight: '760',
                kpiScale: '1.04',
              }
            : variant === 'editorial'
              ? {
                  cardRadius: '8px',
                  cardBorder: 'rgba(154,52,18,0.18)',
                  cardInset: '0 1px 0 rgba(255,255,255,0.7) inset',
                  titleWeight: '700',
                  kpiWeight: '700',
                  kpiScale: '1.02',
                }
              : variant === 'command'
                ? {
                    cardRadius: '11px',
                    cardBorder: 'rgba(15,23,42,0.26)',
                    cardInset: '0 0 0 1px rgba(15,23,42,0.2) inset',
                    titleWeight: '720',
                    kpiWeight: '780',
                    kpiScale: '1.06',
                  }
                : variant === 'vibrant'
                  ? {
                      cardRadius: '16px',
                      cardBorder: 'rgba(79,70,229,0.26)',
                      cardInset: '0 0 0 1px rgba(79,70,229,0.18) inset',
                      titleWeight: '680',
                      kpiWeight: '740',
                      kpiScale: '1.04',
                    }
                  : variant === 'trust'
                    ? {
                        cardRadius: '12px',
                        cardBorder: 'rgba(30,58,138,0.26)',
                        cardInset: '0 0 0 1px rgba(176,140,62,0.2) inset',
                        titleWeight: '700',
                        kpiWeight: '760',
                        kpiScale: '1.03',
                      }
                    : {
                        cardRadius: '14px',
                        cardBorder: 'rgba(29,78,216,0.2)',
                        cardInset: '0 0 0 1px rgba(29,78,216,0.14) inset',
                        titleWeight: '700',
                        kpiWeight: '730',
                        kpiScale: '1.02',
                      }

    return {
      '--cheta-surface-shadow': chetaSurfaceShadow(variant, navAccent.solid),
      '--cheta-page-bg-light': chetaPageBgLight(variant),
      '--cheta-page-content-max': chetaPageContentMax(variant),
      '--cheta-leader-page-title-size': chetaLeaderTitleSizeVar(variant),
      '--cheta-leader-page-subtitle-size': chetaLeaderSubtitleSizeVar(variant),
      '--cheta-nav-accent': navAccent.solid,
      '--cheta-nav-accent-soft': navAccent.softBg,
      '--cheta-nav-accent-border': navAccent.softBorder,
      '--cheta-light-nav-bg': lightTone.navBg,
      '--cheta-light-nav-border': lightTone.navBorder,
      '--cheta-light-nav-muted': lightTone.navMuted,
      '--cheta-brand-bg': lightTone.brandBg,
      '--cheta-brand-text': lightTone.brandText,
      '--cheta-page-overlay': lightTone.pageOverlay,
      '--cheta-card-radius': visualPreset.cardRadius,
      '--cheta-card-border-strong': visualPreset.cardBorder,
      '--cheta-card-inset': visualPreset.cardInset,
      '--cheta-title-weight': visualPreset.titleWeight,
      '--cheta-kpi-weight': visualPreset.kpiWeight,
      '--cheta-kpi-scale': visualPreset.kpiScale,
      '--leader-card-shadow': chetaSurfaceShadow(variant, navAccent.solid),
      '--leader-card-shadow-hover': chetaSurfaceShadowHover(variant, navAccent.solid),
      '--leader-card-radius': visualPreset.cardRadius,
      '--leader-content-max': chetaPageContentMax(variant),
    } as CSSProperties
  }, [variant, primary])
}
