import { Skeleton } from 'components/ui/skeleton'
import { useTranslation } from 'react-i18next'

export function MobileOpsTaskSkeleton({ count = 3 }: { count?: number }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2" aria-busy aria-label={t('加载中')}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="mobile-ops-card mobile-ops-task-card">
          <div className="mobile-ops-card-body space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-full max-w-[14rem]" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-1 w-full rounded-full" />
            <Skeleton className="mt-1 h-10 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
