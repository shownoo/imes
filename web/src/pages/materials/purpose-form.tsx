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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { GET_OUTBOUND_PURPOSES, ADD_OUTBOUND_PURPOSE } from './queries'

export default function OutboundPurposeForm() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ code: '', name: '', sortOrder: 0, enabled: 'true' })

  const { data: purposeData, loading } = useQuery(GET_OUTBOUND_PURPOSES, { variables: { input: { take: 200 } } })
  const [save, { loading: saving }] = useMutation(ADD_OUTBOUND_PURPOSE, { refetchQueries: ['GetOutboundPurposes'] })

  const purposes = (purposeData?.getOutboundPurposes as { purposes: Array<Record<string, unknown>> })?.purposes ?? []
  const record = isEdit ? purposes.find((p) => String(p.id) === id) : undefined

  useEffect(() => {
    if (record) {
      setForm({
        code: String(record.code),
        name: String(record.name),
        sortOrder: Number(record.sortOrder ?? 0),
        enabled: record.enabled === false ? 'false' : 'true',
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
            sortOrder: form.sortOrder,
            enabled: form.enabled === 'true',
          },
        },
      })
      navigate('/materials?tab=purposes')
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  if (isEdit && loading) return null

  return (
    <FormPage
      mode={isEdit ? 'edit' : 'create'}
      backTo="/materials?tab=purposes"
      backLabel={t('出库用途')}
      onSubmit={handleSave}
      onCancel={() => navigate('/materials?tab=purposes')}
      submitLoading={saving}
    >
      <GroupedFormStack>
        <GroupedFormSection title={t('用途信息')}>
          <GroupedFormRow>
            <GroupedFormItem label={t('用途编码')} required>
              <Input className={groupedFormInputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </GroupedFormItem>
            <GroupedFormItem label={t('用途名称')} required>
              <Input className={groupedFormInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label={t('排序')}>
              <Input
                type="number"
                className={groupedFormInputClass}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
              />
            </GroupedFormItem>
            <GroupedFormItem label={t('状态')}>
              <Select value={form.enabled} onValueChange={(v) => setForm({ ...form, enabled: v })}>
                <SelectTrigger className={groupedFormSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('启用')}</SelectItem>
                  <SelectItem value="false">{t('停用')}</SelectItem>
                </SelectContent>
              </Select>
            </GroupedFormItem>
          </GroupedFormRow>
        </GroupedFormSection>
      </GroupedFormStack>
    </FormPage>
  )
}
