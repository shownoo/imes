import type { CSSProperties, ReactNode } from 'react'
import { InfoTip } from 'components/info-tip'

/** 供表单等场景复用的页头字号变量（已弱化） */
export const leaderPageTitleStyle: CSSProperties = {
  fontFamily: 'var(--leader-font-body, inherit)',
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--leader-text, inherit)',
  lineHeight: 1.35,
}

export const leaderPageSubtitleStyle: CSSProperties = {
  fontFamily: 'var(--leader-font-body, inherit)',
  fontSize: '0.75rem',
  color: 'var(--leader-text-muted, inherit)',
  opacity: 0.85,
}

export const leaderFormLabelStyle: CSSProperties = {
  fontFamily: 'var(--leader-font-body, inherit)',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--leader-text, inherit)',
}

/** 列表页页头 — 与表单页 PageToolbar 同级视觉权重 */
export function LeaderPageHeader({
  title,
  desc,
  titleTip,
  action,
}: {
  title: string
  desc?: string
  /** 悬停标题旁 ℹ 显示，替代常驻副标题 */
  titleTip?: string
  action?: ReactNode
}) {
  return (
    <div className="leader-page-toolbar mb-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h2 className="truncate tracking-tight" style={leaderPageTitleStyle}>
            {title}
          </h2>
          {titleTip && <InfoTip side="bottom">{titleTip}</InfoTip>}
        </div>
        {desc && !titleTip && (
          <p className="mt-0.5 truncate" style={leaderPageSubtitleStyle}>
            {desc}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
