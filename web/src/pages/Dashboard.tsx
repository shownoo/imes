import { gql, useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { Package, Boxes, AlertTriangle, ClipboardList, RefreshCw, Download, Percent, ClipboardCheck } from 'lucide-react'
import { useWorkspace } from 'contexts/workspace-context'
import { LeaderKpiGrid } from 'components/leader-kpi-grid'
import { LeaderPageHeader } from 'components/leader-page-header'
import { LeaderPanelCard } from 'components/leader-panel-card'
import { ZoneHeatmap, StockWaterLevel, ExpiryHealthPanel, DashboardChartExpiryPie, DashboardChartAlertPie, DashboardChartZoneBar, DashboardChartCategoryBar, DashboardChartInboundBar, DashboardChartOutboundBar, DashboardChartDestinationBar, DashboardChartIoTrend, Badge, DataTable, Button, ToolbarButton, TABLE_KEYS } from 'components/common'
import type { DashboardChartsData } from 'components/dashboard-stats-charts'
import { WorkspaceCustomizeMenu } from 'components/workspace-customize-menu'
import { formatNumber, formatDate, STATUS_LABELS, statusBadgeVariant } from 'lib/utils'
import type { WorkspaceWidgetId } from 'lib/workspace-theme'
import { CHART_WIDGET_IDS } from 'lib/workspace-theme'
import type { ApprovalInboxItem } from 'lib/approval-flow'
import { activeDocumentPath, type ActiveDocument } from 'lib/workbench'

const DASHBOARD = gql`query Dashboard { dashboard }`

type DashboardData = {
  center: {
    speciesCount: number
    stockTotal: number
    utilizationRate: number
    pendingTaskCount: number
    approvalInboxCount: number
    alertCount: number
    warehouseArea: number
    totalCapacity: number
  }
  expiryHealth: { green: number; yellow: number; red: number; greenPct: number; yellowPct: number; redPct: number; healthScore: number }
  stockWaterLevel: Array<{ material: { name: string; unit: string }; quantity: number; min: number; max: number; status: string; pct: number }>
  zoneHeatmap: Array<{ zone: string; label: string; quantity: number; capacity: number }>
  charts: DashboardChartsData
  pendingTasks: ActiveDocument[]
  myApprovals: ApprovalInboxItem[]
  recentAlerts: Array<{ id: string; type: string; level: string; message: string; material?: { name: string } }>
  exportSnapshot: Record<string, unknown>
}

function exportDashboard(data: DashboardData) {
  const blob = new Blob([JSON.stringify(data.exportSnapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `imes-dashboard-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, refetch } = useQuery(DASHBOARD)
  const d = data?.dashboard as DashboardData | undefined
  const { visibleWidgets } = useWorkspace()
  const charts = d?.charts

  const chartPanel = (id: WorkspaceWidgetId, title: string, render: (data: DashboardChartsData) => React.ReactNode) => (
    <LeaderPanelCard key={id} title={title}>
      {charts ? render(charts) : null}
    </LeaderPanelCard>
  )

  const widgets: Record<WorkspaceWidgetId, React.ReactNode> = {
    kpi: (
      <div key="kpi" className="leader-overview-kpi-grid">
        <LeaderKpiGrid
          items={[
            { label: '物资品种', value: d?.center.speciesCount ?? '—', unit: '种', icon: Package },
            { label: '库存总量', value: d ? formatNumber(d.center.stockTotal) : '—', icon: Boxes },
            { label: '库容利用率', value: d ? `${d.center.utilizationRate}%` : '—', icon: Percent },
            {
              label: '进行中单据',
              value: d?.center.pendingTaskCount ?? '—',
              unit: '单',
              icon: ClipboardList,
              onClick: () => navigate('/inbound'),
            },
            {
              label: '待我审批',
              value: d?.center.approvalInboxCount ?? '—',
              unit: '条',
              icon: ClipboardCheck,
              onClick: () => navigate('/tasks'),
            },
          ]}
        />
        {d && (
          <p
            className="mt-2 px-1"
            style={{ fontSize: 'var(--leader-kpi-label-size, 0.75rem)', color: 'var(--leader-text-muted)' }}
          >
            总库容 {formatNumber(d.center.totalCapacity)} · {d.center.alertCount} 条未处理预警
          </p>
        )}
      </div>
    ),
    chartExpiryPie: chartPanel('chartExpiryPie', '效期分布', (c) => <DashboardChartExpiryPie charts={c} />),
    chartAlertPie: chartPanel('chartAlertPie', '预警构成', (c) => <DashboardChartAlertPie charts={c} />),
    chartZoneBar: chartPanel('chartZoneBar', '分区库存', (c) => <DashboardChartZoneBar charts={c} />),
    chartCategoryBar: chartPanel('chartCategoryBar', '物资大类品种', (c) => <DashboardChartCategoryBar charts={c} />),
    chartInboundBar: chartPanel('chartInboundBar', '入库单状态', (c) => <DashboardChartInboundBar charts={c} />),
    chartOutboundBar: chartPanel('chartOutboundBar', '出库单状态', (c) => <DashboardChartOutboundBar charts={c} />),
    chartDestinationBar: chartPanel(
      'chartDestinationBar',
      charts ? `出库目的地 · ${charts.destinationCity}` : '出库目的地',
      (c) => <DashboardChartDestinationBar charts={c} />,
    ),
    chartIoTrend: chartPanel('chartIoTrend', '近6月出入库趋势', (c) => <DashboardChartIoTrend charts={c} />),
    expiry: (
      <LeaderPanelCard
        key="expiry"
        header={
          <div className="flex items-center gap-2 pb-2">
            <AlertTriangle className="size-4" style={{ color: 'var(--leader-accent)' }} />
            <span style={{ color: 'var(--leader-text)', fontWeight: 'var(--cheta-title-weight, 600)' }}>效期健康度</span>
            <Badge variant="success" className="ml-auto">红绿灯预警</Badge>
          </div>
        }
      >
        {d ? <ExpiryHealthPanel health={d.expiryHealth} /> : null}
        <p className="mt-4" style={{ fontSize: '0.6875rem', color: 'var(--leader-text-muted)' }}>绿色=安全 · 黄色=临期 · 红色=预警 · FIFO 优先</p>
      </LeaderPanelCard>
    ),
    waterLevel: (
      <LeaderPanelCard key="waterLevel" title='库存水位线'>
        {d?.stockWaterLevel?.length ? (
          <StockWaterLevel items={d.stockWaterLevel} />
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--leader-text-muted)' }}>暂无异常水位物资</p>
        )}
        <p className="mt-4" style={{ fontSize: '0.6875rem', color: 'var(--leader-text-muted)' }}>低库存采购建议 · 高库存入库拦截</p>
      </LeaderPanelCard>
    ),
    zoneHeatmap: (
      <LeaderPanelCard key="zoneHeatmap" title='库区平面热力图'>
        {d ? <ZoneHeatmap data={d.zoneHeatmap} /> : null}
      </LeaderPanelCard>
    ),
    myApprovals: (
      <LeaderPanelCard
        key="myApprovals"
        header={
          <div className="flex items-center justify-between gap-2">
            <h3
              className="flex items-center gap-2"
              style={{
                fontFamily: 'var(--leader-font-body)',
                fontSize: 'var(--cheta-leader-page-subtitle-size, 1.125rem)',
                fontWeight: 'var(--cheta-title-weight, 600)',
                color: 'var(--leader-text)',
              }}
            >
              <ClipboardCheck className="size-5 text-primary" />
              待我审批
              {(d?.myApprovals?.length ?? 0) > 0 && (
                <Badge variant="destructive">{d?.myApprovals.length}</Badge>
              )}
            </h3>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate('/tasks')}>
              待办中心 →
            </Button>
          </div>
        }
      >
        {(d?.myApprovals?.length ?? 0) > 0 ? (
          <DataTable
            tableKey={TABLE_KEYS.DASHBOARD_APPROVALS}
            loading={loading}
            columns={[
              { key: 'bizLabel', title: '类型', render: (r) => <Badge variant="info">{String(r.bizLabel)}</Badge> },
              { key: 'orderNo', title: '单号' },
              { key: 'nodeLabel', title: '节点', render: (r) => String(r.nodeLabel ?? '审批') },
              { key: 'summary', title: '摘要' },
              { key: 'createdAt', title: '时间', render: (r) => formatDate(String(r.createdAt)) },
              {
                key: 'link',
                title: '',
                render: (r) => (
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate(String(r.docPath))}>
                    处理
                  </Button>
                ),
              },
            ]}
            rows={(d?.myApprovals ?? []) as unknown as Array<Record<string, unknown>>}
          />
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--leader-text-muted)' }}>暂无待审批任务</p>
        )}
      </LeaderPanelCard>
    ),
    activeDocuments: (
      <LeaderPanelCard
        key="activeDocuments"
        header={
          <div className="flex items-center justify-between gap-2">
            <h3
              style={{
                fontFamily: 'var(--leader-font-body)',
                fontSize: 'var(--cheta-leader-page-subtitle-size, 1.125rem)',
                fontWeight: 'var(--cheta-title-weight, 600)',
                color: 'var(--leader-text)',
              }}
            >
              进行中单据
            </h3>
            <div className="flex gap-2">
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate('/inbound')}>
                入库
              </Button>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate('/outbound')}>
                出库
              </Button>
            </div>
          </div>
        }
      >
        <DataTable
          tableKey={TABLE_KEYS.DASHBOARD_DOCUMENTS}
          loading={loading}
          columns={[
            { key: 'docType', title: '类型', render: (r) => <Badge variant="info">{String(r.docType)}</Badge> },
            { key: 'orderNo', title: '单号' },
            { key: 'status', title: '状态', render: (r) => <Badge variant={statusBadgeVariant(String(r.status))}>{STATUS_LABELS[String(r.status)] ?? String(r.status)}</Badge> },
            { key: 'partner', title: '供应商/目的地' },
            { key: 'createdBy', title: '创建人', render: (r) => String(r.createdBy ?? '—') },
            { key: 'createdAt', title: '时间', render: (r) => formatDate(String(r.createdAt)) },
            {
              key: 'link',
              title: '',
              render: (r) => (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => navigate(activeDocumentPath(r as unknown as ActiveDocument))}
                >
                  查看
                </Button>
              ),
            },
          ]}
          rows={(d?.pendingTasks ?? []) as Array<Record<string, unknown>>}
        />
      </LeaderPanelCard>
    ),
    alerts: (
      <div key="alerts">
        <h3
          className="mb-4"
          style={{
            fontFamily: 'var(--leader-font-body)',
            fontSize: 'var(--cheta-leader-page-subtitle-size, 1.125rem)',
            fontWeight: 'var(--cheta-title-weight, 600)',
            color: 'var(--leader-text)',
          }}
        >智能预警</h3>
        <DataTable
          tableKey={TABLE_KEYS.DASHBOARD_ALERTS}
          loading={loading}
          columns={[
            { key: 'level', title: '级别', render: (r) => <Badge variant={statusBadgeVariant(String(r.level))}>{String(r.level)}</Badge> },
            { key: 'type', title: '类型', render: (r) => ({ EXPIRY: '效期', LOW_STOCK: '低库存', HIGH_STOCK: '高库存' }[String(r.type)] ?? String(r.type)) },
            { key: 'material', title: '物资', render: (r) => (r.material as { name?: string })?.name ?? '—' },
            { key: 'message', title: '预警内容' },
          ]}
          rows={(d?.recentAlerts ?? []) as Array<Record<string, unknown>>}
        />
      </div>
    ),
  }

  const panels: WorkspaceWidgetId[] = [
    'expiry', 'waterLevel',
    ...CHART_WIDGET_IDS.filter((id) => id !== 'chartDestinationBar' && id !== 'chartIoTrend'),
  ]
  let panelBuffer: React.ReactNode[] = []

  const rendered: React.ReactNode[] = []
  for (const w of visibleWidgets) {
    if (panels.includes(w.id)) {
      panelBuffer.push(widgets[w.id])
      if (panelBuffer.length === 2) {
        rendered.push(
          <div key={`pair-${w.id}`} className="leader-workspace-grid grid grid-cols-1 lg:grid-cols-2">
            {panelBuffer}
          </div>,
        )
        panelBuffer = []
      }
    } else {
      if (panelBuffer.length === 1) {
        rendered.push(
          <div key="pair-single" className="leader-workspace-grid grid grid-cols-1 lg:grid-cols-2">
            {panelBuffer}
          </div>,
        )
        panelBuffer = []
      }
      rendered.push(widgets[w.id])
    }
  }
  if (panelBuffer.length) {
    rendered.push(
      <div key="pair-tail" className="leader-workspace-grid grid grid-cols-1 lg:grid-cols-2">
        {panelBuffer}
      </div>,
    )
  }

  return (
    <div className="leader-workspace-grid space-y-6">
      <LeaderPageHeader
        title='工作台'
        desc="运营态势一屏统览 · 统计图与各模块可在「工作台定制」中单独开关与排序"
        action={
          <div className="flex flex-wrap gap-2">
            <WorkspaceCustomizeMenu />
            <ToolbarButton onClick={() => d && exportDashboard(d)}>
              <Download className="size-3.5" />
              导出
            </ToolbarButton>
            <ToolbarButton onClick={() => refetch()}>
              <RefreshCw className="size-3.5" />
              刷新
            </ToolbarButton>
          </div>
        }
      />
      {rendered}
    </div>
  )
}
