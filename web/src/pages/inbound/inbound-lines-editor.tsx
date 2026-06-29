import { useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from 'components/common'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table'
import { cn } from 'lib/utils'
import { InboundImportActions, type ImportResult } from './inbound-import-panel'
import type { InboundLineRow } from './queries'

export type MaterialOption = Record<string, unknown>

function materialMeta(material: MaterialOption | undefined) {
  if (!material) return null
  const parts = [
    material.code,
    material.spec,
    material.model,
    material.unit,
    (material.category as { name?: string } | undefined)?.name,
    material.manufacturer,
  ]
    .map((v) => (v == null || v === '' ? null : String(v)))
    .filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

export function InboundLinesEditor({
  lines,
  materials,
  onChange,
  onAddLine,
  importProps,
}: {
  lines: InboundLineRow[]
  materials: MaterialOption[]
  onChange: (lines: InboundLineRow[]) => void
  onAddLine: () => void
  importProps: {
    isParsing: boolean
    parsingKind: 'pdf' | 'image' | null
    parseError: string | null
    result: ImportResult | null
    onImportPdf: (file: File) => Promise<void>
    onImportImage: (file: File) => Promise<void>
    onDismissError: () => void
  }
}) {
  const materialMap = useMemo(() => {
    const map = new Map<string, MaterialOption>()
    for (const m of materials) map.set(String(m.id), m)
    return map
  }, [materials])

  const filledCount = lines.filter((l) => l.materialId).length

  const updateLine = (index: number, patch: Partial<InboundLineRow>) => {
    const next = [...lines]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const removeLine = (index: number) => {
    onChange(lines.filter((_, j) => j !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">
          入库明细
          {filledCount > 0 && (
            <span className="ml-2 text-xs font-normal tabular-nums text-muted-foreground">{filledCount} 行</span>
          )}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <InboundImportActions {...importProps} />
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={onAddLine}>
            <Plus className="size-3.5" />添加行</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--leader-card-border,hsl(var(--border)))]">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 bg-muted/30 pl-6 font-medium">'物资'</TableHead>
              <TableHead className="h-11 w-36 bg-muted/30 pr-6 text-right font-medium">'数量'</TableHead>
              <TableHead className="h-11 w-14 bg-muted/30" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">'暂无明细'</TableCell>
              </TableRow>
            ) : (
              lines.map((line, i) => {
                const material = line.materialId ? materialMap.get(line.materialId) : undefined
                const meta = materialMeta(material)
                const hasMaterial = Boolean(line.materialId)
                return (
                  <TableRow key={i} className={cn(!hasMaterial && 'bg-muted/15')}>
                    <TableCell className="py-3 pl-6 pr-8 align-top">
                      <Select
                        value={line.materialId || 'none'}
                        onValueChange={(v) => updateLine(i, { materialId: v === 'none' ? '' : v })}
                      >
                        <SelectTrigger className="h-10 max-w-xl border-0 bg-transparent px-0 shadow-none focus:ring-0">
                          <SelectValue placeholder='选择物资' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">'选择物资'</SelectItem>
                          {materials.map((m) => (
                            <SelectItem key={String(m.id)} value={String(m.id)}>
                              {String(m.code)} · {String(m.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {meta ? (
                        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{meta}</p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground/60">'选择后显示编码、规格、单位等属性'</p>
                      )}
                    </TableCell>
                    <TableCell className="py-3 pr-6 align-top">
                      <Input
                        type="number"
                        min={1}
                        className="ml-auto h-10 w-28 border-0 bg-muted/40 text-right text-base tabular-nums shadow-none focus-visible:ring-1"
                        value={line.expectedQty}
                        onChange={(e) => updateLine(i, { expectedQty: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      {lines.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 text-muted-foreground hover:text-destructive"
                          onClick={() => removeLine(i)}
                          title='删除行'
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
