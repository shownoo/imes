import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { FormPage, FormField, FormGrid } from 'components/form-page'
import { Button } from 'components/common'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { ImageGallery, type GalleryImage } from 'components/image-gallery'
import {
  GET_MATERIAL, GET_CATEGORIES, GET_SUPPLIERS, ADD_MATERIAL,
} from './queries'

function imagesFromRecord(record: Record<string, unknown>): GalleryImage[] {
  const rows = record.images as Array<{ file?: { id?: string; url?: string; name?: string } }> | undefined
  if (!rows?.length) return []
  return rows
    .map((row) => ({
      id: String(row.file?.id ?? ''),
      url: String(row.file?.url ?? ''),
      name: row.file?.name ? String(row.file.name) : undefined,
    }))
    .filter((img) => img.id && img.url)
}

export default function MaterialForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ code: '', name: '', spec: '', unit: '件', manufacturer: '', categoryId: '', supplierId: '' })
  const [images, setImages] = useState<GalleryImage[]>([])

  const { data: matData, loading } = useQuery(GET_MATERIAL, { skip: !id, variables: { input: { id } } })
  const { data: catData } = useQuery(GET_CATEGORIES, { variables: { input: { take: 100 } } })
  const { data: supData } = useQuery(GET_SUPPLIERS, { variables: { input: { take: 100 } } })
  const [save, { loading: saving }] = useMutation(ADD_MATERIAL, { refetchQueries: ['GetMaterials'] })

  const categories = (catData?.getCategories as { categories: Array<Record<string, unknown>> })?.categories ?? []
  const suppliers = (supData?.getSuppliers as { suppliers: Array<Record<string, unknown>> })?.suppliers ?? []
  const record = matData?.getMaterial as Record<string, unknown> | undefined

  useEffect(() => {
    if (record) {
      setForm({
        code: String(record.code ?? ''),
        name: String(record.name ?? ''),
        spec: String(record.spec ?? ''),
        unit: String(record.unit ?? '件'),
        manufacturer: String(record.manufacturer ?? ''),
        categoryId: String((record.category as { id?: string })?.id ?? ''),
        supplierId: String((record.supplier as { id?: string })?.id ?? ''),
      })
      setImages(imagesFromRecord(record))
    } else if (!isEdit && categories[0]) {
      setForm((f) => ({ ...f, categoryId: String(categories[0].id) }))
    }
  }, [record, isEdit, categories])

  const handleSave = async () => {
    try {
      await save({
        variables: {
          input: {
            id: id || undefined,
            code: form.code,
            name: form.name,
            spec: form.spec || undefined,
            unit: form.unit || '件',
            manufacturer: form.manufacturer || undefined,
            categoryId: form.categoryId,
            supplierId: form.supplierId || undefined,
            imageFileIds: images.map((img) => img.id),
          },
        },
      })
      navigate('/materials?tab=materials')
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  if (isEdit && loading) return null

  return (
    <FormPage
      title={isEdit ? '编辑物资档案' : '新增物资档案'}
      backTo="/materials?tab=materials"
      backLabel='物资档案'
      wide
      footer={
        <>
          <Button variant="outline" onClick={() => navigate('/materials?tab=materials')}>取消'</Button>
          <Button onClick={handleSave} disabled={saving}>保存</Button>
        </>
      }
    >
      <FormGrid>
        <FormField label='物资编码' required><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
        <FormField label='物资名称' required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
        <FormField label='规格'><Input value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} /></FormField>
        <FormField label='单位'><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></FormField>
        <FormField label='生产厂家'><Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></FormField>
        <FormField label='物资大类' required>
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger><SelectValue placeholder='请选择' /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={String(c.id)} value={String(c.id)}>{String(c.name)}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label='默认供应商' className="col-span-2">
          <Select value={form.supplierId || 'none'} onValueChange={(v) => setForm({ ...form, supplierId: v === 'none' ? '' : v })}>
            <SelectTrigger><SelectValue placeholder='无' /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无</SelectItem>
              {suppliers.map((s) => <SelectItem key={String(s.id)} value={String(s.id)}>{String(s.name)}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label='物资图片' className="col-span-2">
          <ImageGallery value={images} onChange={setImages} />
        </FormField>
      </FormGrid>
    </FormPage>
  )
}
