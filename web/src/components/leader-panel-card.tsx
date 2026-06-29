import type { CSSProperties, ReactNode } from 'react'
import { useChetaVisualVariant } from 'contexts/cheta-visual-variant-context'
import { chetaLeaderPlatformSkin } from 'lib/cheta-kpi-institutional'
import { useLeaderVi } from 'hooks/use-leader-vi'
import { OverviewCard } from 'components/overview-card'
import { cn } from 'lib/utils'

export type LeaderPanelCardProps = {
  title?: ReactNode
  header?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  style?: CSSProperties
  interactive?: boolean
  onClick?: () => void
}

const PANEL_PAD = '12px 16px 16px'

/** 研判/图表面板 — 与 neoWebSchool LeaderPanelCard 同壳与悬停 */
export function LeaderPanelCard({
  title,
  header,
  children,
  className,
  contentClassName,
  style,
  interactive,
  onClick,
}: LeaderPanelCardProps) {
  const { variant } = useChetaVisualVariant()
  const vi = useLeaderVi()
  const platformSkin = chetaLeaderPlatformSkin(variant, vi.isLight)
  const isInteractive = interactive ?? platformSkin ?? !!onClick

  return (
    <OverviewCard
      interactive={isInteractive}
      onClick={onClick}
      className={cn('leader-panel-card cheta-leader-panel flex w-full flex-col text-left', className)}
      style={{ padding: PANEL_PAD, ...style }}
    >
      {header ??
        (title ? (
          <div
            className="pb-2 text-base font-semibold leading-snug"
            style={{
              color: 'var(--leader-text, inherit)',
              fontFamily: 'var(--leader-font-body, inherit)',
              fontWeight: 'var(--cheta-title-weight, 600)',
              fontSize: 'var(--cheta-leader-page-subtitle-size, 1rem)',
            }}
          >
            {title}
          </div>
        ) : null)}
      <div className={cn('relative min-w-0', contentClassName)}>{children}</div>
    </OverviewCard>
  )
}
