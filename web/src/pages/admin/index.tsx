import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Users, ShieldCheck, ScrollText, GitBranch, Bell, HardDrive, Printer } from 'lucide-react'
import { PageHeader } from 'components/common'
import { SectionNav } from 'components/section-menu'
import { useAuth } from 'lib/auth'
import UsersIndex from './users/index'
import UserForm from './users/user-form'
import RolesIndex from './roles/index'
import RoleForm from './roles/role-form'
import LogsIndex from './logs/index'
import WorkflowsIndex from './workflows/index'
import NotifySettingsPage from './notify/index'
import UploadSettingsPage from './upload/index'
import PrintTemplatesPage from './print-templates/index'
import PrintTemplateEditPage from './print-templates/edit'

const ADMIN_NAV = [
  { to: '/admin/users', icon: Users, label: '账号管理', perm: 'system:user:read' },
  { to: '/admin/roles', icon: ShieldCheck, label: '角色授权', perm: 'system:role:read' },
  { to: '/admin/logs', icon: ScrollText, label: '操作日志', perm: 'system:log:read' },
  { to: '/admin/workflows', icon: GitBranch, label: '审批流程', perm: 'system:role:read' },
  { to: '/admin/notify', icon: Bell, label: '通知配置', perm: 'system:role:read' },
  { to: '/admin/upload', icon: HardDrive, label: '文件存储', perm: 'system:role:read' },
  { to: '/admin/print-templates', icon: Printer, label: '打印模板', perm: 'system:role:read' },
]

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { canManageSystem, loading } = useAuth()
  if (loading) return null
  if (!canManageSystem) return <Navigate to="/" replace />
  return <>{children}</>
}

function AdminLayout() {
  const { hasPermission } = useAuth()
  const visibleNav = ADMIN_NAV.filter((n) => hasPermission(n.perm))

  return (
    <div className="space-y-5">
      <PageHeader title="系统管理" desc="账号、权限、审批流程与系统参数配置" />
      <SectionNav items={visibleNav} />
      <Outlet />
    </div>
  )
}

export default function AdminRoutes() {
  return (
    <AdminGuard>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<UsersIndex />} />
          <Route path="users/create" element={<UserForm />} />
          <Route path="users/:id/edit" element={<UserForm />} />
          <Route path="roles" element={<RolesIndex />} />
          <Route path="roles/create" element={<RoleForm />} />
          <Route path="roles/:id/edit" element={<RoleForm />} />
          <Route path="logs" element={<LogsIndex />} />
          <Route path="workflows" element={<WorkflowsIndex />} />
          <Route path="notify" element={<NotifySettingsPage />} />
          <Route path="upload" element={<UploadSettingsPage />} />
          <Route path="print-templates" element={<PrintTemplatesPage />} />
          <Route path="print-templates/:key" element={<PrintTemplateEditPage />} />
        </Route>
      </Routes>
    </AdminGuard>
  )
}
