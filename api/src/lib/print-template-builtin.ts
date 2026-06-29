/** Built-in print template HTML (seeded into SystemSetting). */

function v(label: string, value: string) {
  return `<span class="template-variable" data-variable="${value}" data-variable-label="${label}">{{${value}}}</span>`
}

const th = (text: string, width?: string) =>
  `<th style="border:1px solid #ccc;padding:6px 8px;text-align:left;background:#f5f5f5;${width ? `width:${width};` : ''}"><b>${text}</b></th>`

const td = (content: string) =>
  `<td style="border:1px solid #ccc;padding:6px 8px;">${content}</td>`

export const PRINT_TEMPLATE_KEYS = {
  PrintInbound: 'PrintInbound',
  PrintOutbound: 'PrintOutbound',
} as const

export type PrintTemplateKey = (typeof PRINT_TEMPLATE_KEYS)[keyof typeof PRINT_TEMPLATE_KEYS]

export const PRINT_TEMPLATE_HTML: Record<PrintTemplateKey, { html: string }> = {
  PrintInbound: {
    html: `
<h2 style="text-align:center;"><b>采购入库单</b></h2>
<p></p>
<p><b>单号: </b>${v('单号', 'm-orderNo')}<span>                    </span><b>日期: </b>${v('日期', 'm-createdAt')}</p>
<p><b>状态: </b>${v('状态', 'm-status')}<span>                    </span><b>合同号: </b>${v('合同号', 'm-contractNo')}</p>
<hr/>
<p><b>供应商: </b>${v('供应商', 'm-supplier.name')}</p>
<p><b>制单人: </b>${v('制单人', 'm-createdBy.name')}<span>        </span><b>审核人: </b>${v('审核人', 'm-approvedBy.name')}<span>        </span><b>审核日期: </b>${v('审核日期', 'm-approvedAt')}</p>
<p></p>
<table style="border-collapse:collapse;width:100%;table-layout:fixed;">
  <tr>
    ${th('序号', '50px')}
    ${th('物资名称', '140px')}
    ${th('规格', '100px')}
    ${th('单位', '50px')}
    ${th('应收', '60px')}
    ${th('实收', '60px')}
    ${th('批次号', '100px')}
  </tr>
  <tr>
    ${td(v('序号', 't-odr'))}
    ${td(v('物资名称', 't-name'))}
    ${td(v('规格', 't-spec'))}
    ${td(v('单位', 't-unit'))}
    ${td(v('应收', 't-expectedQty'))}
    ${td(v('实收', 't-actualQty'))}
    ${td(v('批次号', 't-batchNo'))}
  </tr>
</table>
<p></p>
<p><b>备注: </b>${v('备注', 'm-remark')}</p>
<p></p>
<table style="border-collapse:collapse;width:100%;table-layout:fixed;">
  <tr>
    <td style="border:1px solid #ccc;padding:6px 8px;width:50%;"><b>仓库签收:</b></td>
    <td style="border:1px solid #ccc;padding:6px 8px;width:50%;"><b>供应商确认:</b></td>
  </tr>
  <tr>
    <td style="border:1px solid #ccc;padding:6px 8px;height:80px;"></td>
    <td style="border:1px solid #ccc;padding:6px 8px;height:80px;"></td>
  </tr>
</table>`.trim(),
  },

  PrintOutbound: {
    html: `
<h2 style="text-align:center;"><b>物资出库单</b></h2>
<p></p>
<p><b>单号: </b>${v('单号', 'm-orderNo')}<span>                    </span><b>日期: </b>${v('日期', 'm-createdAt')}</p>
<p><b>状态: </b>${v('状态', 'm-status')}</p>
<hr/>
<p><b>用途: </b>${v('用途', 'm-purpose')}</p>
<p><b>目的地: </b>${v('目的地', 'm-destination')}<span>        </span><b>领用人: </b>${v('领用人', 'm-recipient')}</p>
<p><b>制单人: </b>${v('制单人', 'm-createdBy.name')}<span>        </span><b>审核人: </b>${v('审核人', 'm-approvedBy.name')}<span>        </span><b>审核日期: </b>${v('审核日期', 'm-approvedAt')}</p>
<p></p>
<table style="border-collapse:collapse;width:100%;table-layout:fixed;">
  <tr>
    ${th('序号', '50px')}
    ${th('物资名称', '140px')}
    ${th('规格', '100px')}
    ${th('单位', '50px')}
    ${th('申请数量', '70px')}
    ${th('已拣数量', '70px')}
  </tr>
  <tr>
    ${td(v('序号', 't-odr'))}
    ${td(v('物资名称', 't-name'))}
    ${td(v('规格', 't-spec'))}
    ${td(v('单位', 't-unit'))}
    ${td(v('申请数量', 't-requestedQty'))}
    ${td(v('已拣数量', 't-pickedQty'))}
  </tr>
</table>
<p></p>
<p><b>备注: </b>${v('备注', 'm-remark')}</p>
<p></p>
<table style="border-collapse:collapse;width:100%;table-layout:fixed;">
  <tr>
    <td style="border:1px solid #ccc;padding:6px 8px;width:50%;"><b>发料人:</b></td>
    <td style="border:1px solid #ccc;padding:6px 8px;width:50%;"><b>领用人签收:</b></td>
  </tr>
  <tr>
    <td style="border:1px solid #ccc;padding:6px 8px;height:80px;"></td>
    <td style="border:1px solid #ccc;padding:6px 8px;height:80px;"></td>
  </tr>
</table>`.trim(),
  },
}
