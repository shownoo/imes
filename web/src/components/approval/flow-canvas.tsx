import { useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { approvalNodeTypes } from './approval-nodes'
import { flowToGraph, graphToFlow, inferEdgeData, normalizeGraphEdges, type FlowEdge, type FlowGraph, type FlowNodeData, type NodeProgressState } from 'lib/approval-flow'

type Props = {
  graph: FlowGraph
  progress?: Array<{ id: string; state: NodeProgressState }>
  readonly?: boolean
  selectedNodeId?: string | null
  onGraphChange?: (graph: FlowGraph) => void
  onSelectNode?: (nodeId: string | null) => void
  onConfirmDelete?: (payload: { nodeIds: string[]; edgeCount: number }) => Promise<boolean>
  height?: number
}

function graphsEqual(a: FlowGraph, b: FlowGraph) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function isUserNodeChange(changes: NodeChange[]) {
  return changes.some(
    (c) =>
      c.type === 'remove' ||
      c.type === 'add' ||
      (c.type === 'position' && 'dragging' in c && c.dragging === false),
  )
}

function isUserEdgeChange(changes: EdgeChange[]) {
  return changes.some((c) => c.type === 'remove' || c.type === 'add')
}

export function FlowCanvas({
  graph,
  progress,
  readonly = false,
  selectedNodeId,
  onGraphChange,
  onSelectNode,
  onConfirmDelete,
  height = 360,
}: Props) {
  const syncingRef = useRef(false)
  const graphRef = useRef(graph)
  graphRef.current = graph

  const initial = graphToFlow(graph, progress)
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges as Edge[])
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  nodesRef.current = nodes
  edgesRef.current = edges

  useEffect(() => {
    syncingRef.current = true
    const next = graphToFlow(normalizeGraphEdges(graph), progress)
    setNodes(
      next.nodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
        deletable: n.type === 'approval' && !readonly,
        data: { ...n.data, selected: n.id === selectedNodeId },
        draggable: !readonly,
        selectable: !readonly,
      })) as Node[],
    )
    setEdges(next.edges as Edge[])
    requestAnimationFrame(() => {
      syncingRef.current = false
    })
  }, [graph, progress, readonly, selectedNodeId, setNodes, setEdges])

  const emitChange = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      if (!onGraphChange) return
      const nextGraph = flowToGraph(
        nextNodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data as FlowNodeData,
        })),
        nextEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: typeof e.label === 'string' ? e.label : undefined,
          data: e.data as FlowEdge['data'],
        })),
      )
      if (!graphsEqual(nextGraph, graphRef.current)) {
        onGraphChange(nextGraph)
      }
    },
    [onGraphChange],
  )

  const onConnect = useCallback(
    (conn: Connection) => {
      if (readonly || !conn.source || !conn.target) return
      const edgeData = inferEdgeData(conn.source, conn.target, graphRef.current.nodes)
      setEdges((eds) => {
        const next = addEdge(
          {
            ...conn,
            id: `e-${conn.source}-${conn.target}`,
            label: edgeData?.label,
            data: edgeData,
          },
          eds,
        )
        emitChange(nodes, next)
        return next
      })
    },
    [readonly, nodes, setEdges, emitChange],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)
      if (readonly || syncingRef.current || !isUserNodeChange(changes)) return
      setTimeout(() => {
        setNodes((current) => {
          emitChange(current, edgesRef.current)
          return current
        })
      }, 0)
    },
    [onNodesChange, readonly, emitChange, setNodes],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)
      if (readonly || syncingRef.current || !isUserEdgeChange(changes)) return
      setTimeout(() => {
        setEdges((current) => {
          emitChange(nodesRef.current, current)
          return current
        })
      }, 0)
    },
    [onEdgesChange, readonly, emitChange, setEdges],
  )

  const handleBeforeDelete = useCallback(
    async ({ nodes: nodesToDelete, edges: edgesToDelete }: { nodes: Node[]; edges: Edge[] }) => {
      if (readonly || !onConfirmDelete || nodesToDelete.length === 0) {
        return { nodes: nodesToDelete, edges: edgesToDelete }
      }
      const approved = await onConfirmDelete({
        nodeIds: nodesToDelete.map((n) => n.id),
        edgeCount: edgesToDelete.length,
      })
      return approved ? { nodes: nodesToDelete, edges: edgesToDelete } : { nodes: [], edges: [] }
    },
    [readonly, onConfirmDelete],
  )

  return (
    <div className="overflow-hidden rounded-xl border bg-muted/20" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readonly ? undefined : handleNodesChange}
        onEdgesChange={readonly ? undefined : handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={approvalNodeTypes}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
        onInit={(instance) => instance.fitView({ padding: 0.3 })}
        onNodeClick={(_, node) => onSelectNode?.(node.id)}
        onPaneClick={() => onSelectNode?.(null)}
        onNodesDelete={(deleted) => {
          if (deleted.some((n) => n.id === selectedNodeId)) onSelectNode?.(null)
        }}
        onBeforeDelete={handleBeforeDelete}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={!readonly} />
        <MiniMap zoomable pannable className="!bg-background/80" />
      </ReactFlow>
    </div>
  )
}
