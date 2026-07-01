import { useEffect, useState } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { GET_CATEGORIES, ADD_CATEGORY, ZONE_OPTIONS } from './queries'

export default function CategoryForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ code: '', name: '', zone: 'GENERAL', shelfLifeMonths: 60, safetyStockMin: 0, safetyStockMax: '' as number | '' })

  const { data: catData, loading } = useQuery(GET_CATEGORIES, { variables: { input: { take: 100 } } })
  const [save, { loading: saving }] = useMutation(ADD_CATEGORY, { refetchQueries: ['GetCategories'] })

  const categories = (catData?.getCategories as { categories: Array<Record<string, unknown>> })?.categories ?? []
  const record = isEdit ? categories.find((c) => String(c.id) === id) : undefined

  useEffect(() => {
    if (record) {
      setForm({
        code: String(record.code),
        name: String(record.name),
        zone: String(record.zone),
        shelfLifeMonths: Number(record.shelfLifeMonths ?? 60),
        safetyStockMin: Number(record.safetyStockMin ?? 0),
        safetyStockMax: record.safetyStockMax != null ? Number(record.safetyStockMax) : '',
      })
    }
  }, [record])

  const handleSave = async () => {
    try {
      await save({
        variables: {
          input: {
            id: id || undefined,
            code: form.code,
            name: form.name,
            zone: form.zone,
            shelfLifeMonths: Number(form.shelfLifeMonths),
            safetyStockMin: Number(form.safetyStockMin),
            safetyStockMax: form.safetyStockMax !== '' ? Number(form.safetyStockMax) : undefined,
          },
        },
      })
      navigate('/materials?tab=categories')
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  if (isEdit && loading) return null

  return (
    <FormPage
      mode={isEdit ? 'edit' : 'create'}
      backTo="/materials?tab=categories"
      backLabel='物资大类'
      onSubmit={handleSave}
      onCancel={() => navigate('/materials?tab=categories')}
      submitLoading={saving}
    >
      <GroupedFormStack>
        <GroupedFormSection title="大类信息">
          <GroupedFormRow>
            <GroupedFormItem label='大类编码' required>
              <Input className={groupedFormInputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </GroupedFormItem>
            <GroupedFormItem label='大类名称' required>
              <Input className={groupedFormInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label='库区类型'>
              <Select value={form.zone} onValueChange={(v) => setForm({ ...form, zone: v })}>
                <SelectTrigger className={groupedFormSelectTriggerClass}><SelectValue /></SelectTrigger>
                <SelectContent>{ZONE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </GroupedFormItem>
            <GroupedFormItem label='保质期(月)'>
              <Input type="number" className={groupedFormInputClass} value={String(form.shelfLifeMonths)} onChange={(e) => setForm({ ...form, shelfLifeMonths: Number(e.target.value) })} />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label='安全库存下限'>
              <Input type="number" className={groupedFormInputClass} value={String(form.safetyStockMin)} onChange={(e) => setForm({ ...form, safetyStockMin: Number(e.target.value) })} />
            </GroupedFormItem>
            <GroupedFormItem label='安全库存上限'>
              <Input type="number" className={groupedFormInputClass} value={String(form.safetyStockMax)} onChange={(e) => setForm({ ...form, safetyStockMax: e.target.value === '' ? '' : Number(e.target.value) })} />
            </GroupedFormItem>
          </GroupedFormRow>
        </GroupedFormSection>
      </GroupedFormStack>
    </FormPage>
  )
}
