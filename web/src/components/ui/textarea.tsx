import * as React from 'react'
import { cn } from 'lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-border bg-white px-3 py-2.5 text-[13px] text-foreground ring-offset-background transition-all duration-200 ease-out placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:border-primary/35 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
