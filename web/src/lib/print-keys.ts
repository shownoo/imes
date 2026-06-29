export const LEGAL_PRINT_TEMPLATE = {
  PrintInbound: 'PrintInbound',
  PrintOutbound: 'PrintOutbound',
} as const

export type PrintTemplateKey = (typeof LEGAL_PRINT_TEMPLATE)[keyof typeof LEGAL_PRINT_TEMPLATE]

export const PRINT_TEMPLATE_LABELS: Record<PrintTemplateKey, string> = {
  [LEGAL_PRINT_TEMPLATE.PrintInbound]: '采购入库单',
  [LEGAL_PRINT_TEMPLATE.PrintOutbound]: '物资出库单',
}
