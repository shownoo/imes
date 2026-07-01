import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import { useChetaVisualVariant } from 'contexts/cheta-visual-variant-context'
import {
  chetaLeaderKpiCommandStyle,
  chetaLeaderKpiPresentationStyle,
  chetaLeaderKpiWideGrid,
  chetaLeaderPlatformSkin,
} from 'lib/cheta-kpi-institutional'
import { useLeaderVi } from 'hooks/use-leader-vi'
import { OverviewCard } from 'components/overview-card'
import { cn } from 'lib/utils'

type LeaderVi = {
  text: string
  textMuted: string
  bgCard: string
  bgElevated: string
  border: string
  primary: string
}

type LeaderKpiItem = {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  /** 保留字段以兼容旧调用；方向 A 下统一为主色强调，不再使用彩虹底 */
  tone?: unknown
  onClick?: () => void
}

export function LeaderKpiGrid({ vi: viProp, items }: { vi?: LeaderVi; items: LeaderKpiItem[] }) {
  const { t } = useTranslation()
  const { variant } = useChetaVisualVariant()
  const viDefault = useLeaderVi()
  const vi = viProp ?? viDefault
  const isLight = viDefault.isLight
  const isPresentationStyle = chetaLeaderKpiPresentationStyle(variant)
  const isCommandStyle = chetaLeaderKpiCommandStyle(variant)
  const useWide12 = chetaLeaderKpiWideGrid(variant)
  const platformSkin = chetaLeaderPlatformSkin(variant, isLight)
  const iconChip = { bg: `${vi.primary}1F`, fg: vi.primary }

  const cardSurface =
    variant === 'vibrant'
      ? {
          background: `linear-gradient(165deg, ${vi.bgCard}, ${vi.bgElevated})`,
          boxShadow: 'var(--cheta-surface-shadow)' as const,
          border: `1px solid var(--cheta-card-border-strong, ${vi.border})`,
        }
      : isPresentationStyle && isLight
        ? {
            background:
              'linear-gradient(165deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.68) 100%)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.95) inset, 0 1px 2px rgba(0,0,0,0.04), 0 14px 42px -24px rgba(15,23,42,0.14), var(--cheta-surface-shadow)' as const,
            border: '1px solid var(--cheta-card-border-strong, rgba(255,255,255,0.62))',
          }
        : isPresentationStyle
          ? {
              background: vi.bgCard,
              boxShadow: 'var(--cheta-surface-shadow)' as const,
              border: `1px solid var(--cheta-card-border-strong, color-mix(in srgb, ${vi.border} 88%, transparent))`,
            }
          : isCommandStyle
            ? {
                background: `color-mix(in srgb, ${vi.bgCard} 96%, ${vi.primary})`,
                boxShadow: 'var(--cheta-surface-shadow)' as const,
                border: `1px solid var(--cheta-card-border-strong, color-mix(in srgb, ${vi.border} 88%, ${vi.primary}))`,
              }
            : {
                background: vi.bgCard,
                boxShadow: 'var(--cheta-surface-shadow)' as const,
                border: `1px solid var(--cheta-card-border-strong, ${vi.border})`,
              }

  const cardRadius = useWide12 ? 'var(--cheta-card-radius, 14px)' : 'var(--cheta-card-radius, 16px)'
  const cardPad = isPresentationStyle
    ? '16px 16px 14px'
    : isCommandStyle
      ? '11px 12px 10px'
      : '14px 14px 12px'
  /** 数值略收敛，更接近系统「标题 / 正文」比例，避免笨重感 */
  const valueSize = isPresentationStyle
    ? 'clamp(1.4rem, 2.15vw, 1.75rem)'
    : isCommandStyle
      ? 'clamp(1.22rem, 1.85vw, 1.48rem)'
      : '2.15rem'
  const labelSize = isPresentationStyle ? '0.8125rem' : isCommandStyle ? '0.78rem' : '0.86rem'
  const iconBox = isPresentationStyle ? 30 : isCommandStyle ? 26 : 28
  const iconR = isPresentationStyle ? 9 : isCommandStyle ? 8 : 9
  /** 方案级模板分流：不再所有皮肤共用一套网格 */
  const isInstitutionalTemplate = variant === 'institutional'
  const isEditorialTemplate = variant === 'editorial'
  const isCommandTemplate = variant === 'command'
  const gridClass = isCommandTemplate
    ? 'grid grid-cols-12 gap-2 md:gap-2.5'
    : isEditorialTemplate
      ? 'grid grid-cols-12 gap-3 md:gap-4 auto-rows-[minmax(96px,auto)]'
      : isInstitutionalTemplate
        ? 'grid grid-cols-12 gap-3 md:gap-4 auto-rows-[minmax(84px,auto)]'
        : useWide12
          ? 'grid grid-cols-12 gap-3 md:gap-4'
          : 'grid grid-cols-2 md:grid-cols-4 gap-3'

  const getCellClass = (idx: number) => {
    if (isCommandTemplate) return 'col-span-6 md:col-span-3'
    if (isEditorialTemplate) {
      if (idx === 0) return 'col-span-12 md:col-span-6 md:row-span-2'
      if (idx === 1) return 'col-span-12 md:col-span-6'
      return 'col-span-12 sm:col-span-6 md:col-span-3'
    }
    if (isInstitutionalTemplate) {
      if (idx === 0) return 'col-span-12 md:col-span-8 md:row-span-2'
      if (idx === 1) return 'col-span-12 md:col-span-4'
      return 'col-span-12 sm:col-span-6 md:col-span-4'
    }
    return useWide12 ? 'col-span-6 md:col-span-3' : undefined
  }

  return (
    <div>
      {isInstitutionalTemplate ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            padding: '0 4px',
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: vi.textMuted,
              fontWeight: 750,
            }}
          >{t('核心指标')}</div>
          <div
            style={{
              height: 1,
              flex: 1,
              marginLeft: 8,
              background: `linear-gradient(90deg, color-mix(in srgb, ${vi.primary} 45%, transparent), transparent)`,
            }}
          />
        </div>
      ) : null}
      <div
        className={gridClass}
        style={
          isInstitutionalTemplate
            ? {
                background: `linear-gradient(180deg, color-mix(in srgb, ${vi.primary} 10%, transparent) 0%, transparent 100%)`,
                border: `1px solid color-mix(in srgb, ${vi.primary} 20%, ${vi.border})`,
                borderRadius: 14,
                padding: 10,
              }
            : undefined
        }
      >
        {items.map((item, idx) => {
          const Icon = item.icon
          const tone = iconChip
          const labelColor = isPresentationStyle
            ? `color-mix(in srgb, ${vi.textMuted} 72%, ${vi.text} 28%)`
            : vi.textMuted

          const content = isPresentationStyle ? (
            variant === 'editorial' ? (
              <>
                <div
                  style={{
                    fontSize: '0.66rem',
                    color: vi.textMuted,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    paddingBottom: 6,
                    borderBottom: `1px dashed color-mix(in srgb, ${vi.border} 80%, transparent)`,
                  }}
                >{t('关键指标')}</div>
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', color: vi.textMuted, fontWeight: 600 }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 4,
                      border: `1px solid color-mix(in srgb, ${tone.fg} 35%, ${vi.border})`,
                      color: tone.fg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} strokeWidth={2.2} />
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 'clamp(1.52rem, 2.35vw, 1.95rem)',
                    lineHeight: 1.03,
                    color: vi.text,
                    fontWeight: 'var(--cheta-kpi-weight, 700)',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.024em',
                    transform: 'scale(var(--cheta-kpi-scale, 1))',
                    transformOrigin: 'left center',
                  }}
                >
                  {item.value}
                  {item.unit ? (
                    <span
                      style={{
                        marginLeft: 4,
                        fontSize: '0.8rem',
                        color: vi.textMuted,
                        fontWeight: 600,
                      }}
                    >
                      {item.unit}
                    </span>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span
                    style={{
                      fontSize: labelSize,
                      color: labelColor,
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.4,
                      paddingTop: 1,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      width: iconBox,
                      height: iconBox,
                      borderRadius: iconR,
                      background: tone.bg,
                      color: tone.fg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 3px rgba(15,23,42,0.06)',
                    }}
                  >
                    <Icon size={17} strokeWidth={2.35} />
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: valueSize,
                    lineHeight: 1.08,
                    color: vi.text,
                    fontWeight: 'var(--cheta-kpi-weight, 600)',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.028em',
                    transform: 'scale(var(--cheta-kpi-scale, 1))',
                    transformOrigin: 'left center',
                  }}
                >
                  {item.value}
                  {item.unit ? (
                    <span
                      style={{
                        marginLeft: 4,
                        fontSize: '0.8125rem',
                        color: vi.textMuted,
                        fontWeight: 500,
                      }}
                    >
                      {item.unit}
                    </span>
                  ) : null}
                </div>
              </>
            )
          ) : isCommandStyle ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: vi.textMuted,
                    fontWeight: 650,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.35,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    width: iconBox,
                    height: iconBox,
                    borderRadius: iconR,
                    background: tone.bg,
                    color: tone.fg,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} strokeWidth={2.25} />
                </span>
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: valueSize,
                  lineHeight: 1.05,
                  color: vi.text,
                  fontWeight: 'var(--cheta-kpi-weight, 700)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.03em',
                  transform: 'scale(var(--cheta-kpi-scale, 1))',
                  transformOrigin: 'left center',
                }}
              >
                {item.value}
                {item.unit ? (
                  <span
                    style={{
                      marginLeft: 3,
                      fontSize: '0.72rem',
                      color: vi.textMuted,
                      fontWeight: 600,
                    }}
                  >
                    {item.unit}
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {variant === 'institutional' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '4px 1fr auto',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      width: 4,
                      height: 34,
                      borderRadius: 3,
                      background: tone.fg,
                    }}
                  />
                  <span
                    style={{
                      fontSize: isInstitutionalTemplate && idx < 2 ? '0.92rem' : labelSize,
                      color: vi.textMuted,
                      fontWeight: isInstitutionalTemplate && idx < 2 ? 740 : 650,
                      letterSpacing: isInstitutionalTemplate && idx < 2 ? '-0.014em' : undefined,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: `1px solid color-mix(in srgb, ${tone.fg} 40%, ${vi.border})`,
                      color: tone.fg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={14} />
                  </span>
                </div>
              ) : variant === 'vibrant' ? (
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      background: `linear-gradient(135deg, ${tone.fg}, color-mix(in srgb, ${tone.fg} 70%, #ffffff))`,
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 12px -6px ${tone.fg}`,
                    }}
                  >
                    <Icon size={15} />
                  </span>
                  <span style={{ fontSize: labelSize, color: vi.textMuted, fontWeight: 650 }}>
                    {item.label}
                  </span>
                </div>
              ) : variant === 'trust' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: labelSize, color: vi.textMuted, fontWeight: 640 }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      border: '1px solid rgba(176,140,62,0.65)',
                      color: tone.fg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={12} />
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: iconBox,
                      height: iconBox,
                      borderRadius: iconR,
                      background: tone.bg,
                      color: tone.fg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={15} />
                  </span>
                  <span style={{ fontSize: labelSize, color: vi.textMuted, fontWeight: 600 }}>
                    {item.label}
                  </span>
                </div>
              )}
              <div
                style={{
                  marginTop: 12,
                  fontSize:
                    isInstitutionalTemplate && idx < 2
                      ? 'clamp(2.05rem, 3.05vw, 2.52rem)'
                      : isInstitutionalTemplate
                        ? 'clamp(1.42rem, 2.1vw, 1.74rem)'
                        : valueSize,
                  lineHeight: 1,
                  color: vi.text,
                  fontWeight: 'var(--cheta-kpi-weight, 700)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                  transform: 'scale(var(--cheta-kpi-scale, 1))',
                  transformOrigin: 'left center',
                }}
              >
                {item.value}
                {item.unit ? (
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: '0.88rem',
                      color: vi.textMuted,
                      fontWeight: 500,
                    }}
                  >
                    {item.unit}
                  </span>
                ) : null}
              </div>
            </>
          )

          const isInstitutionalPrimary = isInstitutionalTemplate && idx < 2
          const cardInner = isInstitutionalPrimary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  gap: 6,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: `color-mix(in srgb, ${vi.primary} 12%, white)`,
                  border: `1px solid color-mix(in srgb, ${vi.primary} 26%, ${vi.border})`,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: vi.primary,
                  }}
                />
                <span style={{ fontSize: 11, color: vi.textMuted, fontWeight: 700 }}>{t('主指标卡')}</span>
              </div>
              {content}
            </div>
          ) : (
            content
          )
          const { boxShadow: _shadow, ...surfaceRest } = cardSurface
          const shellStyle: CSSProperties = {
            borderRadius: cardRadius,
            padding: isInstitutionalPrimary ? '20px 20px 18px' : cardPad,
            textAlign: 'left',
            ...surfaceRest,
            ...(variant === 'trust'
              ? { borderTop: '2px solid rgba(176,140,62,0.7)' }
              : variant === 'institutional'
                ? isInstitutionalPrimary
                  ? {
                      borderLeft: `4px solid ${vi.primary}`,
                      borderColor: `color-mix(in srgb, ${vi.primary} 28%, ${vi.border})`,
                      background: `linear-gradient(180deg, color-mix(in srgb, ${vi.primary} 8%, ${vi.bgCard}) 0%, ${vi.bgCard} 100%)`,
                    }
                  : {
                      borderLeft: `2px solid color-mix(in srgb, ${vi.primary} 45%, ${vi.border})`,
                      borderColor: `color-mix(in srgb, ${vi.primary} 15%, ${vi.border})`,
                      background: `color-mix(in srgb, ${vi.bgCard} 96%, white)`,
                    }
                : {}),
            ...(isPresentationStyle
              ? {
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: isEditorialTemplate && idx === 0 ? 168 : 104,
                  WebkitFontSmoothing: 'antialiased',
                }
              : isCommandStyle
                ? {
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 88,
                    WebkitFontSmoothing: 'antialiased',
                  }
                : isInstitutionalTemplate
                  ? {
                      minHeight: idx < 2 ? 148 : 96,
                    }
                  : {}),
          }

          return (
            <OverviewCard
              key={`${item.label}-${idx}`}
              className={cn('leader-kpi-card min-w-0', getCellClass(idx))}
              style={shellStyle}
              interactive={platformSkin || !!item.onClick}
              kpiHero={isPresentationStyle && idx === 0}
              onClick={item.onClick}
            >
              <div
                style={
                  isInstitutionalTemplate && idx >= 2
                    ? {
                        opacity: 0.92,
                        filter: 'saturate(0.92)',
                      }
                    : undefined
                }
              >
                {cardInner}
              </div>
            </OverviewCard>
          )
        })}
      </div>
    </div>
  )
}
