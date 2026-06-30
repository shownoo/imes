import { ActionLink } from 'components/action-link'
import { TableCodeCell } from 'components/grid-table'
import { Card, CardContent } from 'components/common'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table'
import { LineReceiveOutcome } from './receive-summary'
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
  orderCompleted,
  activeLineId,
  warehouseName,
  onReceive,
  onReprint,
}: {
  lines: InboundLine[]
  receiving: boolean
  orderCompleted?: boolean
  activeLineId?: string | null
  warehouseName?: string
  onReceive: (line: InboundLine) => void
  onReprint?: (line: InboundLine, stockItem: Record<string, unknown>) => void
}) {
  return (
    <Card className="leader-panel-card">
      <CardContent className="px-0 pb-0 pt-0">
        {warehouseName && receiving && (
          <p className="border-b border-border/30 px-5 py-2.5 text-xs text-muted-foreground">
            上架时请扫描「{warehouseName}」下的货位码
          </p>
        )}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">物资</TableHead>
              <TableHead>编码</TableHead>
              <TableHead>规格</TableHead>
              <TableHead>单位</TableHead>
              <TableHead className="text-right">预计</TableHead>
              <TableHead className="text-right">实收</TableHead>
              <TableHead>差异</TableHead>
              <TableHead>批次</TableHead>
              <TableHead>货位</TableHead>
              <TableHead className="pr-5 text-right">操作</TableHead>
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
                  <TableCell
                    className={cn(
                      'text-right font-number tabular-nums',
                      orderCompleted
                        && Number(line.actualQty ?? 0) > 0
                        && Number(line.actualQty ?? 0) === Number(line.expectedQty)
                        && 'font-medium text-emerald-600',
                    )}
                  >
                    {String(line.actualQty ?? 0)}
                  </TableCell>
                  <TableCell>
                    <LineReceiveOutcome line={line} receiving={receiving} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {line.batchNo
                      ? <TableCodeCell className="font-normal text-muted-foreground">{String(line.batchNo)}</TableCodeCell>
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {firstStock
                      ? (firstStock.shelf as { code?: string } | undefined)?.code ?? (
                        <span className="text-amber-600">未上架</span>
                      )
                      : '—'}
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
