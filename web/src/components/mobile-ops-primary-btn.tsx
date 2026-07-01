import type { ButtonHTMLAttributes } from 'react'
import { cn } from 'lib/utils'

type MobileOpsPrimaryBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  loadingLabel?: string
}

/** 移动端详情页主操作按钮 — 与入库/出库结案等场景统一样式 */
export function MobileOpsPrimaryBtn({
  children,
  loading,
  loadingLabel = '提交中…',
  className,
  disabled,
  ...props
}: MobileOpsPrimaryBtnProps) {
  return (
    <button
      type="button"
      className={cn('mobile-ops-btn', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? loadingLabel : children}
    </button>
  )
}
