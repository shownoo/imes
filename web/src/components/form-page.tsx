import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'components/ui/button'
import { CompactPageToolbar } from 'components/compact-page-toolbar'
import { InfoTip } from 'components/info-tip'
import { Label } from 'components/ui/label'
import { LeaderSurfaceCard } from 'components/leader-surface-card'
import { cn } from 'lib/utils'

export {
  InsetFormGroup,
  InsetFormRow,
  insetFormInputClass,
  insetFormSelectTriggerClass,
} from 'components/inset-form-list'

export {
  GroupedFormSection,
  GroupedFormRow,
  GroupedFormItem,
  GroupedFormStack,
  DocumentLinesSection,
  GroupedFormRemark,
  groupedFormInputClass,
  groupedFormSelectTriggerClass,
  groupedFormReadonlyClass,
  GroupedFormReadonly,
  GroupedFormReadonlyField,
} from 'components/grouped-form'

export { DatePicker, InlineDatePicker, todayDateStr, localDateToIso, parseLocalDateStr } from 'components/inline-date-picker'
export type { DatePickerProps, InlineDatePickerProps } from 'components/inline-date-picker'

export {
  DocumentDetailMeta,
  DocumentDetailMetaField,
  DocumentDetailStack,
  DocumentDetailSection,
} from 'components/document-detail-meta'

export {
  DocumentDetailPageStack,
  DocumentDetailSection as InsetDocumentSection,
  DocumentDetailGroup,
  DocumentDetailRow,
  insetDetailValueClass,
  insetDetailValuePrimaryClass,
} from 'components/document-detail-inset'

export function FormField({ label, tip, required, children, className }: {
  label: string
  tip?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-[13px] font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
        {tip && (
          <span className="ml-1 inline-flex align-middle">
            <InfoTip side="right">{tip}</InfoTip>
          </span>
        )}
      </Label>
      {children}
    </div>
  )
}

