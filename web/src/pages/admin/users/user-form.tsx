import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { FormPage, FormField, FormGrid } from 'components/form-page'
import { Button } from 'components/common'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { GET_USER, GET_ROLES, ADD_USER, RESET_USER_PASSWORD } from '../queries'

export default function UserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    email: '',
    roleId: '',
    active: true,
  })
  const [newPassword, setNewPassword] = useState('')

  const { data: userData, loading } = useQuery(GET_USER, { skip: !id, variables: { input: { id } } })
  const { data: rolesData } = useQuery(GET_ROLES)
  const [save, { loading: saving }] = useMutation(ADD_USER, { refetchQueries: ['GetUsers'] })
  const [resetPwd, { loading: resetting }] = useMutation(RESET_USER_PASSWORD, { refetchQueries: ['GetUsers'] })

  const roles = (rolesData?.getRoles as { roles: Array<Record<string, unknown>> })?.roles ?? []
  const record = userData?.getUser as Record<string, unknown> | undefined

  useEffect(() => {
    if (record) {
      setForm({
        username: String(record.username ?? ''),
        password: '',
        name: String(record.name ?? ''),
        phone: String(record.phone ?? ''),
        email: String(record.email ?? ''),
        roleId: String(record.roleId ?? ''),
        active: Boolean(record.active ?? true),
      })
    } else if (!isEdit && roles[0]) {
      setForm((f) => ({ ...f, roleId: String(roles[0].id) }))
    }
  }, [record, isEdit, roles])

  const handleSave = async () => {
    try {
      await save({
        variables: {
          input: {
            id: id || undefined,
            username: form.username,
            password: form.password || undefined,
            name: form.name || undefined,
            phone: form.phone || undefined,
            email: form.email || undefined,
            roleId: form.roleId,
            active: form.active,
          },
        },
      })
      navigate('/admin/users')
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  const handleResetPassword = async () => {
    if (!id || !newPassword) return
    if (!confirm('确认重置该用户密码？')) return
    try {
      await resetPwd({ variables: { input: { id, password: newPassword } } })
      setNewPassword('')
      alert('密码已重置')
    } catch (e) {
      alert(e instanceof Error ? e.message : '重置失败')
    }
  }

  if (isEdit && loading) return null

  return (
    <FormPage
      title={isEdit ? '编辑账号' : '新增账号'}
      backTo="/admin/users"
      backLabel='账号管理'
      footer={
        <>
          <Button variant="outline" onClick={() => navigate('/admin/users')}>取消'</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </>
      }
    >
      <FormGrid>
        <FormField label='用户名' required>
          <Input
            value={form.username}
            disabled={isEdit}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder='登录用户名'
          />
        </FormField>
        {!isEdit && (
          <FormField label='初始密码' required>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder='至少 6 位'
            />
          </FormField>
        )}
        <FormField label='姓名'>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label='手机'>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </FormField>
        <FormField label='邮箱'>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder='用于审批邮件通知' />
        </FormField>
        <FormField label='角色' required>
          <Select value={form.roleId} onValueChange={(v) => setForm({ ...form, roleId: v })}>
            <SelectTrigger><SelectValue placeholder='选择角色' /></SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={String(r.id)} value={String(r.id)}>
                  {String(r.name)} ({String(r.code)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label='状态'>
          <Select
            value={form.active ? 'true' : 'false'}
            onValueChange={(v) => setForm({ ...form, active: v === 'true' })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">正常</SelectItem>
              <SelectItem value="false">停用</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </FormGrid>

      {isEdit && (
        <div className="mt-8 rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-medium">重置密码</h3>
          <div className="flex gap-2">
            <Input
              type="password"
              className="max-w-xs"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder='新密码'
            />
            <Button variant="outline" onClick={handleResetPassword} disabled={resetting || !newPassword}>重置密码</Button>
          </div>
        </div>
      )}
    </FormPage>
  )
}
