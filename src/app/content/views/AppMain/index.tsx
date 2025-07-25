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
            'fixed top-0 right-0 z-infinity h-full grid grid-rows-[auto_1fr_auto] bg-slate-50 dark:bg-slate-950 font-sans shadow-2xl',
            className
          )}
          onMouseDown={onMouseDown}
        >
          {children}
          <div
            ref={setRef}
            className="absolute inset-y-0 -left-1 z-infinity w-2 cursor-ew-resize rounded-l-md bg-slate-200 opacity-0 transition-opacity hover:opacity-100 dark:bg-slate-600"
          ></div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

AppMain.displayName = 'AppMain'

export default AppMain
