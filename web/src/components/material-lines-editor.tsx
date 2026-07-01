import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { AddButton } from 'components/add-button'
import { Button } from 'components/common'
import {
  GridTableFrame,
  gridTableCellClass,
  gridTableClass,
  gridTableHeadClass,
  gridTableInputClass,
  gridTableRowClass,
  gridTableRowLastClass,
  gridTableSelectTriggerClass,
} from 'components/grid-table'
import {
  TableForm,
  tableFormCellClass,
  tableFormHeaderClass,
  tableFormIndexClass,
  tableFormInputClass,
  tableFormReadonlyClass,
  tableFormSelectTriggerClass,
} from 'components/table-form'
import { MaterialSearchSelect } from 'components/material-search-select'
import { QuantityInput } from 'components/quantity-input'
import { Input } from 'components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table'
import { cn } from 'lib/utils'

export type MaterialOption = Record<string, unknown>

function materialField(material: MaterialOption | undefined, key: string) {
  const { t } = useTranslation()
  if (!material) return null
  const v = material[key]
  if (v == null || v === '') return null
  return String(v)
}

function materialCategoryName(material: MaterialOption | undefined) {
  const { t } = useTranslation()
  const name = (material?.category as { name?: string } | undefined)?.name
  return name ? String(name) : null
}

export function materialSummary(material: MaterialOption | undefined) {
  const { t } = useTranslation()
  if (!material) return null
  const parts = [
    materialField(material, 'code'),
    materialField(material, 'spec'),
    materialField(material, 'model'),
    materialField(material, 'unit'),
    materialCategoryName(material),
    materialField(material, 'manufacturer'),
  ].filter(Boolean) as string[]
  return parts.length ? parts.join(' · ') : null
}

function materialReadonlyColumns(material: MaterialOption | undefined) {
  const { t } = useTranslation()
  return {
    spec: materialField(material, 'spec'),
    unit: materialField(material, 'unit'),
    category: materialCategoryName(material),
  }
}

function TableFormReadonlyCell({ value }: { value: string | null }) {
  const { t } = useTranslation()
  return (
    <span className={cn(tableFormReadonlyClass, !value && 'text-muted-foreground/45')}>
      {value || '—'}
    </span>
  )
}

type MaterialLine = { materialId: string; quantity: number; manufacturer?: string }

