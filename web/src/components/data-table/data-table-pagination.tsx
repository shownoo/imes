import type { MouseEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
} from 'lucide-react'
import { Button } from 'components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select'
import { cn } from 'lib/utils'

export type DataTablePaginationProps = {
  current?: number
  total?: number
  pageSize?: number
  disabled?: boolean
  onChange?: (page: number, pageSize: number) => void
  onShowSizeChange?: (current: number, size: number) => void
  handleRefresh?: (event: MouseEvent<HTMLElement>) => void
  /** 渲染在刷新按钮左侧，如列设置 */
  actionsBeforeRefresh?: ReactNode
  className?: string
}

export function DataTablePagination({
  current = 1,
  total = 0,
  pageSize = 20,
  disabled,
  onChange,
  onShowSizeChange,
  handleRefresh,
  actionsBeforeRefresh,
  className,
}: DataTablePaginationProps) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-t border-border/35 px-3 py-2',
        className,
      )}
    >
      <span className="text-xs tabular-nums text-muted-foreground">
        共 {total.toLocaleString()} 条
      </span>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="hidden text-xs text-muted-foreground lg:inline">{t('每页')}</span>
          <Select
            value={String(pageSize)}
            disabled={disabled}
            onValueChange={(val) => onShowSizeChange?.(current, Number(val))}
          >
            <SelectTrigger className="h-7 w-[60px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {['10', '20', '30', '50', '100'].map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-[72px] items-center justify-center text-xs font-medium tabular-nums text-muted-foreground">
          {current} / {totalPages}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden size-7 lg:flex"
            disabled={disabled || current <= 1}
            onClick={() => onChange?.(1, pageSize)}
          >
            <span className="sr-only">{t('首页')}</span>
            <ChevronsLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            disabled={disabled || current <= 1}
            onClick={() => onChange?.(current - 1, pageSize)}
          >
            <span className="sr-only">{t('上一页')}</span>
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            disabled={disabled || current >= totalPages}
            onClick={() => onChange?.(current + 1, pageSize)}
          >
            <span className="sr-only">{t('下一页')}</span>
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden size-7 lg:flex"
            disabled={disabled || current >= totalPages}
            onClick={() => onChange?.(totalPages, pageSize)}
          >
            <span className="sr-only">{t('末页')}</span>
            <ChevronsRight className="size-3.5" />
          </Button>
        </div>

        {actionsBeforeRefresh}

        {handleRefresh ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-7"
                aria-label={t('刷新')}
                disabled={disabled}
                onClick={handleRefresh}
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{t('刷新')}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </div>
  )
}