/** 表单双列/多列网格 — 间距随 --leader-grid-gap */
export function FormGrid({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('leader-form-grid grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/** 表单分区 — 卡片式（默认）或 iOS Settings 分组列表（inset） */
export function FormSection({ title, desc, tip, children, className, inset, narrow }: {
  title?: string
  desc?: string
  tip?: string
  children: React.ReactNode
  className?: string
  /** iOS Settings 行内列表 — 标题在组外、无套娃卡片 */
  inset?: boolean
  /** 字段较少的分区收窄宽度 */
  narrow?: boolean
}) {
  if (inset) {
    return (
      <section className={cn('inset-form-page-section space-y-2', narrow && 'max-w-md', className)}>
        {(title || tip) && (
          <header className="flex items-center gap-1 px-4">
            {title && (
              <h3 className="text-[13px] font-normal uppercase tracking-wide text-muted-foreground/70">
                {title}
              </h3>
            )}
            {tip && <InfoTip side="right">{tip}</InfoTip>}
          </header>
        )}
        {children}
        {desc && (
          <p className="px-4 text-[13px] leading-relaxed text-muted-foreground/75">{desc}</p>
        )}
      </section>
    )
  }

  return (
    <LeaderSurfaceCard
      formSurface
      flat
      contentClassName="p-4"
      className={cn(narrow && 'mx-auto w-full max-w-lg', className)}
    >
      <section className="space-y-3">
        {title && (
          <header className="flex flex-wrap items-baseline gap-x-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-medium text-foreground">{title}</h3>
              {tip && <InfoTip side="right">{tip}</InfoTip>}
            </div>
            {desc && (
              <>
                <span className="hidden text-muted-foreground/30 sm:inline" aria-hidden>·</span>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </>
            )}
          </header>
        )}
        {children}
      </section>
    </LeaderSurfaceCard>
  )
}

/** 多分区表单纵向堆叠 */
export function FormStack({ children, className, inset }: {
  children: React.ReactNode
  className?: string
  /** iOS 分组列表 — 组间距更疏 */
  inset?: boolean
}) {
  return <div className={cn(inset ? 'space-y-7' : 'space-y-3', className)}>{children}</div>
}

export const FORM_PAGE_TITLES = { create: '新建', edit: '修改' } as const

export function formPageTitle(mode: 'create' | 'edit') {
  return FORM_PAGE_TITLES[mode]
}

/** 全站统一面包屑：← 父级 / 当前 */
export function PageBreadcrumb({
  parentLabel,
  currentLabel,
  onParentClick,
  className,
}: {
  parentLabel: string
  currentLabel: string
  onParentClick: () => void
  className?: string
}) {
  return (
    <nav className={cn('flex min-w-0 items-center gap-1 text-sm', className)} aria-label={'页面导航'}>
      <h1 className="sr-only">{parentLabel} / {currentLabel}</h1>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={onParentClick}
        aria-label={`返回${parentLabel}`}
      >
        <ArrowLeft className="size-3.5" />
      </Button>
      <button
        type="button"
        onClick={onParentClick}
        className="shrink-0 truncate font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {parentLabel}
      </button>
      <span className="shrink-0 px-0.5 text-muted-foreground/25 select-none" aria-hidden>/</span>
      <span aria-current="page" className="min-w-0 truncate font-medium text-foreground/88">
        {currentLabel}
      </span>
    </nav>
  )
}

interface PageShellProps {
  /** 新建/修改页统一用 mode，标题自动为「新建」「修改」 */
  mode?: 'create' | 'edit'
  title?: string
  backTo: string
  backLabel?: string
  wide?: boolean
  footer?: React.ReactNode
  children: React.ReactNode
  /** dbm 分段保存 — 传入时顶栏使用 CompactPageToolbar */
  onSubmit?: () => void
  onCancel?: () => void
  submitLoading?: boolean
  submitTitle?: string
  cancelTitle?: string
}

function resolvePageTitle(props: Pick<PageShellProps, 'mode' | 'title'>) {
  if (props.mode) return FORM_PAGE_TITLES[props.mode]
  if (!props.title) throw new Error('FormPage/DocumentPage: provide mode or title')
  return props.title
}

function resolveFormHeadline(props: Pick<PageShellProps, 'mode' | 'title' | 'backLabel'>) {
  if (props.title) return props.title
  if (props.mode && props.backLabel) {
    return `${props.mode === 'edit' ? '修改' : '新增'}${props.backLabel}`
  }
  if (props.mode) return FORM_PAGE_TITLES[props.mode]
  throw new Error('FormPage: provide mode or title')
}

export function FormPage({
  mode,
  title,
  backTo,
  backLabel,
  wide,
  footer,
  children,
  onSubmit,
  onCancel,
  submitLoading,
  submitTitle,
  cancelTitle,
}: PageShellProps) {
  const navigate = useNavigate()
  const resolvedTitle = resolvePageTitle({ mode, title })
  const headline = onSubmit ? resolveFormHeadline({ mode, title, backLabel }) : resolvedTitle
  const handleBack = onCancel ?? (() => navigate(backTo))

  return (
    <div className={cn('flex min-h-0 w-full flex-col', wide ? 'max-w-[min(100%,88rem)]' : onSubmit ? 'w-full' : 'max-w-3xl')}>
      {onSubmit ? (
        <CompactPageToolbar
          backLabel={backLabel ?? ''}
          heading={headline}
          onBack={handleBack}
          primaryAction={{
            onSubmit,
            onCancel: handleBack,
            loading: submitLoading,
            okText: submitTitle ?? '保存',
            cancelText: cancelTitle ?? '取消',
          }}
        />
      ) : (
        <FormPageHeader
          parentLabel={backLabel ?? '返回'}
          actionLabel={resolvedTitle}
          onBack={() => navigate(backTo)}
          footer={footer}
        />
      )}
      <div className={cn('leader-form-body min-w-0 flex-1 pt-3', wide && 'max-w-none')}>
        {children}
      </div>
    </div>
  )
}

export function DocumentPage({ mode, title, backTo, backLabel, wide, footer, children }: PageShellProps) {
  const navigate = useNavigate()
  const resolvedTitle = resolvePageTitle({ mode, title })
  return (
    <div className={cn('flex min-h-0 w-full flex-col', wide ? 'max-w-[min(100%,88rem)]' : 'max-w-4xl')}>
      <CompactPageToolbar
        backLabel={backLabel ?? ''}
        heading={resolvedTitle}
        onBack={() => navigate(backTo)}
        trailing={footer}
      />
      <div className="leader-form-body min-w-0 flex-1 pt-3">{children}</div>
    </div>
  )
}

/** 新建/修改/详情页顶栏 */
function FormPageHeader({ parentLabel, actionLabel, onBack, footer }: {
  parentLabel: string
  actionLabel: string
  onBack: () => void
  footer?: React.ReactNode
}) {
  return (
    <div className="leader-page-toolbar flex items-center justify-between gap-4 pb-2">
      <PageBreadcrumb
        parentLabel={parentLabel}
        currentLabel={actionLabel}
        onParentClick={onBack}
      />
      {footer && <div className="leader-page-actions flex shrink-0 items-center gap-2">{footer}</div>}
    </div>
  )
}
