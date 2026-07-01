import { ActionLink } from 'components/action-link'
import {
  AppleTableFrame,
  TableCodeCell,
  appleTableCellClass,
  appleTableHeadClass,
  appleTableRowClass,
  imesDataTableClass,
} from 'components/grid-table'
import { LinePickOutcome, linePendingPick } from './pick-summary'
import { cn } from 'lib/utils'

type OutboundLine = Record<string, unknown>

const emptyCell = <span className="text-sm text-muted-foreground/40">—</span>

export function PickLinesTable({
  lines,
  picking,
  orderShipped,
  activeLineId,
  onPick,
}: {
  lines: OutboundLine[]
  picking: boolean
  orderShipped?: boolean
  activeLineId?: string | null
  onPick: (line: OutboundLine) => void
}) {
  return (
    <AppleTableFrame>
      <table className={imesDataTableClass}>
        <thead>
          <tr className="border-b border-border/25">
            <th className={cn(appleTableHeadClass, 'text-left')}>{'物资'}</th>
            <th className={appleTableHeadClass}>{'编码'}</th>
            <th className={appleTableHeadClass}>{'规格'}</th>
            <th className={cn(appleTableHeadClass, 'w-12')}>{'单位'}</th>
            <th className={cn(appleTableHeadClass, 'text-right')}>{'申请'}</th>
            <th className={cn(appleTableHeadClass, 'text-right')}>{'已拣'}</th>
            <th className={appleTableHeadClass}>{'差异'}</th>
            <th className={cn(appleTableHeadClass, 'text-right')}>{'操作'}</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-5 py-14 text-center text-sm text-muted-foreground">{'暂无明细'}</td>
            </tr>
          ) : (
            lines.map((line) => {
              const id = String(line.id)
              const pending = linePendingPick(line)
              const canPick = picking && pending > 0
              const active = activeLineId === id
              const material = line.material as {
                name?: string
                code?: string
                spec?: string
                unit?: string
              } | undefined
              const pickedQty = Number(line.pickedQty ?? 0)
              const requestedQty = Number(line.requestedQty)
              const fullyPicked = orderShipped && pickedQty > 0 && pickedQty === requestedQty

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
                      {requestedQty.toLocaleString()}
                    </span>
                  </td>
                  <td className={cn(appleTableCellClass, 'text-right')}>
                    <span
                      className={cn(
                        'font-number text-sm tabular-nums tracking-tight',
                        fullyPicked
                          ? 'font-semibold text-emerald-600'
                          : pickedQty > 0
                            ? 'font-medium text-foreground'
                            : 'text-muted-foreground/40',
                      )}
                    >
                      {pickedQty.toLocaleString()}
                    </span>
                  </td>
                  <td className={appleTableCellClass}>
                    <LinePickOutcome line={line} picking={picking} />
                  </td>
                  <td className={cn(appleTableCellClass, 'text-right')}>
                    {canPick ? (
                      <ActionLink
                        variant="pill"
                        className={cn(active && 'bg-primary/[0.14] font-semibold')}
                        onClick={() => onPick(line)}
                      >
                        {active ? '拣货中…' : pickedQty > 0 ? '继续拣货' : 'FIFO 拣货'}
                      </ActionLink>
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

export { linePendingPick }
