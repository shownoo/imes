import { Navigate, Route, Routes } from 'react-router-dom'
import { getStoredUser } from './lib/apollo'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MaterialsIndex from './pages/materials/index'
import MaterialForm from './pages/materials/material-form'
import CategoryForm from './pages/materials/category-form'
import SupplierForm from './pages/materials/supplier-form'
import OutboundPurposeForm from './pages/materials/purpose-form'
import OutboundDestinationForm from './pages/materials/destination-form'
import WarehousesIndex, {
  WarehousesLegacyRedirect,
  WarehouseEditLegacyRedirect,
  ShelfEditLegacyRedirect,
} from './pages/warehouses/index'
import WarehouseForm from './pages/warehouses/warehouse-form'
import ShelfForm from './pages/warehouses/shelf-form'
import InboundIndex from './pages/inbound/index'
import InboundCreate from './pages/inbound/create'
import InboundDetail from './pages/inbound/detail'
import OutboundIndex from './pages/outbound/index'
import OutboundForm from './pages/outbound/form'
import OutboundDetail from './pages/outbound/detail'
import WorkspaceSettings from './pages/workspace/index'
import Inventory from './pages/Inventory'
import Alerts from './pages/Alerts'
import Trace from './pages/Trace'
import AdminRoutes from './pages/admin'
import TasksIndex from './pages/tasks/index'
import PrintPage from './pages/print/index'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return getStoredUser() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/print/:key/:id" element={<PrivateRoute><PrintPage /></PrivateRoute>} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<TasksIndex />} />
        <Route path="workspace" element={<WorkspaceSettings />} />
        <Route path="materials">
          <Route index element={<MaterialsIndex />} />
          <Route path="material/create" element={<MaterialForm />} />
          <Route path="material/:id/edit" element={<MaterialForm />} />
          <Route path="category/create" element={<CategoryForm />} />
          <Route path="category/:id/edit" element={<CategoryForm />} />
          <Route path="supplier/create" element={<SupplierForm />} />
          <Route path="supplier/:id/edit" element={<SupplierForm />} />
          <Route path="purpose/create" element={<OutboundPurposeForm />} />
          <Route path="purpose/:id/edit" element={<OutboundPurposeForm />} />
          <Route path="destination/create" element={<OutboundDestinationForm />} />
          <Route path="destination/:id/edit" element={<OutboundDestinationForm />} />
          <Route path="warehouse/create" element={<WarehouseForm />} />
          <Route path="warehouse/:id/edit" element={<WarehouseForm />} />
          <Route path="shelf/create" element={<ShelfForm />} />
          <Route path="shelf/:id/edit" element={<ShelfForm />} />
        </Route>
        <Route path="warehouses">
          <Route index element={<WarehousesIndex />} />
          <Route path="warehouse/create" element={<WarehousesLegacyRedirect to="/materials/warehouse/create" />} />
          <Route path="warehouse/:id/edit" element={<WarehouseEditLegacyRedirect />} />
          <Route path="shelf/create" element={<WarehousesLegacyRedirect to="/materials/shelf/create" />} />
          <Route path="shelf/:id/edit" element={<ShelfEditLegacyRedirect />} />
        </Route>
        <Route path="inbound">
          <Route index element={<InboundIndex />} />
          <Route path="create" element={<InboundCreate />} />
          <Route path=":id" element={<InboundDetail />} />
        </Route>
        <Route path="outbound">
          <Route index element={<OutboundIndex />} />
          <Route path="create" element={<OutboundForm />} />
          <Route path=":id/edit" element={<OutboundForm />} />
          <Route path=":id" element={<OutboundDetail />} />
        </Route>
        <Route path="inventory" element={<Inventory />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="trace" element={<Trace />} />
        <Route path="admin/*" element={<AdminRoutes />} />
        <Route path="system-logs" element={<Navigate to="/admin/logs" replace />} />
      </Route>
    </Routes>
  )
}
