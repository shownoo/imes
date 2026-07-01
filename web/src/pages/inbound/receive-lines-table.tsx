import { useTranslation } from 'react-i18next'
import { ActionLink } from 'components/action-link'
import {
  AppleTableFrame,
  TableCodeCell,
  appleTableCellClass,
  appleTableHeadClass,
  appleTableRowClass,
  imesDataTableClass,
} from 'components/grid-table'
import { LineReceiveOutcome } from './receive-summary'
import { cn } from 'lib/utils'

type InboundLine = Record<string, unknown>

function linePending(line: InboundLine) {
  const { t } = useTranslation()
  return Math.max(0, Number(line.expectedQty) - Number(line.actualQty ?? 0))
}

function lineStockItems(line: InboundLine) {
  const { t } = useTranslation()
  return (line.stockItems as Array<Record<string, unknown>>) ?? []
}

function stockBatchNo(item: Record<string, unknown>) {
  const { t } = useTranslation()
  return (item.batch as { batchNo?: string } | undefined)?.batchNo
}

function stockShelfCode(item: Record<string, unknown>) {
  const { t } = useTranslation()
  return (item.shelf as { code?: string } | undefined)?.code
}

const emptyCell = <span className="text-sm text-muted-foreground/40">—</span>

export function ReceiveLinesTable({
  lines,
  receiving,
  orderCompleted,
  activeLineId,
  onReceive,
  onReprint,
}: {
  lines: InboundLine[]
  receiving: boolean
  orderCompleted?: boolean
  activeLineId?: string | null
  onReceive: (line: InboundLine) => void
  onReprint?: (line: InboundLine, stockItem: Record<string, unknown>) => void
}) {
  return (
    <AppleTableFrame>
      <table className={imesDataTableClass}>
        <thead>
          <tr className="border-b border-border/25">
            <th className={cn(appleTableHeadClass, 'text-left')}>{'物资'}</th>
            <th className={cn(appleTableHeadClass, 'text-left')}>{'厂牌'}</th>
            <th className={cn(appleTableHeadClass, 'text-left')}>{'编码'}</th>
            <th className={cn(appleTableHeadClass, 'text-left')}>{'规格'}</th>
            <th className={cn(appleTableHeadClass, 'w-12 text-center')}>{'单位'}</th>
            <th className={cn(appleTableHeadClass, 'text-right')}>{'预计'}</th>
            <th className={cn(appleTableHeadClass, 'text-right')}>{'实收'}</th>
            <th className={cn(appleTableHeadClass, 'text-left')}>{'差异'}</th>
            <th className={cn(appleTableHeadClass, 'text-left')}>{'批次'}</th>
            <th className={cn(appleTableHeadClass, 'text-left')}>{'货位'}</th>
            <th className={cn(appleTableHeadClass, 'text-right')}>{'操作'}</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-5 py-14 text-center text-sm text-muted-foreground">{'暂无明细'}</td>
            </tr>
          ) : (
            lines.map((line) => {
              const id = String(line.id)
              const pending = linePending(line)
              const canReceive = receiving && pending > 0
              const active = activeLineId === id
              const stockItems = lineStockItems(line)
              const material = line.material as {
                name?: string
                code?: string
                spec?: string
                unit?: string
              } | undefined
              const actualQty = Number(line.actualQty ?? 0)
              const expectedQty = Number(line.expectedQty)
              const fullyReceived = orderCompleted && actualQty > 0 && actualQty === expectedQty

              return (
                <tr
                  key={id}
                  className={cn(
                    appleTableRowClass,
                    active && 'bg-primary/[0.07] hover:bg-primary/[0.07]',
                  )}
                >
                  <td
                    className={cn(
                      appleTableCellClass,
                      'border-l-[3px]',
                      active ? 'border-l-primary' : 'border-l-transparent',
                    )}
                  >
                    <span className="text-sm font-medium leading-snug text-foreground">
                      {material?.name ?? '—'}
                    </span>
                  </td>
                  <td className={cn(appleTableCellClass, 'max-w-[7rem] truncate text-muted-foreground')}>
                    {line.manufacturer ? String(line.manufacturer) : emptyCell}
                  </td>
                  <td className={appleTableCellClass}>
                    {material?.code
                      ? <TableCodeCell>{material.code}</TableCodeCell>
                      : emptyCell}
                  </td>
                  <td className={cn(appleTableCellClass, 'max-w-[7rem] truncate text-muted-foreground')}>
                    {material?.spec ?? emptyCell}
                  </td>
                  <td className={cn(appleTableCellClass, 'text-center text-muted-foreground')}>
                    {material?.unit ?? emptyCell}
                  </td>
                  <td className={cn(appleTableCellClass, 'text-right')}>
                    <span className="font-number text-sm font-semibold tabular-nums tracking-tight text-foreground">
                      {expectedQty.toLocaleString()}
                    </span>
                  </td>
                  <td className={cn(appleTableCellClass, 'text-right')}>
                    <span
                      className={cn(
                        'font-number text-sm tabular-nums tracking-tight',
                        fullyReceived
                          ? 'font-semibold text-emerald-600'
                          : actualQty > 0
                            ? 'font-medium text-foreground'
                            : 'text-muted-foreground/40',
                      )}
                    >
                      {actualQty.toLocaleString()}
                    </span>
                  </td>
                  <td className={appleTableCellClass}>
                    <LineReceiveOutcome line={line} receiving={receiving} />
                  </td>
                  <td className={appleTableCellClass}>
                    {stockItems.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {stockItems.map((item, i) => {
                          const batchNo = stockBatchNo(item)
                          return batchNo ? (
                            <TableCodeCell key={String(item.id ?? i)} className="text-muted-foreground">
                              {batchNo}
                            </TableCodeCell>
                          ) : (
                            <span key={String(item.id ?? i)} className="text-sm text-muted-foreground/40">—</span>
                          )
                        })}
                      </div>
                    ) : line.batchNo ? (
                      <TableCodeCell className="text-muted-foreground">{String(line.batchNo)}</TableCodeCell>
                    ) : (
                      emptyCell
                    )}
                  </td>
                  <td className={appleTableCellClass}>
                    {stockItems.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {stockItems.map((item, i) => {
                          const shelfCode = stockShelfCode(item)
                          return shelfCode ? (
                            <TableCodeCell key={String(item.id ?? i)} className="text-muted-foreground">
                              {shelfCode}
                            </TableCodeCell>
                          ) : (
                            <span
                              key={String(item.id ?? i)}
                              className="inline-flex w-fit rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600"
                            >{'未上架'}</span>
                          )
                        })}
                      </div>
                    ) : emptyCell}
                  </td>
                  <td className={cn(appleTableCellClass, 'text-right')}>
                    {canReceive || (stockItems.length > 0 && onReprint) ? (
                      <div className="flex flex-col items-end gap-0.5">
                        {canReceive && (
                          <ActionLink
                            variant="pill"
                            className={cn(active && 'bg-primary/[0.14] font-semibold')}
                            onClick={() => onReceive(line)}
                          >
                            {active ? '收货中…' : pending < expectedQty ? '继续收货' : '收货赋码'}
                          </ActionLink>
                        )}
                        {stockItems.length > 0 && onReprint && stockItems.map((item, i) => (
                          <ActionLink
                            key={String(item.id ?? i)}
                            className="text-xs text-muted-foreground"
                            onClick={() => onReprint(line, item)}
                          >
                            {stockItems.length > 1 ? `补打 · ${stockBatchNo(item) ?? i + 1}` : '补打标签'}
                          </ActionLink>
                        ))}
                      </div>
                    ) : emptyCell}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </AppleTableFrame>
  )
}

export { linePending }
