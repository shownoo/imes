import type { CSSProperties, ReactNode } from 'react'

export const leaderPageTitleStyle: CSSProperties = {
  fontFamily: 'var(--leader-font-body, inherit)',
  fontSize: 'var(--cheta-leader-page-title-size, 1.5rem)',
  fontWeight: 'var(--cheta-title-weight, 700)',
  color: 'var(--leader-text, inherit)',
  lineHeight: 1.15,
}

export const leaderPageSubtitleStyle: CSSProperties = {
  fontFamily: 'var(--leader-font-body, inherit)',
  fontSize: 'var(--cheta-leader-page-subtitle-size, 0.875rem)',
  color: 'var(--leader-text-muted, inherit)',
}

export const leaderFormLabelStyle: CSSProperties = {
  fontFamily: 'var(--leader-font-body, inherit)',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--leader-text, inherit)',
}

/** 领导端页头 — 字号/字重随界面方案 A–H 注入变量 */
export function LeaderPageHeader({
  title,
  desc,
  action,
}: {
  title: string
  desc?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="tracking-tight" style={leaderPageTitleStyle}>
          {title}
        </h2>
        {desc && (
          <p className="mt-1.5" style={leaderPageSubtitleStyle}>
            {desc}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
