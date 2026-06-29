import { ActionLink } from 'components/action-link'
import { Card, CardContent } from 'components/common'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table'
import { cn } from 'lib/utils'

type InboundLine = Record<string, unknown>

function linePending(line: InboundLine) {
  return Math.max(0, Number(line.expectedQty) - Number(line.actualQty ?? 0))
}

function lineStockItems(line: InboundLine) {
  return (line.stockItems as Array<Record<string, unknown>>) ?? []
}

export function ReceiveLinesTable({
  lines,
  receiving,
  activeLineId,
  onReceive,
  onReprint,
}: {
  lines: InboundLine[]
  receiving: boolean
  activeLineId?: string | null
  onReceive: (line: InboundLine) => void
  onReprint?: (line: InboundLine, stockItem: Record<string, unknown>) => void
}) {
  return (
    <Card className="leader-panel-card">
      <CardContent className="px-0 pb-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">'物资'</TableHead>
              <TableHead>'编码'</TableHead>
              <TableHead>'规格'</TableHead>
              <TableHead>'单位'</TableHead>
              <TableHead className="text-right">'预计'</TableHead>
              <TableHead className="text-right">'实收'</TableHead>
              <TableHead>'批次'</TableHead>
              <TableHead className="pr-5 text-right">'操作'</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => {
              const id = String(line.id)
              const pending = linePending(line)
              const canReceive = receiving && pending > 0
              const active = activeLineId === id
              const stockItems = lineStockItems(line)
              const firstStock = stockItems[0]
              const material = line.material as {
                name?: string
                code?: string
                spec?: string
                unit?: string
              } | undefined

              return (
                <TableRow
                  key={id}
                  data-state={active ? 'selected' : undefined}
                  className={cn(
                    active && 'bg-primary/[0.06] hover:bg-primary/[0.06]',
                  )}
                >
                  <TableCell className="pl-5 font-medium">
                    {material?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {material?.code ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {material?.spec ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {material?.unit ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-number tabular-nums">
                    {String(line.expectedQty)}
                  </TableCell>
                  <TableCell className="text-right font-number tabular-nums">
                    {String(line.actualQty ?? 0)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {String(line.batchNo ?? '—')}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    {canReceive ? (
                      <ActionLink onClick={() => onReceive(line)}>
                        {active ? '收货中…' : '收货赋码'}
                      </ActionLink>
                    ) : firstStock && onReprint ? (
                      <ActionLink onClick={() => onReprint(line, firstStock)}>
                        补打标签
                      </ActionLink>
                    ) : Number(line.actualQty ?? 0) > 0 ? (
                      <span className="text-xs text-muted-foreground">'已完成'</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export { linePending }
