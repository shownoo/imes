import React from 'react'
import {
  Popover as ShadcnPopover,
  PopoverContent,
  PopoverTrigger,
} from 'components/ui/popover'
import { cn } from 'lib/utils'

interface PopoverProps {
  children?: React.ReactNode
  content?: React.ReactNode
  title?: React.ReactNode
  trigger?: string
  placement?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  contentClassName?: string
}

export default function Popover({
  children,
  content,
  title,
  open,
  onOpenChange,
  contentClassName,
}: PopoverProps) {
  return (
    <ShadcnPopover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer">{children}</span>
      </PopoverTrigger>
      <PopoverContent className={cn(contentClassName)}>
        {title && <div className="mb-2 font-medium">{title}</div>}
        {content}
      </PopoverContent>
    </ShadcnPopover>
  )
}
