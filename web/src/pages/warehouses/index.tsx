import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { Plus } from 'lucide-react'
import { PageHeader, DataTable, Badge, Button, RowActions, Card, CardContent, CardHeader, CardTitle } from 'components/common'
import { QrLabelDialog, QrPrintButton } from 'components/qr-label-dialog'
import { shelfToLabel, type QrLabelData } from 'components/qr-label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs'
import { ZONE_LABELS } from 'lib/utils'
import { GET_WAREHOUSES, GET_SHELVES, DEL_WAREHOUSE, DEL_SHELF, type WarehouseTab } from './queries'

export default function WarehousesIndex() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as WarehouseTab) || 'warehouse'
  const [filterWh, setFilterWh] = useState('all')
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)

  const openLabel = (label: QrLabelData) => {
    setLabelData(label)
    setLabelOpen(true)
  }

  const refetchOpts = { refetchQueries: ['GetWarehouses', 'GetShelves'] }
  const { data: whData, loading: whLoading } = useQuery(GET_WAREHOUSES)
  const { data: shData, loading: shLoading } = useQuery(GET_SHELVES, {
    variables: { warehouseId: filterWh === 'all' ? undefined : filterWh, input: { take: 200 } },
  })
  const [delWarehouse] = useMutation(DEL_WAREHOUSE, refetchOpts)
  const [delShelf] = useMutation(DEL_SHELF, refetchOpts)

  const warehouses = (whData?.getWarehouses as { warehouses: Array<Record<string, unknown>> })?.warehouses ?? []
  const shelves = (shData?.getShelves as { shelves: Array<Record<string, unknown>> })?.shelves ?? []

  const handleDelete = async (type: WarehouseTab, id: string) => {
    if (!confirm('确认删除？')) return
    try {
      type === 'warehouse' ? await delWarehouse({ variables: { input: { id } } }) : await delShelf({ variables: { input: { id } } })
    } catch (e) { alert(e instanceof Error ? e.message : '删除失败') }
  }

  return (
    <div>
      <PageHeader
        title="库区货位维护"
        desc="A/B/C/D 四区 · 货架二维码 · 货位容量"
        action={
          <Button onClick={() => navigate(tab === 'warehouse' ? '/warehouses/warehouse/create' : `/warehouses/shelf/create${filterWh !== 'all' ? `?warehouseId=${filterWh}` : ''}`)}>
            <Plus className="size-4" /> {tab === 'warehouse' ? '新增库区' : '新增货位'}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
        <div className="mb-6 flex items-center gap-4">
          <TabsList><TabsTrigger value="warehouse">库区</TabsTrigger><TabsTrigger value="shelf">货位</TabsTrigger></TabsList>
          {tab === 'shelf' && (
            <Select value={filterWh} onValueChange={setFilterWh}>
              <SelectTrigger className="w-48"><SelectValue placeholder="全部库区" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部库区</SelectItem>
                {warehouses.map((w) => <SelectItem key={String(w.id)} value={String(w.id)}>{String(w.name)}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsContent value="warehouse">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {warehouses.map((wh) => (
              <Card key={String(wh.id)} className="group relative">
                <CardHeader className="pb-2"><Badge variant="info">{ZONE_LABELS[String(wh.zone)]}</Badge><CardTitle className="text-base">{String(wh.name)}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{String(wh.code)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{String(wh.area ?? '—')} m² · 容量 {String(wh.capacity ?? '—')}</p>
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100">
                    <RowActions onEdit={() => navigate(`/warehouses/warehouse/${wh.id}/edit`)} onDelete={() => handleDelete('warehouse', String(wh.id))} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shelf">
          <DataTable loading={whLoading || shLoading} columns={[
            { key: 'code', title: '货位编码' }, { key: 'name', title: '名称' }, { key: 'zone', title: '区域' },
            { key: 'level', title: '层' }, { key: 'qrCode', title: '货架码' },
            { key: 'warehouse', title: '所属库区', render: (r) => (r.warehouse as { name?: string })?.name ?? '—' },
            { key: 'count', title: '库存单元', render: (r) => String((r._count as { stockItems?: number })?.stockItems ?? 0) },
            { key: 'action', title: '操作', render: (r) => (
              <div className="flex items-center gap-1">
                <QrPrintButton label={shelfToLabel(r)} onOpen={openLabel} />
                <RowActions onEdit={() => navigate(`/warehouses/shelf/${r.id}/edit`)} onDelete={() => handleDelete('shelf', String(r.id))} />
              </div>
            ) },
          ]} rows={shelves} />
        </TabsContent>
      </Tabs>

      <QrLabelDialog open={labelOpen} onOpenChange={setLabelOpen} label={labelData} description="货位标签，贴于货架便于上架扫码" />
    </div>
  )
}
