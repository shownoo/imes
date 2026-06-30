import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { gql, useQuery, useMutation } from '@apollo/client'
import { Layers, Package, Search, Truck } from 'lucide-react'
import { PageHeader, DataTable, RowActions, Badge, PageCreateButton } from 'components/common'
import { ImageThumb } from 'components/image-gallery'
import { DebounceInput } from 'components/debounce-input'
import { SectionMenu, SearchInputShell } from 'components/section-menu'
import { Tabs, TabsContent } from 'components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'
import { ZONE_LABELS } from 'lib/utils'
import {
  GET_MATERIALS, GET_CATEGORIES, GET_SUPPLIERS,
  DEL_MATERIAL, DEL_CATEGORY, DEL_SUPPLIER,
  TAB_LABELS, type MasterTab,
} from './queries'

const MASTER_MENU = [
  { value: 'materials' as const, label: TAB_LABELS.materials, icon: Package },
  { value: 'categories' as const, label: TAB_LABELS.categories, icon: Layers },
  { value: 'suppliers' as const, label: TAB_LABELS.suppliers, icon: Truck },
]

export default function MaterialsIndex() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as MasterTab) || 'materials'
  const [search, setSearch] = useState('')

  const refetchOpts = { refetchQueries: ['GetMaterials', 'GetCategories', 'GetSuppliers'] }
  const { data: matData, loading: matLoading } = useQuery(GET_MATERIALS, { variables: { input: { search: search || undefined, take: 100 } } })
  const { data: catData, loading: catLoading } = useQuery(GET_CATEGORIES, { variables: { input: { take: 100 } } })
  const { data: supData, loading: supLoading } = useQuery(GET_SUPPLIERS, { variables: { input: { take: 100 } } })

  const [delMaterial] = useMutation(DEL_MATERIAL, refetchOpts)
  const [delCategory] = useMutation(DEL_CATEGORY, refetchOpts)
  const [delSupplier] = useMutation(DEL_SUPPLIER, refetchOpts)

  const materials = (matData?.getMaterials as { materials: Array<Record<string, unknown>> })?.materials ?? []
  const categories = (catData?.getCategories as { categories: Array<Record<string, unknown>> })?.categories ?? []
  const suppliers = (supData?.getSuppliers as { suppliers: Array<Record<string, unknown>> })?.suppliers ?? []

  const setTab = (t: MasterTab) => setParams({ tab: t })

  const createPath = { materials: '/materials/material/create', categories: '/materials/category/create', suppliers: '/materials/supplier/create' }[tab]
  const editPath = (id: string) => ({ materials: `/materials/material/${id}/edit`, categories: `/materials/category/${id}/edit`, suppliers: `/materials/supplier/${id}/edit` }[tab])

  const handleDelete = async (type: MasterTab, id: string) => {
    if (!confirm('确认删除？')) return
    const mut = type === 'materials' ? delMaterial : type === 'categories' ? delCategory : delSupplier
    try { await mut({ variables: { input: { id } } }) } catch (e) { alert(e instanceof Error ? e.message : '删除失败') }
  }

  return (
    <div>
      <PageHeader
        title="基础数据维护"
        desc="维护物资档案、大类属性与供应商主数据"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as MasterTab)}>
        <SectionMenu
          className="mb-4"
          items={MASTER_MENU}
          value={tab}
          onChange={(v) => setTab(v as MasterTab)}
          toolbar={{
            search: tab === 'materials' ? (
              <SearchInputShell>
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                <DebounceInput
                  key="materials-search"
                  className="pl-9"
                  placeholder="搜索编码或名称..."
                  defaultValue={search}
                  debounceTime={500}
                  onSearch={setSearch}
                />
              </SearchInputShell>
            ) : undefined,
            action: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <PageCreateButton className="shrink-0" label={`新增${TAB_LABELS[tab]}`} onClick={() => navigate(createPath)} />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">新增{TAB_LABELS[tab]}记录</TooltipContent>
              </Tooltip>
            ),
          }}
        />

        <TabsContent value="materials" className="mt-4">
          <DataTable loading={matLoading} columns={[
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
          ]} rows={materials} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <DataTable loading={catLoading} columns={[
            { key: 'code', title: '编码', tip: '大类唯一编码' },
            { key: 'name', title: '名称', tip: '物资大类名称' },
            { key: 'zone', title: '存储分区', tip: '库内 A/B/C/D 分区类型', render: (r) => <Badge variant="secondary">{ZONE_LABELS[String(r.zone)]}</Badge> },
            { key: 'shelfLifeMonths', title: '保质期(月)', tip: '该大类物资默认保质期' },
            { key: 'safetyStockMin', title: '安全库存下限', tip: '低于此值触发低库存预警' },
            { key: 'action', title: '操作', render: (r) => <RowActions onEdit={() => navigate(editPath(String(r.id)))} onDelete={() => handleDelete('categories', String(r.id))} /> },
          ]} rows={categories} />
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          <DataTable loading={supLoading} columns={[
            { key: 'code', title: '编码', tip: '供应商唯一编码' },
            { key: 'name', title: '名称', tip: '供应商全称' },
            { key: 'contact', title: '联系人', tip: '主要对接人' },
            { key: 'phone', title: '电话', tip: '联系电话' },
            { key: 'address', title: '地址', tip: '供货方地址' },
            { key: 'action', title: '操作', render: (r) => <RowActions onEdit={() => navigate(editPath(String(r.id)))} onDelete={() => handleDelete('suppliers', String(r.id))} /> },
          ]} rows={suppliers} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
