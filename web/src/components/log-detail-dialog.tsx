import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Badge } from 'components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table'
import { formatLogDisplayValue } from 'lib/log-value-format'
import { LOG_ACTION_LABELS, LOG_FIELD_LABELS, LOG_MODULE_LABELS } from 'lib/system-log-labels'

export type LogChangeItem = {
  field: string
  label: string
  before: unknown
  after: unknown
}

export type LogDetail = {
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  changes?: LogChangeItem[]
  [key: string]: unknown
}

function normalizeDetail(raw: unknown): LogDetail | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as LogDetail
  if (d.changes?.length) return d
  if (d.before || d.after) {
    const keys = [...new Set([...Object.keys(d.before ?? {}), ...Object.keys(d.after ?? {})])]
    const changes: LogChangeItem[] = keys
      .map((field) => ({
        field,
        label: LOG_FIELD_LABELS[field] ?? field,
        before: d.before?.[field] ?? '—',
        after: d.after?.[field] ?? '—',
      }))
      .filter((c) => formatLogDisplayValue(c.before) !== formatLogDisplayValue(c.after))
    return { ...d, changes }
  }
  return d
}

function ChangeValue({ value }: { value: unknown }) {
  const text = formatLogDisplayValue(value)
  return <span className="whitespace-pre-wrap break-words leading-relaxed">{text}</span>
}

type LogDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: Record<string, unknown> | null
}

export function LogDetailDialog({ open, onOpenChange, log }: LogDetailDialogProps) {
  if (!log) return null

  const detail = normalizeDetail(log.detail)
  const changes = detail?.changes ?? []
  const hasChanges = changes.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>'日志详情'</DialogTitle>
          <DialogDescription>{String(log.summary ?? '')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="outline" className="border-border bg-muted/50 text-popover-foreground">
            {LOG_MODULE_LABELS[String(log.module)] ?? String(log.module)}
          </Badge>
          <Badge variant="info">{LOG_ACTION_LABELS[String(log.action)] ?? String(log.action)}</Badge>
          {log.targetLabel != null && (
            <span className="font-mono text-xs text-popover-foreground/70">{String(log.targetLabel)}</span>
          )}
        </div>

        {hasChanges ? (
          <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-28 bg-muted/40 text-popover-foreground/80">'字段'</TableHead>
                  <TableHead className="bg-muted/40 text-popover-foreground/80">'修改前'</TableHead>
                  <TableHead className="bg-muted/40 text-popover-foreground/80">'修改后'</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.map((c) => (
                  <TableRow key={c.field} className="border-border align-top">
                    <TableCell className="py-3 font-medium text-popover-foreground">{c.label}</TableCell>
                    <TableCell className="max-w-[14rem] py-3 text-popover-foreground/65 sm:max-w-none">
                      <ChangeValue value={c.before} />
                    </TableCell>
                    <TableCell className="max-w-[14rem] py-3 font-medium text-popover-foreground sm:max-w-none">
                      <ChangeValue value={c.after} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : detail && Object.keys(detail).filter((k) => k !== 'changes').length > 0 ? (
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-xs text-popover-foreground/90">
            {JSON.stringify(detail, null, 2)}
          </pre>
        ) : (
          <p className="py-6 text-center text-sm text-popover-foreground/70">'暂无变更明细'</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function hasLogDetail(log: Record<string, unknown>): boolean {
  const detail = normalizeDetail(log.detail)
  return (detail?.changes?.length ?? 0) > 0 || Boolean(detail?.before || detail?.after)
}
