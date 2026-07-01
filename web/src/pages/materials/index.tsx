import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { Layers, LayoutGrid, MapPin, Package, Search, Signpost, Truck, Warehouse as WarehouseIcon } from 'lucide-react'
import { PageHeader, DataTable, RowActions, Badge, PageCreateButton, CardContent, CardHeader, CardTitle, TABLE_KEYS } from 'components/common'
import { ImageThumb } from 'components/image-gallery'
import { DebounceInput } from 'components/debounce-input'
import { LeaderSurfaceCard } from 'components/leader-surface-card'
import { QrLabelDialog, QrPrintButton } from 'components/qr-label-dialog'
import { shelfToLabel, type QrLabelData } from 'components/qr-label'
import { SectionMenu, SearchInputShell, ListToolbar } from 'components/section-menu'
import { WarehouseFilterBar } from 'components/warehouse-filter'
import { Tabs, TabsContent } from 'components/ui/tabs'
import { listFilterInputClass } from 'lib/list-index-chrome'
import { ZONE_LABELS } from 'lib/utils'
import { buildMaterialSearchIndex, filterMaterialsBySearch } from 'lib/material-search'
import { buildSupplierSearchIndex, filterSuppliersBySearch } from 'lib/supplier-search'
import {
  GET_MATERIALS, GET_CATEGORIES, GET_SUPPLIERS, GET_OUTBOUND_PURPOSES, GET_OUTBOUND_DESTINATIONS, GET_ORG_CITY,
  DEL_MATERIAL, DEL_CATEGORY, DEL_SUPPLIER, DEL_OUTBOUND_PURPOSE, DEL_OUTBOUND_DESTINATION,
  TAB_LABELS, type MasterTab,
} from './queries'
import { GET_WAREHOUSES, GET_SHELVES, DEL_WAREHOUSE, DEL_SHELF } from 'pages/warehouses/queries'

const MASTER_MENU = [
  { value: 'materials' as const, label: TAB_LABELS.materials, icon: Package },
  { value: 'categories' as const, label: TAB_LABELS.categories, icon: Layers },
  { value: 'suppliers' as const, label: TAB_LABELS.suppliers, icon: Truck },
  { value: 'purposes' as const, label: TAB_LABELS.purposes, icon: Signpost },
  { value: 'destinations' as const, label: TAB_LABELS.destinations, icon: MapPin },
  { value: 'warehouses' as const, label: TAB_LABELS.warehouses, icon: WarehouseIcon },
  { value: 'shelves' as const, label: TAB_LABELS.shelves, icon: LayoutGrid },
]

