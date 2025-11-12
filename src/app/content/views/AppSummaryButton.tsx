import { type FC, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn, clamp } from '@/utils'
import LogoIcon6 from '@/assets/images/logo-6.svg'
import useDraggable from '@/hooks/useDraggable'
import { useFloatingDockOffset } from '@/hooks/useFloatingDockOffset'

export interface AppSummaryButtonProps {
  className?: string
}

const AppSummaryButton: FC<AppSummaryButtonProps> = ({ className }) => {
  const [viewportHeight, setViewportHeight] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight))
  const [offset, setOffset] = useFloatingDockOffset()

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const verticalLimit = Math.max(0, viewportHeight / 2 - 80)
  const clampedOffset = clamp(offset, -verticalLimit, verticalLimit)

  useEffect(() => {
    if (clampedOffset !== offset) {
      setOffset(clampedOffset)
    }
  }, [clampedOffset, offset, setOffset])

  const { setRef: dragRef, y } = useDraggable({
    initX: 0,
    initY: clampedOffset,
    minX: 0,
    maxX: 0,
    minY: -verticalLimit,
    maxY: verticalLimit,
    value: clampedOffset,
    onChange: ({ y }) => setOffset(y)
  })

  // 點擊後派發自訂事件
  const handleClick = () => {
    // 只派發摘要面板切換事件，不再強制打開主彈窗
    const event = new CustomEvent('toggle-ai-summary-panel')
    window.dispatchEvent(event)
  }

  return (
    <div
      className={cn(
        'fixed top-[calc(50%+60px)] right-0 z-infinity transform -translate-y-1/2 grid gap-y-3 select-none',
        className
      )}
      style={{ transform: `translateY(calc(-50% + ${y}px))` }}
    >
      <Button
        onClick={handleClick}
        ref={dragRef}
        className="relative z-20 size-11 cursor-grab rounded-l-full rounded-r-none bg-yellow-400 p-0 text-xs shadow-lg shadow-yellow-500/50 after:absolute after:-inset-0.5 after:z-10 after:animate-[shimmer_2s_linear_infinite] after:rounded-l-full after:rounded-r-none after:bg-[conic-gradient(from_var(--shimmer-angle),theme(colors.yellow.500)_0%,theme(colors.white)_10%,theme(colors.yellow.500)_20%)] active:cursor-grabbing"
      >
        <LogoIcon6 className="relative z-20 max-h-full max-w-full overflow-hidden" />
      </Button>
    </div>
  )
}

AppSummaryButton.displayName = 'AppSummaryButton'

export default AppSummaryButton
