import { useSubscription } from '@apollo/client'
import { OPS_TODO_CHANGED } from 'lib/realtime-queries'

/** 待办 hub：他人操作入库/出库单时自动刷新列表 */
export function useOpsRealtime(onChange: () => void) {
  useSubscription(OPS_TODO_CHANGED, {
    onData: () => onChange(),
  })
}
