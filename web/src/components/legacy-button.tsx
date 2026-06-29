import React from 'react'
import { Button as ShadcnButton, type ButtonProps as ShadcnButtonProps } from 'components/ui/button'
import { cn } from 'lib/utils'
import { Loader2 } from 'lucide-react'

interface LegacyButtonProps {
  title?: React.ReactNode
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link'
  variant?: string
  color?: string
  danger?: boolean
  block?: boolean
  icon?: React.ReactNode
  htmlType?: 'submit' | 'reset' | 'button'
  loading?: boolean
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  children?: React.ReactNode
  className?: string
}

function getVariant(type?: string, danger?: boolean): ShadcnButtonProps['variant'] {
  if (danger) return 'destructive'
  switch (type) {
    case 'primary':
      return 'default'
    case 'link':
      return 'link'
    case 'text':
      return 'ghost'
    default:
      return 'outline'
  }
}

function getSize(size?: string): ShadcnButtonProps['size'] {
  switch (size) {
    case 'small':
      return 'sm'
    case 'large':
      return 'lg'
    default:
      return 'default'
  }
}

export function Button({
  title,
  type,
  variant,
  size,
  disabled,
  icon,
  block,
  danger,
  loading,
  htmlType,
  onClick,
  children,
  className,
}: LegacyButtonProps) {
  const effectiveType = type ?? (variant === 'text' ? 'text' : undefined)
  const label = children ?? title

  return (
    <ShadcnButton
      type={htmlType ?? 'button'}
      variant={getVariant(effectiveType, danger)}
      size={getSize(size)}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(block && 'w-full', className)}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {label}
    </ShadcnButton>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('mx-1 h-6 w-px bg-border', className)} role="separator" />
}
