import { cn } from '@/utils'
import { forwardRef, HTMLAttributes } from 'react'

export interface DanmakuContainerProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
}

const DanmakuContainer = forwardRef<HTMLDivElement, DanmakuContainerProps>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn('fixed left-0 top-0 z-infinity h-full w-full pointer-events-none shadow-md', className)}
      ref={ref}
      {...props}
    ></div>
  )
})

DanmakuContainer.displayName = 'DanmakuContainer'

export default DanmakuContainer
