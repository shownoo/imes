import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import {
  FormPage,
  GroupedFormSection,
  GroupedFormRow,
  GroupedFormItem,
  GroupedFormStack,
  groupedFormInputClass,
  groupedFormSelectTriggerClass,
} from 'components/form-page'
import { Input } from 'components/ui/input'
import { SupplierSearchSelect } from 'components/supplier-search-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { ImageGallery, type GalleryImage } from 'components/image-gallery'
import { GET_MATERIAL, GET_CATEGORIES, GET_SUPPLIERS, ADD_MATERIAL } from './queries'

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
  const { t } = useTranslation()
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
      mode={isEdit ? 'edit' : 'create'}
      backTo="/materials?tab=materials"
      backLabel='物资档案'
      onSubmit={handleSave}
      onCancel={() => navigate('/materials?tab=materials')}
      submitLoading={saving}
    >
      <GroupedFormStack>
        <GroupedFormSection title={t('基本信息')}>
          <GroupedFormRow>
            <GroupedFormItem label='物资编码' required>
              <Input className={groupedFormInputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </GroupedFormItem>
            <GroupedFormItem label='物资名称' required>
              <Input className={groupedFormInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label='规格'>
              <Input className={groupedFormInputClass} value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} />
            </GroupedFormItem>
            <GroupedFormItem label='单位'>
              <Input className={groupedFormInputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormItem label='生产厂家'>
            <Input className={groupedFormInputClass} value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
          </GroupedFormItem>
        </GroupedFormSection>

        <GroupedFormSection title={t('分类与供应')}>
          <GroupedFormRow>
            <GroupedFormItem label='物资大类' required extra='决定库区归属与效期规则'>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger className={groupedFormSelectTriggerClass}><SelectValue placeholder='请选择' /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={String(c.id)} value={String(c.id)}>{String(c.name)}</SelectItem>)}</SelectContent>
              </Select>
            </GroupedFormItem>
            <GroupedFormItem label='默认供应商'>
              <SupplierSearchSelect
                allowClear
                suppliers={suppliers}
                value={form.supplierId}
                onChange={(supplierId) => setForm({ ...form, supplierId })}
                placeholder={t('无')}
                className={groupedFormSelectTriggerClass}
              />
            </GroupedFormItem>
          </GroupedFormRow>
        </GroupedFormSection>

        <GroupedFormSection>
          <GroupedFormItem label='物资图片'>
            <ImageGallery value={images} onChange={setImages} />
          </GroupedFormItem>
        </GroupedFormSection>
      </GroupedFormStack>
    </FormPage>
  )
}
