import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { cn } from 'lib/utils'
import { useTranslation } from 'react-i18next'

type InfoTipProps = {
  children: ReactNode
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/** 轻量说明提示 — 悬停 ℹ 图标显示 */
export function InfoTip({ children, className, side = 'top' }: InfoTipProps) {
  const { t } = useTranslation()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex shrink-0 items-center rounded-full text-muted-foreground/45 transition-colors hover:text-muted-foreground',
            className,
          )}
          aria-label={t('说明')}
        >
          <Info className="size-3.5" strokeWidth={2} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[16rem] leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
