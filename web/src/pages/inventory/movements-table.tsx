import { useNavigate } from 'react-router-dom'
import { ActionLink } from 'components/action-link'
import {
  AppleTableFrame,
  appleTableCellClass,
  appleTableHeadClass,
  appleTableRowClass,
  imesDataTableClass,
} from 'components/grid-table'
import { MovementTypeBadge } from 'components/movement-type-badge'
import { cn, formatDateTime } from 'lib/utils'

type MovementRow = Record<string, unknown>

export function MovementsTable({
  rows,
  loading,
}: {
  rows: MovementRow[]
  loading?: boolean
}) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <AppleTableFrame>
        <div className="flex items-center justify-center py-14">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppleTableFrame>
    )
  }

  return (
    <AppleTableFrame>
      <table className={imesDataTableClass}>
        <thead>
          <tr className="border-b border-border/25">
            <th className={cn(appleTableHeadClass, 'text-left')}>时间</th>
            <th className={appleTableHeadClass}>类型</th>
            <th className={cn(appleTableHeadClass, 'text-left')}>物资</th>
            <th className={appleTableHeadClass}>二维码</th>
            <th className={cn(appleTableHeadClass, 'text-right')}>数量变化</th>
            <th className={cn(appleTableHeadClass, 'text-left')}>操作人</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-14 text-center text-[15px] text-muted-foreground">
                暂无流水
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const material = (row.stockItem as { material?: { name?: string; code?: string } })?.material
              const qr = String((row.stockItem as { qrCode?: string })?.qrCode ?? '')
              const operator = (row.operator as { name?: string })?.name ?? '—'

              return (
                <tr key={String(row.id)} className={appleTableRowClass}>
                  <td className={cn(appleTableCellClass, 'whitespace-nowrap text-[13px] tabular-nums text-muted-foreground')}>
                    {formatDateTime(String(row.createdAt))}
                  </td>
                  <td className={appleTableCellClass}>
                    <MovementTypeBadge type={String(row.type)} />
                  </td>
                  <td className={appleTableCellClass}>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium leading-snug text-foreground">
                        {material?.name ?? '—'}
                      </p>
                      {material?.code ? (
                        <p className="truncate text-[11px] text-muted-foreground">{material.code}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className={appleTableCellClass}>
                    {qr ? (
                      <ActionLink
                        className="max-w-[9rem] truncate text-[13px] font-normal"
                        onClick={() => navigate(`/trace?qr=${encodeURIComponent(qr)}`)}
                      >
                        {qr}
                      </ActionLink>
                    ) : (
                      <span className="text-[15px] text-muted-foreground/35">—</span>
                    )}
                  </td>
                  <td className={cn(appleTableCellClass, 'text-right')}>
                    <span className="font-number text-[15px] font-semibold tabular-nums tracking-tight text-foreground">
                      {Number(row.quantity ?? 0).toLocaleString()}
                    </span>
                  </td>
                  <td className={cn(appleTableCellClass, 'text-[13px] text-muted-foreground')}>
                    {operator}
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
