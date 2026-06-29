import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $generateHtmlFromNodes } from '@lexical/html'
import { Save } from 'lucide-react'
import { RichTextEditor, RichTextEditorComposer } from 'components/Editor'
import { TemplateLoadBuiltin, applyBuiltinHtml } from 'components/template-load-builtin'
import { Button, PageHeader } from 'components/common'
import { LEGAL_PRINT_TEMPLATE, PRINT_TEMPLATE_LABELS, type PrintTemplateKey } from 'lib/print-keys'
import {
  GET_PRINT_TEMPLATE,
  SET_PRINT_TEMPLATE,
  RESET_PRINT_TEMPLATE,
} from 'pages/print/queries'

interface LexicalNodeData {
  type: string
  children?: LexicalNodeData[]
}

interface LexicalEditorStateData {
  root: LexicalNodeData
}

function isValidKey(key: string | undefined): key is PrintTemplateKey {
  return !!key && Object.values(LEGAL_PRINT_TEMPLATE).includes(key as PrintTemplateKey)
}

function EditorContent({ templateKey }: { templateKey: PrintTemplateKey }) {
  const navigate = useNavigate()
  const [editor] = useLexicalComposerContext()
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const { data: templateData, refetch } = useQuery(GET_PRINT_TEMPLATE, {
    variables: { input: { key: templateKey } },
    skip: !templateKey,
  })

  useEffect(() => {
    if (initialized || !templateData?.getPrintTemplate) return

    const row = templateData.getPrintTemplate as {
      value?: { template?: LexicalEditorStateData; html?: string }
      html?: string
    } | null

    const rawValue = row?.value
    const templateState =
      rawValue?.template ??
      (rawValue && 'root' in rawValue ? (rawValue as LexicalEditorStateData) : null)

    if (templateState?.root) {
      try {
        editor.setEditorState(editor.parseEditorState(JSON.stringify(templateState)))
        setInitialized(true)
        return
      } catch (error) {
        console.error('解析模板数据错误:', error)
      }
    }

    const html = rawValue?.html ?? row?.html
    if (html) {
      applyBuiltinHtml(editor, html)
      setInitialized(true)
      return
    }

    setInitialized(true)
  }, [templateData, editor, initialized])

  const [saveTemplate] = useMutation(SET_PRINT_TEMPLATE)
  const [resetTemplate, { loading: resetting }] = useMutation(RESET_PRINT_TEMPLATE)

  const handleSave = useCallback(() => {
    setLoading(true)
    const editorState = editor.getEditorState()
    const serializedState = editorState.toJSON()
    let htmlContent = ''
    editorState.read(() => {
      htmlContent = $generateHtmlFromNodes(editor)
    })

    saveTemplate({
      variables: {
        input: {
          key: templateKey,
          template: serializedState,
          html: htmlContent,
        },
      },
    })
      .then(() => {
        alert('模板已保存')
        void refetch()
      })
      .catch((error: Error) => {
        console.error('保存模板错误:', error)
        alert(error.message)
      })
      .finally(() => setLoading(false))
  }, [editor, templateKey, saveTemplate, refetch])

  const handleReset = useCallback(async () => {
    if (!confirm('确认恢复为系统默认模板？当前修改将丢失。')) return
    await resetTemplate({ variables: { input: { key: templateKey } } })
    const { data } = await refetch()
    const row = data?.getPrintTemplate as { value?: { html?: string }; html?: string } | null
    const html = row?.value?.html ?? row?.html
    if (html) applyBuiltinHtml(editor, html)
  }, [resetTemplate, templateKey, refetch, editor])

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-2">
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => navigate('/admin/print-templates')}
        >
          ← 打印模板'</button>
        <div className="flex flex-wrap items-center gap-2">
          <TemplateLoadBuiltin templateKey={templateKey} />
          <Button variant="outline" size="sm" onClick={() => void handleReset()} disabled={resetting}>
            恢复默认
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading || !initialized}>
            <Save className="size-3.5" />
            {loading ? '保存中…' : '保存'}
          </Button>
        </div>
      </div>
      <RichTextEditor templateKey={templateKey} />
    </div>
  )
}

export default function PrintTemplateEditPage() {
  const { key } = useParams()
  const navigate = useNavigate()

  if (!isValidKey(key)) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        <p className="font-medium">无效的模板类型</p>
        <button type="button" className="mt-2 text-sm underline" onClick={() => navigate('/admin/print-templates')}>
          返回列表'</button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={PRINT_TEMPLATE_LABELS[key]}
        desc="可视化编辑打印样式；使用工具栏插入变量、表格与格式"
      />
      <RichTextEditorComposer>
        <EditorContent templateKey={key} />
      </RichTextEditorComposer>
    </div>
  )
}
