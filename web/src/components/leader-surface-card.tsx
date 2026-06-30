import type { ReactNode } from 'react'
import { useUiDesignSystem } from 'hooks/use-ui-design-system'
import { OverviewCard } from 'components/overview-card'
import { cn } from 'lib/utils'

type LeaderSurfaceCardProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  /** 表单区加 leader-form-surface，启用设计语言对应的输入框材质 */
  formSurface?: boolean
  interactive?: boolean
  /** 数据列表等 — 单层表面、无阴影/光晕，避免「套娃」层叠感 */
  flat?: boolean
}

/** 领导端面板/表单/表格 — 随 data-ui-design-system 切换材质（M3 / HIG / Fluent / Carbon …） */
export function LeaderSurfaceCard({
  children,
  className,
  contentClassName,
  formSurface,
  interactive,
  flat,
}: LeaderSurfaceCardProps) {
  const { features } = useUiDesignSystem()

  return (
    <OverviewCard
      className={cn(
        'leader-panel-card cheta-leader-panel',
        formSurface && 'leader-form-card',
        features.layeredSurface && !flat && 'ui-ds-layered-card',
        flat && 'leader-surface-flat',
        className,
      )}
      interactive={flat ? false : (interactive ?? false)}
      kpiHero={flat ? false : features.glassSheen}
    >
      <div className={cn('relative', formSurface && 'leader-form-surface', contentClassName)}>
        {children}
      </div>
    </OverviewCard>
  )
}
