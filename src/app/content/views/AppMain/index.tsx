import { type ReactNode, type FC } from 'react'
import useResizable from '@/hooks/useResizable'
import { motion, AnimatePresence } from 'framer-motion'
import AppStatusDomain from '@/domain/AppStatus'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'
import { cn } from '@/utils'

export interface AppMainProps {
  children?: ReactNode
  className?: string
}

const AppMain: FC<AppMainProps> = ({ children, className }) => {
  const appStatusDomain = useRemeshDomain(AppStatusDomain())
  const appOpenStatus = useRemeshQuery(appStatusDomain.query.OpenQuery())

  // 使用 useResizable 來實現可調整寬度的側邊欄
  const { size, setRef } = useResizable({
    initSize: 375, // 初始寬度
    maxSize: 700,  // 最大寬度
    minSize: 300,  // 最小寬度
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
          }}
          className={cn(
            'fixed top-0 right-0 z-infinity h-full grid grid-rows-[auto_1fr_auto] bg-slate-50 dark:bg-slate-950 font-sans shadow-2xl',
            className
          )}
        >
          {children}
          <div
            ref={setRef}
            className="absolute inset-y-0 -left-1 z-infinity w-2 cursor-ew-resize rounded-l-md bg-slate-200 dark:bg-slate-600 opacity-0 hover:opacity-100 transition-opacity"
          ></div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

AppMain.displayName = 'AppMain'

export default AppMain
