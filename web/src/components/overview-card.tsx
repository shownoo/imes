import { useState, type CSSProperties, type ReactNode } from 'react'
import { useChetaVisualVariant } from 'contexts/cheta-visual-variant-context'
import { chetaLeaderPlatformSkin } from 'lib/cheta-kpi-institutional'
import { useLeaderVi } from 'hooks/use-leader-vi'
import { cn } from 'lib/utils'

const TRANSITION = 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease'

type OverviewCardProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** 默认：浅色平台皮肤或存在 onClick 时启用悬停 */
  interactive?: boolean
  /** Apple HIG 主 KPI 光晕 */
  kpiHero?: boolean
  onClick?: () => void
}

/**
 * 领导端卡片壳层 — 对齐 neoWebSchool OverviewCard
 * 多层阴影 + 悬停抬升 + 边框过渡
 */
export function OverviewCard({
  children,
  className,
  style,
  interactive,
  kpiHero,
  onClick,
}: OverviewCardProps) {
  const { variant } = useChetaVisualVariant()
  const vi = useLeaderVi()
  const [hovered, setHovered] = useState(false)
  const platformSkin = chetaLeaderPlatformSkin(variant, vi.isLight)
  const isInteractive = interactive ?? (platformSkin || !!onClick || !vi.isLight)

  const baseShadow = 'var(--cheta-card-inset, none), var(--cheta-surface-shadow, var(--leader-card-shadow))'
  const hoverShadow = 'var(--cheta-card-inset, none), var(--leader-card-shadow-hover, var(--cheta-surface-shadow))'

  const hoverLift = variant === 'appleHig' ? 'translateY(-4px)' : 'translateY(-2px)'

  const hoverBorder = vi.isLight
    ? `color-mix(in srgb, ${vi.primary} 22%, var(--leader-card-border))`
    : `color-mix(in srgb, ${vi.primary} 35%, var(--leader-card-border))`

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={cn('overview-card', className)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--cheta-card-radius, var(--leader-card-radius, 16px))',
        background: 'var(--leader-card-bg)',
        border: '1px solid var(--leader-card-border, var(--cheta-card-border-strong))',
        backdropFilter: 'var(--leader-card-backdrop, none)',
        WebkitBackdropFilter: 'var(--leader-card-backdrop, none)',
        boxShadow: isInteractive && hovered ? hoverShadow : baseShadow,
        transform: isInteractive && hovered && platformSkin ? hoverLift : undefined,
        borderColor: isInteractive && hovered ? hoverBorder : undefined,
        transition: TRANSITION,
        cursor: onClick ? 'pointer' : undefined,
        textAlign: 'inherit',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={isInteractive ? () => setHovered(true) : undefined}
      onMouseLeave={isInteractive ? () => setHovered(false) : undefined}
    >
      {kpiHero && variant === 'appleHig' && vi.isLight ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.42) 0%, transparent 48%, rgba(10,132,255,0.04) 100%)',
            pointerEvents: 'none',
          }}
        />
      ) : null}
      {children}
    </Tag>
  )
}
