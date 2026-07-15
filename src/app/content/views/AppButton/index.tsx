import { type FC, useState, type MouseEvent, useEffect } from 'react'
import { SettingsIcon, MoonIcon, SunIcon, XIcon, GripVerticalIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'
import { Button } from '@/components/ui/Button'
import UserInfoDomain from '@/domain/UserInfo'
import ToastDomain from '@/domain/Toast'
import { checkDarkMode, cn } from '@/utils'
import LogoIcon0 from '@/assets/images/logo-0.svg'
import LogoIcon1 from '@/assets/images/logo-1.svg'
import LogoIcon2 from '@/assets/images/logo-2.svg'
import LogoIcon3 from '@/assets/images/logo-3.svg'
import LogoIcon4 from '@/assets/images/logo-4.svg'
import LogoIcon5 from '@/assets/images/logo-5.svg'
import LogoIcon6 from '@/assets/images/logo-6.svg'
import AppStatusDomain from '@/domain/AppStatus'
import { getDay } from 'date-fns'
import { getPlatform } from '@/platform'
import useDraggable from '@/hooks/useDraggable'
import { useFloatingDockOffset } from '@/hooks/useFloatingDockOffset'
import { clamp } from '@/utils'

export interface AppButtonProps {
  className?: string
}

const AppButton: FC<AppButtonProps> = ({ className }) => {
  const send = useRemeshSend()
  const appStatusDomain = useRemeshDomain(AppStatusDomain())
  const toastDomain = useRemeshDomain(ToastDomain())
  const appOpenStatus = useRemeshQuery(appStatusDomain.query.OpenQuery())
  const hasUnreadQuery = useRemeshQuery(appStatusDomain.query.HasUnreadQuery())
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())

  const DayLogo = [LogoIcon0, LogoIcon1, LogoIcon2, LogoIcon3, LogoIcon4, LogoIcon5, LogoIcon6][getDay(Date())]

  const isDarkMode = userInfo?.themeMode === 'dark' ? true : userInfo?.themeMode === 'light' ? false : checkDarkMode()

  const [hovered, setHovered] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight))
  const [offset, setOffset] = useFloatingDockOffset()

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const verticalLimit = Math.max(0, viewportHeight / 2 - 160)
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

  const handleSwitchTheme = () => {
    if (userInfo) {
      send(userInfoDomain.command.UpdateUserInfoCommand({ ...userInfo, themeMode: isDarkMode ? 'light' : 'dark' }))
    } else {
      handleOpenOptionsPage()
    }
  }

  const handleOpenOptionsPage = () => {
    getPlatform().openSettings()
  }

  const handleToggleApp = () => {
    send(appStatusDomain.command.UpdateOpenCommand(!appOpenStatus))
  }

  const handleToggleSummary = () => {
    const event = new CustomEvent('toggle-ai-summary-panel')
    window.dispatchEvent(event)
  }

  const handleCloseDock = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    send(appStatusDomain.command.UpdateButtonsHiddenCommand(true))
    send(toastDomain.command.InfoCommand('懸浮按鈕已完全隱藏，可在擴充功能設定頁面重新顯示！'))
  }

  return (
    <div
      ref={(node) => {
        dragRef(node)
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'fixed top-1/2 right-0 z-infinity flex flex-col items-center gap-y-2 select-none transform transition-all duration-300 ease-in-out pointer-events-auto',
        'bg-background/40 backdrop-blur border border-r-0 border-border/40 shadow-lg rounded-l-2xl py-3 pl-2 pr-1.5 cursor-grab active:cursor-grabbing',
        !hovered
          ? 'opacity-50 shadow-none border-transparent'
          : 'opacity-100 shadow-2xl bg-background/90 border-border',
        className
      )}
      style={{
        transform: `translateY(calc(-50% + ${y}px)) translateX(${!hovered ? '18px' : '0px'})`
      }}
    >
      {/* 關閉按鈕 X */}
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleCloseDock}
            className="absolute -left-2.5 -top-2.5 z-30 flex size-5 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md hover:bg-muted pointer-events-auto"
            title="隱藏懸浮按鈕"
          >
            <XIcon size={10} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drag Handle 拖曳把手 */}
      <div className="text-muted-foreground py-0.5 transition-colors">
        <GripVerticalIcon size={12} className="rotate-90 pointer-events-none" />
      </div>

      {/* 1. 聊天按鈕 (藍色兔子) */}
      <Button
        onClick={handleToggleApp}
        className="relative z-20 size-10 rounded-l-full rounded-r-none border-0 bg-primary/80 p-0 text-xs text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary transition-transform hover:-translate-x-0.5"
        title="聊天室"
      >
        <AnimatePresence>
          {hasUnreadQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute -right-1 -top-1 z-30 flex size-4 items-center justify-center"
            >
              <span className="absolute inline-flex size-full animate-ping rounded-full opacity-75 bg-orange-400"></span>
              <span className="relative inline-flex size-2 rounded-full bg-orange-500"></span>
            </motion.div>
          )}
        </AnimatePresence>

        <DayLogo className="relative z-20 size-7 overflow-hidden opacity-90"></DayLogo>
      </Button>

      {/* 2. AI 摘要按鈕 (黃色兔子) */}
      <Button
        onClick={handleToggleSummary}
        className="relative z-20 size-10 rounded-l-full rounded-r-none border-0 bg-secondary/80 p-0 text-xs text-secondary-foreground shadow-md shadow-secondary/20 hover:bg-secondary transition-transform hover:-translate-x-0.5"
        title="網頁摘要與對話"
      >
        <LogoIcon6 className="relative z-20 size-7 overflow-hidden opacity-90" />
      </Button>

      {/* 3. 主題切換按鈕 (太陽/月亮) */}
      <Button
        onClick={handleSwitchTheme}
        className="relative z-20 size-10 rounded-l-full rounded-r-none border-0 bg-muted hover:bg-muted/80 text-muted-foreground p-0 text-xs shadow-sm hover:text-foreground transition-transform hover:-translate-x-0.5 flex items-center justify-center"
        title="切換主題"
      >
        {isDarkMode ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      </Button>

      {/* 4. 設定按鈕 (齒輪) */}
      <Button
        onClick={handleOpenOptionsPage}
        className="relative z-20 size-10 rounded-l-full rounded-r-none border-0 bg-muted hover:bg-muted/80 text-muted-foreground p-0 text-xs shadow-sm hover:text-foreground transition-transform hover:-translate-x-0.5 flex items-center justify-center"
        title="設定"
      >
        <SettingsIcon size={16} />
      </Button>
    </div>
  )
}

AppButton.displayName = 'AppButton'

export default AppButton
