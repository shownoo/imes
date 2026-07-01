/** 日志字段中文名 */
export const LOG_FIELD_LABELS: Record<string, string> = {
  username: '用户名',
  name: '姓名',
  phone: '电话',
  active: '状态',
  role: '角色',
  roleId: '角色',
  code: '编码',
  spec: '规格',
  model: '型号',
  unit: '单位',
  manufacturer: '生产厂家',
  categoryId: '分类',
  supplierId: '供应商',
  contact: '联系人',
  address: '地址',
  license: '资质',
  zone: '库区类型',
  area: '面积(㎡)',
  capacity: '容量',
  row: '排',
  level: '层',
  warehouseId: '所属库区',
  description: '说明',
  shelfLifeMonths: '保质期(月)',
  safetyStockMin: '安全库存下限',
  safetyStockMax: '安全库存上限',
  contractNo: '合同号',
  remark: '备注',
  purpose: '用途',
  destination: '领用人',
  city: '所属市',
  district: '所属区',
  recipient: '领用人',
  orderDate: '创建日期',
  plannedShipDate: '计划发货日期',
  rejectReason: '驳回原因',
  status: '状态',
  type: '类型',
  lines: '明细',
  lineCount: '明细行数',
  permissions: '权限',
  password: '密码',
  sort: '排序',
  category: '分类',
  supplier: '供应商',
  images: '图片',
}

const OMIT_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'password'])

const INTERNAL_OBJECT_KEYS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'key',
  'storageType',
  'materialId',
  'fileId',
  'sortOrder',
  'url',
  'mimeType',
  'size',
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
}

function formatEntityLabel(obj: Record<string, unknown>): string | null {
  const code = obj.code
  const name = obj.name
  if (typeof code === 'string' && typeof name === 'string') return `${code} ${name}`
  if (typeof name === 'string') return name
  return null
}

const SENSITIVE_FIELDS = new Set(['password'])

export type LogChangeItem = {
  field: string
  label: string
  before: unknown
  after: unknown
}

export type LogChangeDetail = {
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  changes: LogChangeItem[]
}

function formatLogValue(field: string, value: unknown, depth = 0): unknown {
  if (SENSITIVE_FIELDS.has(field)) return value != null && value !== '' ? '******' : '—'
  if (value instanceof Date) {
    return value.toISOString().slice(0, 19).replace('T', ' ')
  }
  if (typeof value === 'boolean') return value ? '启用' : '停用'
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    return value
      .map((item) => {
        if (isPlainObject(item)) {
          if (isPlainObject(item.file) && typeof item.file.name === 'string') return item.file.name
          const entity = formatEntityLabel(item)
          if (entity) return entity
        }
        const formatted = formatLogValue(field, item, depth + 1)
        return typeof formatted === 'string' ? formatted : String(formatted)
      })
      .join('、')
  }
  if (isPlainObject(value)) {
    const entity = formatEntityLabel(value)
    if (entity) return entity
    if (typeof value.name === 'string' && ('mimeType' in value || 'size' in value)) {
      return value.name
    }
    if (depth < 2) {
      const parts = Object.entries(value)
        .filter(([key]) => !INTERNAL_OBJECT_KEYS.has(key))
        .map(([key, nested]) => {
          const label = LOG_FIELD_LABELS[key] ?? key
          const formatted = formatLogValue(key, nested, depth + 1)
          return `${label}: ${formatted}`
        })
      if (parts.length > 0) return parts.join('；')
    }
    return JSON.stringify(value)
  }
  return value
}

export function sanitizeLogRecord(
  record: Record<string, unknown> | null | undefined,
  pick?: string[],
): Record<string, unknown> {
  if (!record) return {}
  const keys = pick ?? Object.keys(record).filter((k) => !OMIT_FIELDS.has(k))
  const out: Record<string, unknown> = {}
  for (const key of keys) {
    if (OMIT_FIELDS.has(key)) continue
    if (!(key in record)) continue
    out[key] = formatLogValue(key, record[key])
  }
  return out
}

export function buildChangeDetail(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  options?: { fields?: string[]; labels?: Record<string, string> },
): LogChangeDetail {
  const labels = { ...LOG_FIELD_LABELS, ...options?.labels }
  const beforeSnap = sanitizeLogRecord(before ?? null, options?.fields)
  const afterSnap = sanitizeLogRecord(after ?? null, options?.fields)
  const keys = options?.fields ?? [...new Set([...Object.keys(beforeSnap), ...Object.keys(afterSnap)])]

  const changes: LogChangeItem[] = []
  for (const field of keys) {
    const b = beforeSnap[field] ?? '—'
    const a = afterSnap[field] ?? '—'
    if (JSON.stringify(b) === JSON.stringify(a)) continue
    changes.push({
      field,
      label: labels[field] ?? field,
      before: b,
      after: a,
    })
  }

  return {
    before: Object.keys(beforeSnap).length ? beforeSnap : undefined,
    after: Object.keys(afterSnap).length ? afterSnap : undefined,
    changes,
  }
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  PENDING: '待审核',
  RECEIVING: '收货中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  APPROVED: '已审核',
  PICKING: '拣货中',
  SHIPPED: '已发运',
  REJECTED: '已驳回',
  IN_STOCK: '在库',
  ISSUED: '已出库',
}

export function formatStatus(status: string) {
  return STATUS_LABELS[status] ?? status
}
