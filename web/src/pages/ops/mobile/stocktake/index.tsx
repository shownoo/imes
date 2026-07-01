import { useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { Plus } from 'lucide-react'
import { MobileOpsCrumbBar } from 'components/mobile-ops-crumb-bar'
import { MobileOpsTaskSkeleton } from 'components/mobile-ops-task-skeleton'
import { PullToRefresh } from 'components/pull-to-refresh'
import { Button } from 'components/common'
import { GET_STOCKTAKE_TASKS } from '../queries'
import { formatDate } from 'lib/utils'
import { MOBILE_OPS_ME } from 'lib/mobile-ops'

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
}

export default function OpsStocktakeList() {
  const navigate = useNavigate()
  const { data, loading, refetch } = useQuery(GET_STOCKTAKE_TASKS, {
    variables: { status: 'IN_PROGRESS', input: { take: 50, skip: 0 } },
  })

  const result = data?.getStocktakeTasks as
    | { tasks: Array<Record<string, unknown>>; count: number }
    | undefined
  const tasks = result?.tasks ?? []
  const initialLoading = loading && !data

  return (
    <div className="mobile-ops-page mobile-ops-page--tab-root">
      <MobileOpsCrumbBar
        title="盘点任务"
        onBack={() => navigate(MOBILE_OPS_ME)}
        backLabel="我的"
        trailing={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-primary"
            onClick={() => navigate('/ops/stocktake/create')}
          >
            <Plus className="size-4" />
            新建
          </Button>
        }
      />
      <PullToRefresh onRefresh={() => refetch()}>
        <div className="mobile-ops-page-body space-y-2">
          {initialLoading && <MobileOpsTaskSkeleton />}

          {!initialLoading && tasks.length === 0 && (
            <div className="mobile-ops-empty">暂无进行中的盘点任务</div>
          )}

          {!initialLoading &&
            tasks.map((task) => {
              const lineCount = Number(task.lineCount ?? 0)
              const countedCount = Number(task.countedCount ?? 0)
              const status = String(task.status)
              return (
                <button
                  key={String(task.id)}
                  type="button"
                  onClick={() => navigate(`/ops/stocktake/${task.id}`)}
                  className="mobile-ops-card mobile-ops-task-card w-full text-left"
                >
                  <div className="mobile-ops-card-body">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="mobile-ops-task-order-no">{String(task.taskNo)}</p>
                        <p className="mobile-ops-card-subtitle mt-1">{String(task.title ?? '—')}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    </div>
                    <div className="mobile-ops-task-meta">
                      <span>
                        已盘 {countedCount}/{lineCount}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{formatDate(String(task.createdAt))}</span>
                    </div>
                  </div>
                </button>
              )
            })}
        </div>
      </PullToRefresh>
    </div>
  )
}
