import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { DataTable, TABLE_KEYS } from 'components/common'
import { SectionPanelHeader } from 'components/section-menu'
import { ActionLink } from 'components/action-link'
import { LEGAL_PRINT_TEMPLATE, PRINT_TEMPLATE_LABELS, type PrintTemplateKey } from 'lib/print-keys'

const TEMPLATE_LIST = Object.values(LEGAL_PRINT_TEMPLATE).map((key) => ({
  id: key,
  name: PRINT_TEMPLATE_LABELS[key as PrintTemplateKey],
}))

export default function PrintTemplatesPage() {
  const navigate = useNavigate()

  return (
    <div>
      <SectionPanelHeader desc="配置入库单、出库单的默认打印样式；点击编辑进入可视化模板设计器" />
      <DataTable
        tableKey={TABLE_KEYS.ADMIN_PRINT_TEMPLATES}
        columns={[
          { key: 'name', title: '模板名称' },
          {
            key: 'action',
            title: '操作',
            render: (row) => (
              <ActionLink onClick={() => navigate(`/admin/print-templates/${row.id}`)}>
                <Pencil className="mr-1 inline size-3.5" />
                编辑
              </ActionLink>
            ),
          },
        ]}
        rows={TEMPLATE_LIST}
      />
      <p className="mt-4 text-xs text-muted-foreground">
        提示：在编辑器中点击「插入变量」可插入单据字段；表格单元格内可插入明细行字段。
      </p>
    </div>
  )
}
