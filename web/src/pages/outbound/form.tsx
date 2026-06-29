import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { FormPage, FormField, FormGrid } from 'components/form-page'
import { Button } from 'components/common'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { CREATE, UPDATE, GET_ORDER, GET_MATERIALS, emptyOutboundForm, type OutboundLineRow } from './queries'

export default function OutboundForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(emptyOutboundForm())

  const { data: orderData } = useQuery(GET_ORDER, { skip: !id, variables: { input: { id } } })
  const { data: matData } = useQuery(GET_MATERIALS, { variables: { input: { take: 200 } } })
  const [createOrder, { loading: creating }] = useMutation(CREATE, { refetchQueries: ['GetOutboundOrders'] })
  const [updateOrder, { loading: updating }] = useMutation(UPDATE, { refetchQueries: ['GetOutboundOrders'] })

  const materials = (matData?.getMaterials as { materials: Array<Record<string, unknown>> })?.materials ?? []
  const order = orderData?.getOutboundOrder as Record<string, unknown> | undefined

  useEffect(() => {
    if (order && isEdit) {
      const rowLines = (order.lines as Array<Record<string, unknown>>) ?? []
      setForm({
        purpose: String(order.purpose ?? ''),
        destination: String(order.destination ?? ''),
        recipient: String(order.recipient ?? ''),
        lines: rowLines.length
          ? rowLines.map((l) => ({ materialId: String(l.materialId), requestedQty: Number(l.requestedQty) }))
          : [{ materialId: '', requestedQty: 1 }],
      })
    }
  }, [order, isEdit])

  const handleSave = async () => {
    if (!form.lines.some((l) => l.materialId && l.requestedQty > 0)) {
      alert('请添加出库明细')
      return
    }
    const payload = {
      purpose: form.purpose || undefined,
      destination: form.destination || undefined,
      recipient: form.recipient || undefined,
      lines: form.lines.filter((l) => l.materialId),
    }
    try {
      if (isEdit) {
        await updateOrder({ variables: { input: { id, ...payload } } })
        navigate(`/outbound/${id}`)
      } else {
        const result = await createOrder({ variables: { input: payload } })
        const created = result.data?.createOutboundOrder as { id?: string }
        navigate(created?.id ? `/outbound/${created.id}` : '/outbound')
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  const setLines = (lines: OutboundLineRow[]) => setForm({ ...form, lines })

  return (
    <FormPage
      title={isEdit ? '编辑出库单' : '新建出库单'}
      desc="填写调拨用途、目的地与出库明细"
      backTo={isEdit ? `/outbound/${id}` : '/outbound'}
      backLabel='出库管理'
      wide
      footer={
        <>
          <Button variant="outline" onClick={() => navigate(isEdit ? `/outbound/${id}` : '/outbound')}>取消</Button>
          <Button onClick={handleSave} disabled={creating || updating}>{isEdit ? '保存' : '创建'}</Button>
        </>
      }
    >
      <FormGrid className="mb-6 grid-cols-3">
        <FormField label='用途'><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder='防汛抢险 / 救灾调拨' /></FormField>
        <FormField label='目的地'><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder='接收区域' /></FormField>
        <FormField label='领用人'><Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder='接收单位/联系人' /></FormField>
      </FormGrid>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">'出库明细'</span>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setLines([...form.lines, { materialId: '', requestedQty: 1 }])}>+ 添加行</Button>
        </div>
        {form.lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <Select
              value={line.materialId || 'none'}
              onValueChange={(v) => {
                const next = [...form.lines]
                next[i] = { ...line, materialId: v === 'none' ? '' : v }
                setForm({ ...form, lines: next })
              }}
            >
              <SelectTrigger className="flex-1"><SelectValue placeholder='选择物资' /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">'选择物资'</SelectItem>
                {materials.map((m) => <SelectItem key={String(m.id)} value={String(m.id)}>{String(m.code)} · {String(m.name)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              type="number"
              className="w-28"
              value={line.requestedQty}
              onChange={(e) => {
                const next = [...form.lines]
                next[i] = { ...line, requestedQty: Number(e.target.value) }
                setForm({ ...form, lines: next })
              }}
            />
            {form.lines.length > 1 && (
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setLines(form.lines.filter((_, j) => j !== i))}>×</Button>
            )}
          </div>
        ))}
      </div>
    </FormPage>
  )
}
