import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from 'lib/utils'

type MobileOpsCrumbBarProps = {
  title: string
  /** 仅用于无障碍与返回语义，默认不展示在顶栏 */
  backLabel?: string
  onBack?: () => void
  trailing?: ReactNode
  className?: string
}

/** 微信 / iOS 轻量顶栏：列表居中标题，详情三栏居中 + 仅箭头返回 */
export function MobileOpsCrumbBar({
  title,
  backLabel,
  onBack,
  trailing,
  className,
}: MobileOpsCrumbBarProps) {
  const isDetail = Boolean(onBack)

  return (
    <header
      className={cn(
        'mobile-ops-crumb-bar',
        isDetail ? 'mobile-ops-crumb-bar--detail' : 'mobile-ops-crumb-bar--root',
        className,
      )}
    >
      {isDetail ? (
        <>
          <div className="mobile-ops-crumb-bar-slot mobile-ops-crumb-bar-slot--left">
            <button
              type="button"
              className="mobile-ops-crumb-back"
              onClick={onBack}
              aria-label={backLabel ? `返回${backLabel}` : '返回'}
            >
              <ChevronLeft className="size-[22px] shrink-0" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="mobile-ops-crumb-bar-center min-w-0">
            <p className="mobile-ops-crumb-bar-title mobile-ops-crumb-bar-title--detail truncate">
              {title}
            </p>
          </div>
          <div className="mobile-ops-crumb-bar-slot mobile-ops-crumb-bar-slot--right">
            {trailing ?? <span className="mobile-ops-crumb-bar-slot-placeholder" aria-hidden />}
          </div>
        </>
      ) : (
        <>
          <h1 className="mobile-ops-crumb-bar-title mobile-ops-crumb-bar-title--center">{title}</h1>
          {trailing ? (
            <div className="mobile-ops-crumb-bar-trailing mobile-ops-crumb-bar-trailing--root shrink-0">
              {trailing}
            </div>
          ) : null}
        </>
      )}
    </header>
  )
}
