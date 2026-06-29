import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { GitBranch, Plus, Save, Trash2 } from 'lucide-react'
import { Button, Card, CardContent } from 'components/common'
import { SectionPanelHeader } from 'components/section-menu'
import { FlowCanvas } from 'components/approval/flow-canvas'
import { FormField } from 'components/form-page'
import { Input } from 'components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog'
import { emptyGraph, normalizeGraphEdges, type FlowGraph } from 'lib/approval-flow'
import { ROLE_OPTIONS } from 'lib/approval-flow'
import { cn } from 'lib/utils'
import { GET_FLOW, GET_FLOWS, SAVE_FLOW } from './queries'

const BIZ_TYPES = [
  { value: 'outbound', label: '出库审批', name: '出库审批' },
  { value: 'inbound', label: '入库审批', name: '入库审批' },
]

function nextId(prefix: string, graph: FlowGraph) {
  let i = 1
  while (graph.nodes.some((n) => n.id === `${prefix}_${i}`)) i++
  return `${prefix}_${i}`
}

export default function WorkflowsIndex() {
  const [bizType, setBizType] = useState('outbound')
  const [graph, setGraph] = useState<FlowGraph>(emptyGraph())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ labels: string; edgeCount: number } | null>(null)
  const deleteResolveRef = useRef<((approved: boolean) => void) | null>(null)

  const meta = BIZ_TYPES.find((b) => b.value === bizType)!
  const { data, refetch } = useQuery(GET_FLOW, { variables: { bizType } })
  const { data: flowsData } = useQuery(GET_FLOWS)
  const [saveFlow, { loading: saving }] = useMutation(SAVE_FLOW)

  const flowRecord = data?.getApprovalFlow as { graph?: FlowGraph; name?: string; description?: string } | null
  const allFlows = (flowsData?.getApprovalFlows as Array<{ bizType: string }>) ?? []

  useEffect(() => {
    if (flowRecord?.graph) {
      setGraph(normalizeGraphEdges(flowRecord.graph))
    } else {
      setGraph(emptyGraph())
    }
    setSelectedId(null)
  }, [flowRecord, bizType])

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedId) ?? null,
    [graph.nodes, selectedId],
  )

  const updateNode = (patch: Partial<(typeof graph.nodes)[0]['data']>) => {
    if (!selectedId) return
    setGraph((g) => ({
      ...g,
      nodes: g.nodes.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n)),
    }))
    setSaved(false)
  }

  const addApprovalNode = () => {
    const id = nextId('approval', graph)
    setGraph((g) => ({
      ...g,
      nodes: [
        ...g.nodes,
        {
          id,
          type: 'approval',
          position: { x: 280 + g.nodes.length * 20, y: 80 + g.nodes.length * 30 },
          data: { label: '新审批', role: 'SUPERVISOR', mode: 'any', timeoutHours: 48, remindIntervalHours: 4, maxRemindCount: 5, onTimeout: 'remind' },
        },
      ],
    }))
    setSelectedId(id)
    setSaved(false)
  }

  const deleteSelectedNode = () => {
    if (!selectedId) return
    const node = graph.nodes.find((n) => n.id === selectedId)
    if (!node || node.type !== 'approval') return
    setGraph((g) => ({
      nodes: g.nodes.filter((n) => n.id !== selectedId),
      edges: g.edges.filter((e) => e.source !== selectedId && e.target !== selectedId),
    }))
    setSelectedId(null)
    setSaved(false)
  }

  const askDeleteConfirm = useCallback(
    (nodeIds: string[], edgeCount: number) => {
      const labels = nodeIds
        .map((id) => graph.nodes.find((n) => n.id === id)?.data.label ?? id)
        .join('、')
      return new Promise<boolean>((resolve) => {
        deleteResolveRef.current = resolve
        setDeleteConfirm({ labels, edgeCount })
      })
    },
    [graph.nodes],
  )

  const finishDeleteConfirm = (approved: boolean) => {
    const resolve = deleteResolveRef.current
    if (!resolve) return
    deleteResolveRef.current = null
    setDeleteConfirm(null)
    resolve(approved)
  }

  const handleDeleteButtonClick = async () => {
    if (!selectedId) return
    const node = graph.nodes.find((n) => n.id === selectedId)
    if (!node || node.type !== 'approval') return
    const edgeCount = graph.edges.filter((e) => e.source === selectedId || e.target === selectedId).length
    if (!(await askDeleteConfirm([selectedId], edgeCount))) return
    deleteSelectedNode()
  }

  const handleSave = async () => {
    try {
      await saveFlow({
        variables: {
          input: {
            bizType,
            name: meta.name,
            description: `${meta.label}流程配置`,
            graph,
            active: true,
          },
        },
      })
      setSaved(true)
      refetch()
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
    }
  }

  return (
    <div>
      <SectionPanelHeader
        desc="可视化配置各业务的审批节点与流转路径，保存后对新建流程实例生效"
        action={
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {saved ? '已保存' : '保存流程'}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {BIZ_TYPES.map((b) => {
          const active = bizType === b.value
          const configured = allFlows.some((f) => f.bizType === b.value)
          return (
            <button
              key={b.value}
              type="button"
              onClick={() => setBizType(b.value)}
              className={cn(
                'inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted',
              )}
            >
              {b.label}
              {configured && (
                <span className={cn('ml-1.5 text-[10px] font-normal', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  已配置
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GitBranch className="size-4" />
                拖拽节点 · 连线定义流转 · 点击节点编辑属性 · 删除审批节点需确认
              </div>
              <Button variant="outline" size="sm" onClick={addApprovalNode}>
                <Plus className="size-4" /> 添加审批节点
              </Button>
            </div>
            <FlowCanvas
              graph={graph}
              selectedNodeId={selectedId}
              onGraphChange={(g) => { setGraph(normalizeGraphEdges(g)); setSaved(false) }}
              onSelectNode={setSelectedId}
              onConfirmDelete={({ nodeIds, edgeCount }) => askDeleteConfirm(nodeIds, edgeCount)}
              height={420}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-medium">节点属性</h3>
            {!selectedNode && (
              <p className="text-sm text-muted-foreground">点击画布上的节点进行编辑</p>
            )}
            {selectedNode && (
              <>
                <FormField label="节点名称">
                  <Input
                    value={selectedNode.data.label}
                    onChange={(e) => updateNode({ label: e.target.value })}
                    disabled={selectedNode.type === 'start'}
                  />
                </FormField>
                {selectedNode.type === 'approval' && (
                  <>
                    <FormField label="审批角色">
                      <Select value={selectedNode.data.role ?? 'SUPERVISOR'} onValueChange={(v) => updateNode({ role: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="审批方式">
                      <Select value={selectedNode.data.mode ?? 'any'} onValueChange={(v) => updateNode({ mode: v as 'any' | 'all' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">或签（一人通过即可）</SelectItem>
                          <SelectItem value="all">会签（全部通过）</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="超时（小时）">
                      <Input
                        type="number"
                        min={1}
                        value={selectedNode.data.timeoutHours ?? 48}
                        onChange={(e) => updateNode({ timeoutHours: Number(e.target.value) })}
                      />
                    </FormField>
                    <FormField label="催办间隔（小时）">
                      <Input
                        type="number"
                        min={1}
                        value={selectedNode.data.remindIntervalHours ?? 4}
                        onChange={(e) => updateNode({ remindIntervalHours: Number(e.target.value) })}
                      />
                    </FormField>
                    <FormField label="最大催办次数">
                      <Input
                        type="number"
                        min={0}
                        value={selectedNode.data.maxRemindCount ?? 5}
                        onChange={(e) => updateNode({ maxRemindCount: Number(e.target.value) })}
                      />
                    </FormField>
                    <FormField label="超时后动作">
                      <Select
                        value={selectedNode.data.onTimeout ?? 'remind'}
                        onValueChange={(v) => updateNode({ onTimeout: v as 'remind' | 'approve' | 'reject' })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="remind">继续催办</SelectItem>
                          <SelectItem value="approve">自动通过</SelectItem>
                          <SelectItem value="reject">自动驳回</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                  </>
                )}
                {selectedNode.type === 'end' && (
                  <FormField label="结束类型">
                    <Select
                      value={selectedNode.data.outcome ?? 'approved'}
                      onValueChange={(v) => updateNode({ outcome: v as 'approved' | 'rejected' })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">审核通过</SelectItem>
                        <SelectItem value="rejected">驳回</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
                <p className="text-xs text-muted-foreground">节点 ID: {selectedNode.id}</p>
                {selectedNode.type === 'approval' && (
                  <Button variant="destructive" size="sm" className="w-full" onClick={handleDeleteButtonClick}>
                    <Trash2 className="size-4" />
                    删除节点
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) finishDeleteConfirm(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除节点？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm && (
                <>
                  将删除审批节点「{deleteConfirm.labels}」
                  {deleteConfirm.edgeCount > 0 ? `，并移除 ${deleteConfirm.edgeCount} 条相关连线` : ''}
                  。此操作在保存流程前可重新添加节点恢复。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => finishDeleteConfirm(false)}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                finishDeleteConfirm(true)
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
