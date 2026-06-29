import { LEGAL_PRINT_TEMPLATE, type PrintTemplateKey } from 'lib/print-keys'

export interface PrintVariable {
  label: string
  value: string
}

/** 主表字段（m- 前缀） */
export const PRINT_TEMPLATE_VARIABLES: Record<PrintTemplateKey, PrintVariable[]> = {
  [LEGAL_PRINT_TEMPLATE.PrintInbound]: [
    { label: '单号', value: 'm-orderNo' },
    { label: '日期', value: 'm-createdAt' },
    { label: '状态', value: 'm-status' },
    { label: '合同号', value: 'm-contractNo' },
    { label: '供应商', value: 'm-supplier.name' },
    { label: '制单人', value: 'm-createdBy.name' },
    { label: '审核人', value: 'm-approvedBy.name' },
    { label: '审核日期', value: 'm-approvedAt' },
    { label: '备注', value: 'm-remark' },
  ],
  [LEGAL_PRINT_TEMPLATE.PrintOutbound]: [
    { label: '单号', value: 'm-orderNo' },
    { label: '日期', value: 'm-createdAt' },
    { label: '状态', value: 'm-status' },
    { label: '用途', value: 'm-purpose' },
    { label: '目的地', value: 'm-destination' },
    { label: '领用人', value: 'm-recipient' },
    { label: '制单人', value: 'm-createdBy.name' },
    { label: '审核人', value: 'm-approvedBy.name' },
    { label: '审核日期', value: 'm-approvedAt' },
    { label: '完成日期', value: 'm-completedAt' },
    { label: '备注', value: 'm-remark' },
  ],
}

/** 明细行字段（t- 前缀，用于表格单元格） */
export const PRINT_TEMPLATE_TABLE_VARIABLES: Record<PrintTemplateKey, PrintVariable[]> = {
  [LEGAL_PRINT_TEMPLATE.PrintInbound]: [
    { label: '序号', value: 't-odr' },
    { label: '物资名称', value: 't-name' },
    { label: '规格', value: 't-spec' },
    { label: '单位', value: 't-unit' },
    { label: '应收', value: 't-expectedQty' },
    { label: '实收', value: 't-actualQty' },
    { label: '批次号', value: 't-batchNo' },
  ],
  [LEGAL_PRINT_TEMPLATE.PrintOutbound]: [
    { label: '序号', value: 't-odr' },
    { label: '物资名称', value: 't-name' },
    { label: '规格', value: 't-spec' },
    { label: '单位', value: 't-unit' },
    { label: '申请数量', value: 't-requestedQty' },
    { label: '实发数量', value: 't-pickedQty' },
  ],
}

export function getMainVariables(templateKey: string): PrintVariable[] {
  return PRINT_TEMPLATE_VARIABLES[templateKey as PrintTemplateKey] ?? []
}

export function getTableVariables(templateKey: string): PrintVariable[] {
  return PRINT_TEMPLATE_TABLE_VARIABLES[templateKey as PrintTemplateKey] ?? []
}
