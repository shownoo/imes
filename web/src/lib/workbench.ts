import type { ApprovalInboxItem } from 'lib/approval-flow'

export type ActiveDocument = {
  id: string
  docType: string
  orderNo: string
  status: string
  partner: string
  createdAt: string
  createdBy?: string
}

export type SubmittedApprovalItem = {
  instanceId: string
  bizType: string
  bizId: string
  bizLabel: string
  docPath: string
  orderNo: string
  summary: string
  currentNodeLabel: string
  waitingRole: string | null
  submittedAt: string
  updatedAt: string
}

export type WorkbenchCounts = {
  myApprovals: number
  mySubmitted: number
  activeDocuments: number
}

export type WorkbenchSummary = {
  counts: WorkbenchCounts
  myApprovals: ApprovalInboxItem[]
  mySubmitted: SubmittedApprovalItem[]
  activeDocuments: ActiveDocument[]
}

export type TaskCenterTab = 'approvals' | 'submitted' | 'documents'

export function activeDocumentPath(doc: Pick<ActiveDocument, 'id' | 'docType'>) {
  return doc.docType === '物资出库' ? `/outbound/${doc.id}` : `/inbound/${doc.id}`
}

export function parseTaskCenterTab(value: string | null): TaskCenterTab {
  if (value === 'submitted' || value === 'documents') return value
  return 'approvals'
}
