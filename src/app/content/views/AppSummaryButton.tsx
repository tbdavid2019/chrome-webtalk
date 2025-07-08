import { type FC, useState, type MouseEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRemeshDomain, useRemeshSend } from 'remesh-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils'
import LogoIcon6 from '@/assets/images/logo-6.svg'
import AppStatusDomain from '@/domain/AppStatus'

export interface AppSummaryButtonProps {
  className?: string
}

const AppSummaryButton: FC<AppSummaryButtonProps> = ({ className }) => {
  const send = useRemeshSend()
  const appStatusDomain = useRemeshDomain(AppStatusDomain())

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
    >
      <Button
        onClick={handleClick}
        className="relative z-20 size-11 rounded-l-full rounded-r-none p-0 text-xs shadow-lg shadow-yellow-500/50 bg-yellow-400 after:absolute after:-inset-0.5 after:z-10 after:animate-[shimmer_2s_linear_infinite] after:rounded-l-full after:rounded-r-none after:bg-[conic-gradient(from_var(--shimmer-angle),theme(colors.yellow.500)_0%,theme(colors.white)_10%,theme(colors.yellow.500)_20%)]"
      >
        <LogoIcon6 className="relative z-20 max-h-full max-w-full overflow-hidden" />
      </Button>
    </div>
  )
}

AppSummaryButton.displayName = 'AppSummaryButton'

export default AppSummaryButton