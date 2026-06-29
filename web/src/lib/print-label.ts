/** 打开打印窗口，仅渲染标签 HTML */
export function printLabelHtml(bodyHtml: string, title = '打印标签') {
  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) {
    alert('无法打开打印窗口，请允许弹出窗口后重试')
    return
  }
  win.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: 80mm 50mm; margin: 3mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: #111; }
    .qr-label-sheet { display: flex; flex-wrap: wrap; gap: 0; }
    .qr-label-print {
      width: 74mm;
      min-height: 44mm;
      padding: 3mm;
      page-break-inside: avoid;
      text-align: center;
      border: 0.2mm dashed #ccc;
      margin-bottom: 2mm;
    }
    .qr-label-print svg { display: block; margin: 0 auto 2mm; }
    .qr-label-print__title { font-size: 11pt; font-weight: 600; margin: 0 0 1mm; line-height: 1.3; }
    .qr-label-print__sub { font-size: 8pt; color: #555; margin: 0 0 1.5mm; }
    .qr-label-print__code { font-family: ui-monospace, monospace; font-size: 7pt; word-break: break-all; color: #333; margin: 0; }
    .qr-label-print__meta { font-size: 7pt; color: #666; margin: 1mm 0 0; }
    @media print {
      .qr-label-print { border: none; margin: 0; }
    }
  </style>
</head>
<body><div class="qr-label-sheet">${bodyHtml}</div>
<script>window.onload=function(){window.print();};</script>
</body></html>`)
  win.document.close()
}

export function printLabelFromElement(el: HTMLElement, title?: string) {
  printLabelHtml(el.innerHTML, title)
}