export default function MaterialsIndex() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as MasterTab) || 'materials'
  const [search, setSearch] = useState('')
  const [filterWh, setFilterWh] = useState('all')
  const [supplierSearch, setSupplierSearch] = useState('')
  const [shelfSearch, setShelfSearch] = useState('')
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)

  const openLabel = (label: QrLabelData) => {
    setLabelData(label)
    setLabelOpen(true)
  }

  const refetchOpts = {
    refetchQueries: ['GetMaterials', 'GetCategories', 'GetSuppliers', 'GetOutboundPurposes', 'GetOutboundDestinations', 'GetWarehouses', 'GetShelves'],
  }
  const { data: matData, loading: matLoading } = useQuery(GET_MATERIALS, { variables: { input: { take: 100 } } })
  const { data: catData, loading: catLoading } = useQuery(GET_CATEGORIES, { variables: { input: { take: 100 } } })
  const { data: supData, loading: supLoading } = useQuery(GET_SUPPLIERS, { variables: { input: { take: 100 } } })
  const { data: purposeData, loading: purposeLoading } = useQuery(GET_OUTBOUND_PURPOSES, { variables: { input: { take: 200 } } })
  const { data: orgData } = useQuery(GET_ORG_CITY)
  const orgCity = String((orgData?.getOrgCity as { city?: string } | undefined)?.city ?? '武汉市')
  const { data: destinationData, loading: destinationLoading } = useQuery(GET_OUTBOUND_DESTINATIONS, {
    variables: { city: orgCity, input: { take: 200 } },
    skip: !orgData,
  })
  const { data: whData, loading: whLoading } = useQuery(GET_WAREHOUSES)
  const { data: shData, loading: shLoading } = useQuery(GET_SHELVES, {
    variables: { warehouseId: filterWh === 'all' ? undefined : filterWh, input: { take: 200 } },
  })

  const [delMaterial] = useMutation(DEL_MATERIAL, refetchOpts)
  const [delCategory] = useMutation(DEL_CATEGORY, refetchOpts)
  const [delSupplier] = useMutation(DEL_SUPPLIER, refetchOpts)
  const [delPurpose] = useMutation(DEL_OUTBOUND_PURPOSE, refetchOpts)
  const [delDestination] = useMutation(DEL_OUTBOUND_DESTINATION, refetchOpts)
  const [delWarehouse] = useMutation(DEL_WAREHOUSE, refetchOpts)
  const [delShelf] = useMutation(DEL_SHELF, refetchOpts)

  const materials = (matData?.getMaterials as { materials: Array<Record<string, unknown>> })?.materials ?? []
  const filteredMaterials = useMemo(() => {
    if (!search.trim()) return materials
    const index = buildMaterialSearchIndex(materials)
    const ids = new Set(filterMaterialsBySearch(index, search).map((i) => i.id))
    return materials.filter((m) => ids.has(String(m.id)))
  }, [materials, search])
  const categories = (catData?.getCategories as { categories: Array<Record<string, unknown>> })?.categories ?? []
  const suppliers = (supData?.getSuppliers as { suppliers: Array<Record<string, unknown>> })?.suppliers ?? []
  const purposes = (purposeData?.getOutboundPurposes as { purposes: Array<Record<string, unknown>> })?.purposes ?? []
  const destinations = (destinationData?.getOutboundDestinations as { destinations: Array<Record<string, unknown>> })?.destinations ?? []
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers
    const index = buildSupplierSearchIndex(suppliers)
    const ids = new Set(filterSuppliersBySearch(index, supplierSearch).map((i) => i.id))
    return suppliers.filter((s) => ids.has(String(s.id)))
  }, [suppliers, supplierSearch])
  const warehouses = (whData?.getWarehouses as { warehouses: Array<Record<string, unknown>> })?.warehouses ?? []
  const shelves = (shData?.getShelves as { shelves: Array<Record<string, unknown>> })?.shelves ?? []
  const filteredShelves = shelfSearch
    ? shelves.filter((s) => {
        const q = shelfSearch.toLowerCase()
        return String(s.code).toLowerCase().includes(q) || String(s.name).toLowerCase().includes(q)
      })
    : shelves

  const setTab = (t: MasterTab) => setParams({ tab: t })

  const createPath = {
    materials: '/materials/material/create',
    categories: '/materials/category/create',
    suppliers: '/materials/supplier/create',
    purposes: '/materials/purpose/create',
    destinations: '/materials/destination/create',
    warehouses: '/materials/warehouse/create',
    shelves: `/materials/shelf/create${filterWh !== 'all' ? `?warehouseId=${filterWh}` : ''}`,
  }[tab]

  const editPath = (id: string) => ({
    materials: `/materials/material/${id}/edit`,
    categories: `/materials/category/${id}/edit`,
    suppliers: `/materials/supplier/${id}/edit`,
    purposes: `/materials/purpose/${id}/edit`,
    destinations: `/materials/destination/${id}/edit`,
    warehouses: `/materials/warehouse/${id}/edit`,
    shelves: `/materials/shelf/${id}/edit`,
  }[tab])

  const handleDelete = async (type: MasterTab, id: string) => {
    if (!confirm('确认删除？')) return
    const mut = {
      materials: delMaterial,
      categories: delCategory,
      suppliers: delSupplier,
      purposes: delPurpose,
      destinations: delDestination,
      warehouses: delWarehouse,
      shelves: delShelf,
    }[type]
    try { await mut({ variables: { input: { id } } }) } catch (e) { alert(e instanceof Error ? e.message : '删除失败') }
  }

  return (
    <div>
      <PageHeader
        title="基础数据维护"
        desc="维护物资档案、大类、供应商、出库用途、出库目的地、仓库与货位等主数据"
        titleTip="中心主库 + 战略备库 · A/B/C/D 四区分区 · 货位二维码"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as MasterTab)}>
        <SectionMenu
          className="mb-4"
          items={MASTER_MENU}
          value={tab}
          onChange={(v) => setTab(v as MasterTab)}
        />

        <TabsContent value="materials" className="mt-0">
          <ListToolbar
            className="mb-3"
            search={
              <SearchInputShell>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <DebounceInput
                  key="materials-search"
                  className={listFilterInputClass + ' pl-8'}
                  placeholder="编码/名称/拼音"
                  defaultValue={search}
                  debounceTime={400}
                  onSearch={setSearch}
                />
              </SearchInputShell>
            }
            action={
              <PageCreateButton
                label="新增物资档案"
                onClick={() => navigate('/materials/material/create')}
              />
            }
          />
          <DataTable tableKey={TABLE_KEYS.MATERIALS_MASTER} loading={matLoading} columns={[
            { key: 'thumb', title: '图片', tip: '物资参考图片', render: (r) => (
              <ImageThumb
                images={r.images as Array<{ file?: { url?: string; name?: string } }>}
                totalCount={(r._count as { images?: number })?.images}
              />
            ) },
            { key: 'code', title: '编码', tip: '物资唯一编码，全局不可重复' },
            { key: 'name', title: '名称', tip: '物资标准名称' },
            { key: 'spec', title: '规格', tip: '包装规格或型号' },
            { key: 'unit', title: '单位', tip: '计量单位，如件、箱、套' },
            { key: 'category', title: '大类', tip: '所属物资大类，决定库内分区与效期规则', render: (r) => (r.category as { name?: string })?.name ?? '—' },
            { key: 'supplier', title: '默认供应商', tip: '采购入库时的默认供货方', render: (r) => (r.supplier as { name?: string })?.name ?? '—' },
            { key: 'action', title: '操作', render: (r) => <RowActions onEdit={() => navigate(editPath(String(r.id)))} onDelete={() => handleDelete('materials', String(r.id))} /> },
          ]} rows={filteredMaterials} />
        </TabsContent>
        <TabsContent value="categories" className="mt-0">
          <ListToolbar
            className="mb-3"
            action={
              <PageCreateButton
                label="新增物资大类"
                onClick={() => navigate('/materials/category/create')}
              />
            }
          />
          <DataTable tableKey={TABLE_KEYS.MATERIALS_CATEGORY} loading={catLoading} columns={[
            { key: 'code', title: '编码', tip: '大类唯一编码' },
            { key: 'name', title: '名称', tip: '物资大类名称' },
            { key: 'zone', title: '存储分区', tip: '库内 A/B/C/D 分区类型', render: (r) => <Badge variant="secondary">{ZONE_LABELS[String(r.zone)]}</Badge> },
            { key: 'shelfLifeMonths', title: '保质期(月)', tip: '该大类物资默认保质期' },
            { key: 'safetyStockMin', title: '安全库存下限', tip: '低于此值触发低库存预警' },
            { key: 'action', title: '操作', render: (r) => <RowActions onEdit={() => navigate(editPath(String(r.id)))} onDelete={() => handleDelete('categories', String(r.id))} /> },
          ]} rows={categories} />
        </TabsContent>
        <TabsContent value="suppliers" className="mt-0">
          <ListToolbar
            className="mb-3"
            search={
              <SearchInputShell>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <DebounceInput
                  key="suppliers-search"
                  className={listFilterInputClass + ' pl-8'}
                  placeholder="编码/名称/拼音"
                  defaultValue={supplierSearch}
                  debounceTime={400}
                  onSearch={setSupplierSearch}
                />
              </SearchInputShell>
            }
            action={
              <PageCreateButton
                label="新增供应商"
                onClick={() => navigate('/materials/supplier/create')}
              />
            }
          />
          <DataTable tableKey={TABLE_KEYS.MATERIALS_SUPPLIER} loading={supLoading} columns={[
            { key: 'code', title: '编码', tip: '供应商唯一编码' },
            { key: 'name', title: '名称', tip: '供应商全称' },
            { key: 'contact', title: '联系人', tip: '主要对接人' },
            { key: 'phone', title: '电话', tip: '联系电话' },
            { key: 'address', title: '地址', tip: '供货方地址' },
            { key: 'action', title: '操作', render: (r) => <RowActions onEdit={() => navigate(editPath(String(r.id)))} onDelete={() => handleDelete('suppliers', String(r.id))} /> },
          ]} rows={filteredSuppliers} />
        </TabsContent>
        <TabsContent value="purposes" className="mt-0">
          <ListToolbar
            className="mb-3"
            action={
              <PageCreateButton
                label="新增出库用途"
                onClick={() => navigate('/materials/purpose/create')}
              />
            }
          />
          <DataTable tableKey={TABLE_KEYS.MATERIALS_OUTBOUND_PURPOSE} loading={purposeLoading} columns={[
            { key: 'code', title: '编码', tip: '用途唯一编码' },
            { key: 'name', title: '名称', tip: '出库单可选用途名称' },
            { key: 'sortOrder', title: '排序', tip: '下拉列表显示顺序，数字越小越靠前' },
            { key: 'enabled', title: '状态', tip: '停用后新建出库单不可选', render: (r) => (
              <Badge variant={r.enabled === false ? 'secondary' : 'success'}>{r.enabled === false ? '停用' : '启用'}</Badge>
            ) },
            { key: 'action', title: '操作', render: (r) => <RowActions onEdit={() => navigate(editPath(String(r.id)))} onDelete={() => handleDelete('purposes', String(r.id))} /> },
          ]} rows={purposes} />
        </TabsContent>
        <TabsContent value="destinations" className="mt-0">
          <ListToolbar
            className="mb-3"
            leading={<span className="text-xs text-muted-foreground">当前系统市：{orgCity}</span>}
            action={
              <PageCreateButton
                label="新增出库目的地"
                onClick={() => navigate('/materials/destination/create')}
              />
            }
          />
          <DataTable tableKey={TABLE_KEYS.MATERIALS_OUTBOUND_DESTINATION} loading={destinationLoading} columns={[
            { key: 'code', title: '编码', tip: '目的地唯一编码' },
            { key: 'city', title: '所属市', tip: '目的地归属的地级市' },
            { key: 'district', title: '所属区', tip: '目的地归属的行政区' },
            { key: 'name', title: '名称', tip: '出库单可选目的地，一般为各区应急保障局' },
            { key: 'contact', title: '联系人', tip: '目的地对接联系人' },
            { key: 'phone', title: '电话', tip: '联系电话' },
            { key: 'sortOrder', title: '排序', tip: '下拉列表显示顺序，数字越小越靠前' },
            { key: 'enabled', title: '状态', tip: '停用后新建出库单不可选', render: (r) => (
              <Badge variant={r.enabled === false ? 'secondary' : 'success'}>{r.enabled === false ? '停用' : '启用'}</Badge>
            ) },
            { key: 'action', title: '操作', render: (r) => <RowActions onEdit={() => navigate(editPath(String(r.id)))} onDelete={() => handleDelete('destinations', String(r.id))} /> },
          ]} rows={destinations} />
        </TabsContent>
        <TabsContent value="warehouses" className="mt-0">
          <ListToolbar
            className="mb-3"
            action={
              <PageCreateButton
                label="新增仓库"
                onClick={() => navigate('/materials/warehouse/create')}
              />
            }
          />
          <div className="leader-workspace-grid grid grid-cols-1 sm:grid-cols-2">
            {warehouses.map((wh) => (
              <LeaderSurfaceCard key={String(wh.id)} interactive className="group relative">
                <CardHeader className="pb-2">
                  <Badge variant="info">{ZONE_LABELS[String(wh.zone)]}</Badge>
                  <CardTitle className="text-base">{String(wh.name)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{String(wh.code)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{String(wh.area ?? '—')} m² · 容量 {String(wh.capacity ?? '—')}</p>
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100">
                    <RowActions onEdit={() => navigate(editPath(String(wh.id)))} onDelete={() => handleDelete('warehouses', String(wh.id))} />
                  </div>
                </CardContent>
              </LeaderSurfaceCard>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="shelves" className="mt-0">
          <ListToolbar
            className="mb-3"
            searchWrapClassName="flex-none sm:max-w-[8.5rem]"
            leading={
              <WarehouseFilterBar
                value={filterWh}
                onChange={setFilterWh}
                warehouses={warehouses as Array<{ id: string; name: string }>}
                label="仓库"
              />
            }
            search={
              <SearchInputShell>
                <DebounceInput
                  key="shelf-search"
                  className={listFilterInputClass}
                  placeholder="货位号"
                  defaultValue={shelfSearch}
                  debounceTime={300}
                  onSearch={setShelfSearch}
                />
              </SearchInputShell>
            }
            action={
              <PageCreateButton
                label="新增货位"
                onClick={() => navigate(createPath)}
              />
            }
          />
          <DataTable
            tableKey={TABLE_KEYS.MATERIALS_SHELF}
            loading={whLoading || shLoading}
            columns={[
              ...(filterWh === 'all' ? [{
                key: 'warehouse',
                title: '仓库',
                tip: '货位归属的物理库房',
                render: (r: Record<string, unknown>) => (r.warehouse as { name?: string })?.name ?? '—',
              }] : []),
              { key: 'zone', title: '分区', tip: '库内 A/B/C/D 存储分区' },
              { key: 'row', title: '货架', tip: '货架排号' },
              { key: 'level', title: '层', tip: '货架层数' },
              { key: 'code', title: '货位号', tip: '货位唯一编码，扫码上架时使用', cell: 'code' as const },
              {
                key: 'capacity',
                title: '规格',
                tip: '货位容量上限',
                render: (r: Record<string, unknown>) => (r.capacity != null ? String(r.capacity) : '—'),
              },
              {
                key: 'action',
                title: '操作',
                render: (r: Record<string, unknown>) => (
                  <div className="flex items-center gap-1">
                    <QrPrintButton label={shelfToLabel(r)} onOpen={openLabel} />
                    <RowActions onEdit={() => navigate(editPath(String(r.id)))} onDelete={() => handleDelete('shelves', String(r.id))} />
                  </div>
                ),
              },
            ]}
            rows={filteredShelves}
          />
        </TabsContent>
      </Tabs>

      <QrLabelDialog open={labelOpen} onOpenChange={setLabelOpen} label={labelData} description="货位标签，贴于货架便于上架扫码" />
    </div>
  )
}
