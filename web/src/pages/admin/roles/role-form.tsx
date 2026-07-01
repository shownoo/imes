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
} from 'components/form-page'
import { Badge } from 'components/common'
import { Input } from 'components/ui/input'
import { ACTION_LABELS, MODULE_LABELS } from 'lib/auth'
import { GET_ROLE, GET_PERMISSIONS, ADD_ROLE, SET_ROLE_PERMISSIONS } from '../queries'

type Permission = { id: string; code: string; name: string; module: string; action: string }

export default function RoleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ code: '', name: '', description: '', sort: 99 })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: roleData, loading } = useQuery(GET_ROLE, { skip: !id, variables: { input: { id } } })
  const { data: permData } = useQuery(GET_PERMISSIONS)
  const [saveRole, { loading: saving }] = useMutation(ADD_ROLE)
  const [savePerms, { loading: savingPerms }] = useMutation(SET_ROLE_PERMISSIONS)

  const permissions = (permData?.getPermissions as { permissions: Permission[] })?.permissions ?? []
  const byModule = useMemo(() => {
    const map: Record<string, Permission[]> = {}
    for (const p of permissions) {
      if (!map[p.module]) map[p.module] = []
      map[p.module].push(p)
    }
    return map
  }, [permissions])

  const record = roleData?.getRole as Record<string, unknown> | undefined
  const isAdminRole = String(record?.code ?? form.code) === 'ADMIN'
  const isSystem = Boolean(record?.system)

  useEffect(() => {
    if (record) {
      setForm({
        code: String(record.code ?? ''),
        name: String(record.name ?? ''),
        description: String(record.description ?? ''),
        sort: Number(record.sort ?? 99),
      })
      const perms = (record.permissions as Permission[]) ?? []
      setSelected(new Set(perms.map((p) => p.id)))
    }
  }, [record])

  const togglePerm = (permId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(permId)) next.delete(permId)
      else next.add(permId)
      return next
    })
  }

  const toggleModule = (module: string, checked: boolean) => {
    const ids = (byModule[module] ?? []).map((p) => p.id)
    setSelected((prev) => {
      const next = new Set(prev)
      for (const pid of ids) {
        if (checked) next.add(pid)
        else next.delete(pid)
      }
      return next
    })
  }

  const handleSave = async () => {
    try {
      const result = await saveRole({
        variables: {
          input: {
            id: id || undefined,
            code: form.code,
            name: form.name,
            description: form.description || undefined,
            sort: form.sort,
          },
        },
      })
      const role = result.data?.addRole as { id: string; code: string }
      const roleId = id ?? role?.id
      if (roleId && !isAdminRole) {
        await savePerms({
          variables: { input: { roleId, permissionIds: Array.from(selected) } },
        })
      }
      navigate('/admin/roles')
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  if (isEdit && loading) return null

  return (
    <FormPage
      mode={isEdit ? 'edit' : 'create'}
      backTo="/admin/roles"
      backLabel='角色管理'
      wide
      onSubmit={handleSave}
      onCancel={() => navigate('/admin/roles')}
      submitLoading={saving || savingPerms}
    >
      <GroupedFormStack>
        <GroupedFormSection title="角色信息">
          <GroupedFormRow>
            <GroupedFormItem label='角色编码' required>
              <Input
                className={groupedFormInputClass}
                value={form.code}
                disabled={isSystem}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder='如 CUSTOM_ROLE'
              />
            </GroupedFormItem>
            <GroupedFormItem label='角色名称' required>
              <Input className={groupedFormInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </GroupedFormItem>
          </GroupedFormRow>
          <GroupedFormItem label='说明'>
            <Input
              className={groupedFormInputClass}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder='角色职责说明'
            />
          </GroupedFormItem>
        </GroupedFormSection>

        <GroupedFormSection
          title="权限授权"
          tip={isAdminRole ? '管理员拥有全部权限' : '按模块勾选操作权限'}
        >
          {isAdminRole && (
            <div className="px-3.5 py-2">
              <Badge>管理员拥有全部权限</Badge>
            </div>
          )}

          {!isAdminRole && (
            <div className="space-y-3 px-3.5 py-2">
              {Object.entries(byModule).map(([module, perms]) => {
                const allChecked = perms.every((p) => selected.has(p.id))
                const someChecked = perms.some((p) => selected.has(p.id))
                return (
                  <div key={module} className="rounded-lg border border-border/40 bg-white p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-4 rounded border"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
                        onChange={(e) => toggleModule(module, e.target.checked)}
                      />
                      <span className="text-[13px] font-medium">{MODULE_LABELS[module] ?? module}</span>
                      <span className="text-xs text-muted-foreground">
                        {perms.filter((p) => selected.has(p.id)).length}/{perms.length}
                      </span>
                    </div>
                    <div className="ml-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {perms.map((p) => (
                        <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-4 rounded border"
                            checked={selected.has(p.id)}
                            onChange={() => togglePerm(p.id)}
                          />
                          <span>{ACTION_LABELS[p.action] ?? p.action}</span>
                          <span className="text-xs text-muted-foreground">({p.code})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </GroupedFormSection>
      </GroupedFormStack>
    </FormPage>
  )
}
