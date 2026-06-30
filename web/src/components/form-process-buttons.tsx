import { Button } from 'components/ui/button'
import { formGhostButtonClass, formPrimaryButtonClass } from 'components/app-button'

/** 表单顶栏右上操作（取消 / 保存）— 与列表页工具栏按钮一致 */
export function FormProcessButtons({
  onCancel,
  onSubmit,
  loading,
  cancelTitle = '取消',
  submitTitle = '保存',
}: {
  onCancel: () => void
  onSubmit: () => void
  loading?: boolean
  cancelTitle?: string
  submitTitle?: string
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        className={formGhostButtonClass}
        onClick={onCancel}
      >
        {cancelTitle}
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={loading}
        className={formPrimaryButtonClass}
        onClick={onSubmit}
      >
        {submitTitle}
      </Button>
    </>
  )
}
