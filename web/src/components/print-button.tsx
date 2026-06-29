import { Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'components/common'
import type { PrintTemplateKey } from 'lib/print-keys'

export function PrintButton({
  templateKey,
  documentId,
  variant = 'outline',
  size = 'sm',
  label = '打印',
}: {
  templateKey: PrintTemplateKey
  documentId: string
  variant?: 'outline' | 'default' | 'ghost'
  size?: 'sm' | 'default'
  label?: string
}) {
  const navigate = useNavigate()
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate(`/print/${templateKey}/${documentId}`)}
    >
      <Printer className="size-4" /> {label}
    </Button>
  )
}
