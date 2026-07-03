import { type ReactNode, type FC } from 'react'
import useResizable from '@/hooks/useResizable'
import { motion, AnimatePresence } from 'framer-motion'
import AppStatusDomain from '@/domain/AppStatus'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'
import { cn } from '@/utils'

export interface AppMainProps {
  children?: ReactNode
  className?: string
  zIndex?: number
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>
}

const AppMain: FC<AppMainProps> = ({ children, className, zIndex, onMouseDown }) => {
  const appStatusDomain = useRemeshDomain(AppStatusDomain())
  const appOpenStatus = useRemeshQuery(appStatusDomain.query.OpenQuery())

  // 使用 useResizable 來實現可調整寬度的側邊欄
  const { size, setRef } = useResizable({
    initSize: 420, // 初始寬度
    maxSize: 800, // 最大寬度
    minSize: 360, // 最小寬度
    direction: 'left' // 向左調整大小
  })

  return (
    <AnimatePresence>
      {appOpenStatus && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: '0%' }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{
            width: `${size}px`,
            zIndex: zIndex
          }}
          className={cn(
            'fixed top-0 right-0 z-infinity h-full grid grid-rows-[auto_1fr_auto] bg-background text-foreground shadow-2xl border-l border-border',
            className
          )}
          onMouseDown={onMouseDown}
        >
          {children}
          <div
            ref={setRef}
            className="absolute inset-y-0 -left-0.5 z-infinity w-1 cursor-ew-resize bg-primary/20 opacity-0 transition-opacity hover:opacity-100"
          ></div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

AppMain.displayName = 'AppMain'

export default AppMain