export function MaterialLinesEditor({
  lines,
  materials,
  onChange,
  onAddLine,
  footer,
  quantityLabel = '数量',
  hideFooterAdd,
  manufacturerEditable,
  variant = 'grid',
}: {
  lines: MaterialLine[]
  materials: MaterialOption[]
  onChange: (lines: MaterialLine[]) => void
  onAddLine: () => void
  footer?: ReactNode
  quantityLabel?: string
  hideFooterAdd?: boolean
  /** 厂牌列可手动输入（不随物资带出） */
  manufacturerEditable?: boolean
  /** grid：列表风格；table-form：dbm 采购清单 */
  variant?: 'grid' | 'table-form'
}) {
  const materialMap = useMemo(() => {
    const map = new Map<string, MaterialOption>()
    for (const m of materials) map.set(String(m.id), m)
    return map
  }, [materials])

  const filledCount = lines.filter((l) => l.materialId).length

  const updateLine = (index: number, patch: Partial<MaterialLine>) => {
    const next = [...lines]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const removeLine = (index: number) => {
    onChange(lines.filter((_, j) => j !== index))
  }

  if (variant === 'table-form') {
    const colCount = manufacturerEditable ? 7 : 6
    return (
      <TableForm wide>
        <colgroup>
          <col className="table-form__col-index" />
          <col className="table-form__col-material" />
          {manufacturerEditable ? <col className="table-form__col-manufacturer" /> : null}
          <col className="table-form__col-spec" />
          <col className="table-form__col-unit" />
          <col className="table-form__col-category" />
          <col className="table-form__col-qty" />
        </colgroup>
        <tbody>
          <tr>
            <td className={tableFormHeaderClass} title={'序号'}>#</td>
            <td className={cn(tableFormHeaderClass, 'text-left')}>{'物资'}</td>
            {manufacturerEditable ? <td className={tableFormHeaderClass}>{'厂牌'}</td> : null}
            <td className={tableFormHeaderClass}>{'规格'}</td>
            <td className={tableFormHeaderClass}>{'单位'}</td>
            <td className={tableFormHeaderClass}>{'大类'}</td>
            <td className={cn(tableFormHeaderClass, 'text-right')}>{quantityLabel}</td>
          </tr>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={colCount} className={cn(tableFormCellClass, 'h-16 text-center text-[13px] text-muted-foreground')}>{'暂无明细'}</td>
            </tr>
          ) : (
            lines.map((line, i) => {
              const material = line.materialId ? materialMap.get(line.materialId) : undefined
              const cols = materialReadonlyColumns(material)
              return (
                <tr key={i}>
                  <td className={tableFormIndexClass}>
                    <div className="flex items-center justify-center gap-0.5">
                      {lines.length > 1 && (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          title={'删除此行'}
                          onClick={() => removeLine(i)}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                      <span className="text-[12px] tabular-nums text-muted-foreground">{i + 1}</span>
                    </div>
                  </td>
                  <td className={tableFormCellClass}>
                    <MaterialSearchSelect
                      materials={materials}
                      value={line.materialId}
                      onChange={(materialId) => updateLine(i, { materialId })}
                      className={tableFormSelectTriggerClass}
                    />
                  </td>
                  {manufacturerEditable ? (
                    <td className={tableFormCellClass}>
                      <Input
                        className={tableFormInputClass}
                        value={line.manufacturer ?? ''}
                        onChange={(e) => updateLine(i, { manufacturer: e.target.value })}
                        placeholder={'厂牌'}
                      />
                    </td>
                  ) : null}
                  <td className={tableFormCellClass}>
                    <TableFormReadonlyCell value={cols.spec} />
                  </td>
                  <td className={tableFormCellClass}>
                    <TableFormReadonlyCell value={cols.unit} />
                  </td>
                  <td className={tableFormCellClass}>
                    <TableFormReadonlyCell value={cols.category} />
                  </td>
                  <td className={tableFormCellClass}>
                    <QuantityInput
                      min={1}
                      className={cn(tableFormInputClass, 'text-right tabular-nums')}
                      value={line.quantity}
                      onChange={(quantity) => updateLine(i, { quantity })}
                    />
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </TableForm>
    )
  }

  return (
    <GridTableFrame>
      <Table className={cn(gridTableClass, 'min-w-[28rem]')}>
        <TableHeader>
          <TableRow className={`${gridTableRowClass} hover:bg-transparent`}>
            <TableHead className={gridTableHeadClass}>{'物资'}</TableHead>
            <TableHead className={cn(gridTableHeadClass, 'w-28 text-right')}>{quantityLabel}</TableHead>
            <TableHead className={cn(gridTableHeadClass, 'w-12 border-r-0')} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={3} className={`${gridTableCellClass} h-20 border-r-0 text-center text-muted-foreground`}>{'暂无明细'}</TableCell>
            </TableRow>
          ) : (
            lines.map((line, i) => {
              const material = line.materialId ? materialMap.get(line.materialId) : undefined
              const summary = materialSummary(material)
              const hasMaterial = Boolean(line.materialId)
              const isLast = i === lines.length - 1
              return (
                <TableRow
                  key={i}
                  className={cn(gridTableRowClass, !hasMaterial && 'bg-muted/10', isLast && gridTableRowLastClass)}
                >
                  <TableCell className={gridTableCellClass}>
                    <div className="space-y-1">
                      <MaterialSearchSelect
                        materials={materials}
                        value={line.materialId}
                        onChange={(materialId) => updateLine(i, { materialId })}
                        className={gridTableSelectTriggerClass}
                      />
                      {summary && (
                        <p className="truncate pl-0.5 text-xs text-muted-foreground">{summary}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={gridTableCellClass}>
                    <QuantityInput
                      min={1}
                      className={cn(gridTableInputClass, 'ml-auto w-24 text-right tabular-nums')}
                      value={line.quantity}
                      onChange={(quantity) => updateLine(i, { quantity })}
                    />
                  </TableCell>
                  <TableCell className={gridTableCellClass}>
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLine(i)}
                        title={'删除行'}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
      {(footer || !hideFooterAdd || filledCount > 0) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/30 px-4 py-2.5">
          {footer}
          {!hideFooterAdd && <AddButton title={'行'} onClick={onAddLine} />}
          {filledCount > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground">已填 {filledCount} 行</span>
          )}
        </div>
      )}
    </GridTableFrame>
  )
}
