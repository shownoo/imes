import { translate } from 'locales'
import type { LucideIcon } from 'lucide-react'
import { Boxes, Bell, CalendarClock, ArrowLeftRight, PackageCheck, Truck } from 'lucide-react'
import {
  MOBILE_OPS_ME_RECEIVED,
  MOBILE_OPS_ME_SHIPPED,
  MOBILE_OPS_TOOLS_ALERTS,
  MOBILE_OPS_TOOLS_EXPIRY,
  MOBILE_OPS_TOOLS_STOCKTAKE,
  MOBILE_OPS_TOOLS_TRANSFER,
} from 'lib/mobile-ops'

export type MobileOpsTool = {
  to: string
  icon: LucideIcon
  label: string
  desc: string
}

export const MOBILE_OPS_TOOLS_LIST: MobileOpsTool[] = [
  {
    to: MOBILE_OPS_TOOLS_STOCKTAKE,
    icon: Boxes,
    label: translate('盘点任务'),
    desc: translate('扫码清点 · 差异调整'),
  },
  {
    to: MOBILE_OPS_TOOLS_EXPIRY,
    icon: CalendarClock,
    label: translate('效期巡检'),
    desc: translate('临期物资现场核查'),
  },
  {
    to: MOBILE_OPS_TOOLS_TRANSFER,
    icon: ArrowLeftRight,
    label: translate('移库调位'),
    desc: translate('扫码物资 · 变更货位'),
  },
  {
    to: MOBILE_OPS_TOOLS_ALERTS,
    icon: Bell,
    label: translate('预警待办'),
    desc: translate('效期与库存预警处理'),
  },
]

/** 「我的」页完整列表：现场工具 + 作业记录 */
export const MOBILE_OPS_ME_LIST: MobileOpsTool[] = [
  ...MOBILE_OPS_TOOLS_LIST,
  {
    to: MOBILE_OPS_ME_RECEIVED,
    icon: PackageCheck,
    label: translate('已收'),
    desc: translate('已完成入库单'),
  },
  {
    to: MOBILE_OPS_ME_SHIPPED,
    icon: Truck,
    label: translate('已发'),
    desc: translate('已发运出库单'),
  },
]
