import type { ReactNode } from 'react'
import { TabsTrigger } from 'components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'

/** TabsTrigger 带悬停说明 */
export function TipTabsTrigger({
  value,
  tip,
  children,
  className,
}: {
  value: string
  tip?: string
  children: ReactNode
  className?: string
}) {
  const trigger = (
    <TabsTrigger value={value} className={className}>
      {children}
    </TabsTrigger>
  )

  if (!tip) return trigger

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[14rem] leading-relaxed">
        {tip}
      </TooltipContent>
    </Tooltip>
  )
}
