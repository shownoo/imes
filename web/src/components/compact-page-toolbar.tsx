import { ArrowLeft, ChevronLeft } from 'lucide-react'
import { cn } from 'lib/utils'
import { useTranslation } from 'react-i18next'

export interface CompactPageToolbarPrimaryAction {
  onSubmit: () => void
  loading?: boolean
  okText?: string
  cancelText?: string
  loadingText?: string
  onCancel?: () => void
  submitButtonStyle?: React.CSSProperties
}

export interface CompactPageToolbarProps {
  backLabel: string
  /** `〈 返回` + 粗体标题（对齐 dbm breadcrumbHeadline） */
  heading?: string
  onBack: () => void
  prefix?: React.ReactNode
  trailing?: React.ReactNode
  primaryAction?: CompactPageToolbarPrimaryAction
  className?: string
}

function SegmentedPrimaryAction(props: CompactPageToolbarPrimaryAction) {
  const { t } = useTranslation()
  const {
    onSubmit,
    loading,
    okText = '保存',
    cancelText = '取消',
    loadingText = '保存中…',
    onCancel,
    submitButtonStyle,
  } = props
  const runCancel = onCancel ?? (() => {})

  return (
    <div
      className={cn(
        'inline-flex h-7 items-stretch rounded-lg border border-border/35 bg-muted/25 p-px',
        'shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] backdrop-blur-sm',
      )}
    >
      <button
        type="button"
        onClick={runCancel}
        disabled={!!loading}
        className={cn(
          'rounded-[5px] px-2.5 text-[12px] font-medium text-muted-foreground',
          'transition-colors hover:bg-background/90 hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
          'disabled:pointer-events-none disabled:opacity-45',
        )}
      >
        {cancelText}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!!loading}
        style={submitButtonStyle}
        className={cn(
          'ml-px flex min-w-[4.25rem] items-center justify-center gap-1 rounded-[5px] px-2.5',
          'text-[12px] font-semibold leading-none text-primary-foreground',
          !submitButtonStyle?.backgroundColor && 'bg-primary',
          'shadow-sm transition-[filter,opacity] hover:brightness-[1.03] active:brightness-[0.98]',
          'disabled:pointer-events-none disabled:opacity-45',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
        )}
      >
        {loading ? loadingText : okText}
      </button>
    </div>
  )
}

/** 紧凑页顶栏 — 对齐 dbm CompactPageToolbar */
export function CompactPageToolbar({
  backLabel,
  heading,
  onBack,
  prefix,
  trailing,
  primaryAction,
  className,
}: CompactPageToolbarProps) {
  const { t } = useTranslation()
  const showBreadcrumb = Boolean(heading && backLabel)
  const backText = showBreadcrumb ? backLabel : heading ? '返回' : `返回${backLabel}`

  return (
    <div
      className={cn(
        'flex h-9 w-full min-w-0 shrink-0 items-center gap-2 border-b border-border/20',
        'bg-background/[0.38] px-3 backdrop-blur-2xl backdrop-saturate-150',
        'supports-[backdrop-filter]:bg-background/[0.28]',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <nav className="flex min-w-0 items-center gap-1 text-[13px]" aria-label={t('页面导航')}>
          <button
            type="button"
            onClick={onBack}
            className={cn(
              'group flex h-7 shrink-0 items-center rounded-md transition-colors hover:bg-muted/80',
              showBreadcrumb
                ? 'max-w-[min(100%,14rem)] -ml-0.5 gap-1.5 px-2 py-1 font-medium text-muted-foreground hover:text-foreground'
                : 'max-w-[min(100%,18rem)] -ml-0.5 gap-1 px-1.5 text-[12px] font-medium leading-none text-muted-foreground hover:text-foreground',
            )}
          >
            {showBreadcrumb || heading ? (
              <ChevronLeft className="size-4 shrink-0" strokeWidth={2} />
            ) : (
              <ArrowLeft
                className="size-3.5 shrink-0 transition-transform group-hover:-translate-x-px"
                strokeWidth={2}
              />
            )}
            <span className="truncate tracking-tight">{backText}</span>
          </button>
          {showBreadcrumb ? (
            <>
              <span className="shrink-0 px-0.5 text-muted-foreground/25 select-none" aria-hidden>/</span>
              <span aria-current="page" className="min-w-0 truncate font-semibold tracking-tight text-foreground">
                {heading}
              </span>
            </>
          ) : heading ? (
            <span className="truncate text-[13px] font-semibold tracking-tight text-foreground">{heading}</span>
          ) : null}
        </nav>
        {prefix ? (
          <div className="flex min-w-0 shrink items-center gap-2">{prefix}</div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {primaryAction ? <SegmentedPrimaryAction {...primaryAction} /> : null}
        {trailing ? (
          <div
            className={cn(
              'inline-flex h-7 max-w-[min(100%,42rem)] items-stretch overflow-hidden rounded-lg',
              'border border-border/30 bg-muted/20 p-px shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]',
              'backdrop-blur-md supports-[backdrop-filter]:bg-muted/12',
              'divide-x divide-border/25',
            )}
          >
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  )
}
