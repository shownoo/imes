import { useMemo, type ReactNode } from 'react'
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
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table'
import { cn } from 'lib/utils'

export type MaterialOption = Record<string, unknown>

function materialField(material: MaterialOption | undefined, key: string) {
  if (!material) return null
  const v = material[key]
  if (v == null || v === '') return null
  return String(v)
}

function materialCategoryName(material: MaterialOption | undefined) {
  const name = (material?.category as { name?: string } | undefined)?.name
  return name ? String(name) : null
}

export function materialSummary(material: MaterialOption | undefined) {
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

type MaterialLine = { materialId: string; quantity: number }

export function MaterialLinesEditor({
  lines,
  materials,
  onChange,
  onAddLine,
  footer,
  quantityLabel = '数量',
}: {
  lines: MaterialLine[]
  materials: MaterialOption[]
  onChange: (lines: MaterialLine[]) => void
  onAddLine: () => void
  footer?: ReactNode
  quantityLabel?: string
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

  return (
    <GridTableFrame>
      <Table className={cn(gridTableClass, 'min-w-[28rem]')}>
        <TableHeader>
          <TableRow className={`${gridTableRowClass} hover:bg-transparent`}>
            <TableHead className={gridTableHeadClass}>物资</TableHead>
            <TableHead className={cn(gridTableHeadClass, 'w-28 text-right')}>{quantityLabel}</TableHead>
            <TableHead className={cn(gridTableHeadClass, 'w-12 border-r-0')} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={3} className={`${gridTableCellClass} h-20 border-r-0 text-center text-muted-foreground`}>
                暂无明细
              </TableCell>
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
                      <Select
                        value={line.materialId || 'none'}
                        onValueChange={(v) => updateLine(i, { materialId: v === 'none' ? '' : v })}
                      >
                        <SelectTrigger className={gridTableSelectTriggerClass}>
                          <SelectValue placeholder="选择物资" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">选择物资</SelectItem>
                          {materials.map((m) => (
                            <SelectItem key={String(m.id)} value={String(m.id)}>
                              {String(m.code)} · {String(m.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {summary && (
                        <p className="truncate pl-0.5 text-xs text-muted-foreground">{summary}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={gridTableCellClass}>
                    <Input
                      type="number"
                      min={1}
                      className={cn(gridTableInputClass, 'ml-auto w-24 text-right tabular-nums')}
                      value={line.quantity}
                      onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
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
                        title="删除行"
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
      <div className="flex flex-wrap items-center gap-2 border-t border-border/30 px-4 py-2.5">
        {footer}
        <AddButton title="行" onClick={onAddLine} />
        {filledCount > 0 && (
          <span className="text-xs tabular-nums text-muted-foreground">已填 {filledCount} 行</span>
        )}
      </div>
    </GridTableFrame>
  )
}
