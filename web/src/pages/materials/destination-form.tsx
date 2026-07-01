import { useEffect, useMemo, useState } from 'react'
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
import { getDistrictsForCity } from 'lib/city-districts'
import { defaultDestinationName } from 'lib/destination-name'
import { GET_OUTBOUND_DESTINATIONS, ADD_OUTBOUND_DESTINATION, GET_ORG_CITY } from './queries'

export default function OutboundDestinationForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ code: '', city: '', district: '', name: '', sortOrder: 0, enabled: 'true' })
  const [nameTouched, setNameTouched] = useState(false)

  const { data: orgData } = useQuery(GET_ORG_CITY)
  const orgCity = String((orgData?.getOrgCity as { city?: string } | undefined)?.city ?? '武汉市')
  const { data: destinationData, loading } = useQuery(GET_OUTBOUND_DESTINATIONS, { variables: { input: { take: 200 } } })
  const [save, { loading: saving }] = useMutation(ADD_OUTBOUND_DESTINATION, { refetchQueries: ['GetOutboundDestinations'] })

  const destinations = (destinationData?.getOutboundDestinations as { destinations: Array<Record<string, unknown>> })?.destinations ?? []
  const record = isEdit ? destinations.find((d) => String(d.id) === id) : undefined

  useEffect(() => {
    if (!isEdit && orgCity && !form.city) {
      setForm((prev) => ({ ...prev, city: orgCity }))
    }
  }, [isEdit, orgCity, form.city])

  useEffect(() => {
    if (record) {
      setForm({
        code: String(record.code),
        city: String(record.city ?? orgCity),
        district: String(record.district ?? ''),
        name: String(record.name),
        sortOrder: Number(record.sortOrder ?? 0),
        enabled: record.enabled === false ? 'false' : 'true',
      })
      setNameTouched(true)
    }
  }, [record, orgCity])

  const districtOptions = useMemo(() => {
    const options = getDistrictsForCity(form.city || orgCity)
    if (form.district && !options.includes(form.district)) {
      return [form.district, ...options]
    }
    return options
  }, [form.city, form.district, orgCity])

  const handleCityChange = (city: string) => {
    setForm((prev) => {
      const options = getDistrictsForCity(city)
      const district = options.includes(prev.district) ? prev.district : ''
      const next = { ...prev, city, district }
      if (!district) {
        if (!nameTouched || prev.name === defaultDestinationName(prev.district)) {
          next.name = ''
        }
      } else if (!nameTouched || prev.name === defaultDestinationName(prev.district)) {
        next.name = defaultDestinationName(district)
      }
      return next
    })
  }

  const handleDistrictChange = (district: string) => {
    setForm((prev) => {
      const next = { ...prev, district }
      if (!nameTouched || prev.name === defaultDestinationName(prev.district)) {
        next.name = defaultDestinationName(district)
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!form.district.trim()) {
      alert('请选择所属区')
      return
    }
    try {
      await save({
        variables: {
          input: {
            id: id || undefined,
            code: form.code,
            city: form.city || orgCity,
            district: form.district,
            name: form.name || defaultDestinationName(form.district),
            sortOrder: form.sortOrder,
            enabled: form.enabled === 'true',
          },
        },
      })
      navigate('/materials?tab=destinations')
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  if (isEdit && loading) return null

  return (
    <FormPage
      mode={isEdit ? 'edit' : 'create'}
      backTo="/materials?tab=destinations"
      backLabel="出库目的地"
      onSubmit={handleSave}
      onCancel={() => navigate('/materials?tab=destinations')}
      submitLoading={saving}
    >
      <GroupedFormStack>
        <GroupedFormSection title="目的地信息">
          <GroupedFormRow>
            <GroupedFormItem label="目的地编码" required>
              <Input className={groupedFormInputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </GroupedFormItem>
            <GroupedFormItem label="所属市" required tip="默认取系统部署市，出库时按此市过滤">
              <Input className={groupedFormInputClass} value={form.city} onChange={(e) => handleCityChange(e.target.value)} placeholder="如：武汉市" />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label="所属区" required tip="根据所属市自动列出可选行政区">
              <Select
                value={form.district || undefined}
                onValueChange={handleDistrictChange}
                disabled={districtOptions.length === 0}
              >
                <SelectTrigger className={groupedFormSelectTriggerClass}>
                  <SelectValue placeholder={districtOptions.length ? '请选择区' : '当前市暂无行政区数据'} />
                </SelectTrigger>
                <SelectContent>
                  {districtOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </GroupedFormItem>
            <GroupedFormItem label="目的地名称" required>
              <Input
                className={groupedFormInputClass}
                value={form.name}
                onChange={(e) => {
                  setNameTouched(true)
                  setForm({ ...form, name: e.target.value })
                }}
                placeholder="如：江岸区应急保障局"
              />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormRow>
            <GroupedFormItem label="排序">
              <Input
                type="number"
                className={groupedFormInputClass}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
              />
            </GroupedFormItem>
            <GroupedFormItem label="状态">
              <Select value={form.enabled} onValueChange={(v) => setForm({ ...form, enabled: v })}>
                <SelectTrigger className={groupedFormSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">启用</SelectItem>
                  <SelectItem value="false">停用</SelectItem>
                </SelectContent>
              </Select>
            </GroupedFormItem>
          </GroupedFormRow>
        </GroupedFormSection>
      </GroupedFormStack>
    </FormPage>
  )
}
