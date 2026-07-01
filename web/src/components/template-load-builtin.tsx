import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { $generateNodesFromDOM } from '@lexical/html'
import { useLazyQuery } from '@apollo/client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $getRoot } from 'lexical'
import { $isTableNode } from '@lexical/table'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog'
import { Button } from 'components/legacy-button'
import { GET_BUILTIN_PRINT_TEMPLATE } from 'pages/print/queries'

function applyBuiltinHtml(editor: ReturnType<typeof useLexicalComposerContext>[0], html: string) {
  const { t } = useTranslation()
  const parser = new DOMParser()
  const dom = parser.parseFromString(
    `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${html}</body></html>`,
    'text/html',
  )

  const tableColWidths: number[][] = []
  dom.querySelectorAll('table').forEach((table) => {
    const firstRow = table.querySelector('tr')
    const widths: number[] = []
    if (firstRow) {
      firstRow.querySelectorAll('th, td').forEach((el) => {
        const w = (el as HTMLElement).style.width
        const px = w?.endsWith('px') ? parseFloat(w) : NaN
        widths.push(Number.isNaN(px) ? 80 : px)
      })
    }
    tableColWidths.push(widths)
  })

  editor.update(() => {
    const nodes = $generateNodesFromDOM(editor, dom)
    const root = $getRoot()
    root.clear()
    if (nodes.length) {
      root.append(...nodes)
    } else {
      root.append($createParagraphNode())
    }

    let tableIdx = 0
    root.getChildren().forEach((child) => {
      if ($isTableNode(child) && tableIdx < tableColWidths.length) {
        child.setColWidths(tableColWidths[tableIdx++])
      }
    })
  })
}

export function TemplateLoadBuiltin({ templateKey }: { templateKey: string }) {
  const { t } = useTranslation()
  const [editor] = useLexicalComposerContext()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchBuiltin] = useLazyQuery(GET_BUILTIN_PRINT_TEMPLATE)

  const handleConfirm = useCallback(async () => {
    if (!templateKey) return
    setLoading(true)
    try {
      const { data, error } = await fetchBuiltin({ variables: { input: { key: templateKey } } })
      if (error) throw error
      const raw = data?.getBuiltinPrintTemplate
      const html =
        raw && typeof raw === 'object' && typeof (raw as { html?: unknown }).html === 'string'
          ? (raw as { html: string }).html
          : ''
      if (!html.trim()) {
        alert(t('未找到系统内置模板'))
        return
      }
      applyBuiltinHtml(editor, html)
      setOpen(false)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : '载入默认模板失败')
    } finally {
      setLoading(false)
    }
  }, [templateKey, fetchBuiltin, editor])

  return (
    <>
      <Button type="default" size="small" title='载入默认' onClick={() => setOpen(true)}>载入默认</Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-md gap-3">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('载入系统默认模板？')}</AlertDialogTitle>
            <AlertDialogDescription className="text-left">{t('当前编辑器中的内容将被系统内置模板替换，此操作不会自动保存。')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-end">
            <AlertDialogCancel disabled={loading}>{t('取消')}</AlertDialogCancel>
            <Button
              type="primary"
              size="small"
              loading={loading}
              disabled={loading}
              onClick={() => void handleConfirm()}>确认载入</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { applyBuiltinHtml }
