import * as LabelPrimitive from '@radix-ui/react-label'

import { cn } from '@/lib/utils'

function Label({ className, ...props }) {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm leading-none font-medium select-none', className)}
      {...props}
    />
  )
}

export { Label }
