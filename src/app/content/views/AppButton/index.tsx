import { type FC, useState, type MouseEvent, useEffect } from 'react'
import {
  SettingsIcon,
  MoonIcon,
  SunIcon,
  XIcon,
  GripVerticalIcon,
  ChromeIcon,
  MessageSquareTextIcon,
  SparklesIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'
import { Button } from '@/components/ui/Button'
import UserInfoDomain from '@/domain/UserInfo'
import ToastDomain from '@/domain/Toast'
import { checkDarkMode, cn, subscribeDarkModeChange } from '@/utils'
import AppStatusDomain from '@/domain/AppStatus'
import { getPlatform } from '@/platform'
import useDraggable from '@/hooks/useDraggable'
import { useFloatingDockOffset, useFloatingDockPlacement, type DockPlacement } from '@/hooks/useFloatingDockOffset'
import { clamp } from '@/utils'

const WEBTALK_CHROME_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/webtalk-333-chat-and-summ/hhhdloelamldfadfobnhdhpfmbbdppdb'

export interface AppButtonProps {
  className?: string
  enableAi?: boolean
  isEmbed?: boolean
  defaultPlacement?: DockPlacement
}

const AppButton: FC<AppButtonProps> = ({
  className,
  enableAi = true,
  isEmbed = false,
  defaultPlacement = 'right'
}) => {
  const send = useRemeshSend()
  const appStatusDomain = useRemeshDomain(AppStatusDomain())
  const toastDomain = useRemeshDomain(ToastDomain())
  const appOpenStatus = useRemeshQuery(appStatusDomain.query.OpenQuery())
  const hasUnreadQuery = useRemeshQuery(appStatusDomain.query.HasUnreadQuery())
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())

  const [detectedIsDark, setDetectedIsDark] = useState(() => checkDarkMode())

  useEffect(() => {
    return subscribeDarkModeChange(setDetectedIsDark)
  }, [])

  const isDarkMode = userInfo?.themeMode === 'dark' ? true : userInfo?.themeMode === 'light' ? false : detectedIsDark

  const [hovered, setHovered] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth))
  const [viewportHeight, setViewportHeight] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight))
  const [offset, setOffset] = useFloatingDockOffset()
  const [placement, setPlacement] = useFloatingDockPlacement(
    userInfo?.floatingButtonPlacement ?? defaultPlacement
  )

  useEffect(() => {
    if (userInfo?.floatingButtonPlacement && userInfo.floatingButtonPlacement !== placement) {
      setPlacement(userInfo.floatingButtonPlacement)
    }
  }, [userInfo?.floatingButtonPlacement, placement, setPlacement])

  const isLeft = placement === 'left'

  const handleSnapPlacement = (next: DockPlacement) => {
    setPlacement(next)
    if (userInfo && userInfo.floatingButtonPlacement !== next) {
      send(userInfoDomain.command.UpdateUserInfoCommand({ ...userInfo, floatingButtonPlacement: next }))
    }
  }

  const handleTogglePlacement = (e?: MouseEvent) => {
    e?.stopPropagation()
    handleSnapPlacement(isLeft ? 'right' : 'left')
  }

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth)
      setViewportHeight(window.innerHeight)
    }
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

  const maxHorizontalDrag = Math.max(0, viewportWidth - 60)

  const {
    setRef: dragRef,
    isDragging,
    x,
    y
  } = useDraggable({
    initX: 0,
    initY: clampedOffset,
    minX: isLeft ? 0 : -maxHorizontalDrag,
    maxX: isLeft ? maxHorizontalDrag : 0,
    minY: -verticalLimit,
    maxY: verticalLimit,
    value: clampedOffset,
    onChange: ({ y }) => setOffset(y),
    onEnd: ({ x }) => {
      const snapThreshold = maxHorizontalDrag / 2
      if (!isLeft && x < -snapThreshold) {
        handleSnapPlacement('left')
      } else if (isLeft && x > snapThreshold) {
        handleSnapPlacement('right')
      }
    }
  })

  const handleSwitchTheme = () => {
    if (userInfo) {
      send(userInfoDomain.command.UpdateUserInfoCommand({ ...userInfo, themeMode: isDarkMode ? 'light' : 'dark' }))
    } else if (!isEmbed) {
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
    send(
      toastDomain.command.InfoCommand(
        isEmbed ? '懸浮按鈕已隱藏，重新整理頁面即可恢復。' : '懸浮按鈕已完全隱藏，可在擴充功能設定頁面重新顯示！'
      )
    )
  }

  const buttonShapeClass = isLeft
    ? 'rounded-r-full rounded-l-none hover:translate-x-0.5'
    : 'rounded-l-full rounded-r-none hover:-translate-x-0.5'

  return (
    <div
      ref={(node) => {
        dragRef(node)
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'fixed top-1/2 z-infinity flex flex-col items-center gap-y-2 select-none transform pointer-events-auto',
        isDragging ? '' : 'transition-all duration-300 ease-in-out',
        isLeft ? 'left-0' : 'right-0',
        isLeft
          ? 'border-l-0 rounded-r-2xl py-3 pr-2 pl-1.5'
          : 'border-r-0 rounded-l-2xl py-3 pl-2 pr-1.5',
        'bg-background/40 backdrop-blur border border-border/40 shadow-lg cursor-grab active:cursor-grabbing',
        !hovered
          ? 'opacity-50 shadow-none border-transparent'
          : 'opacity-100 shadow-2xl bg-background/90 border-border',
        className
      )}
      style={{
        transform: `translateY(calc(-50% + ${y}px)) translateX(calc(${x}px + ${
          !hovered && !isDragging ? (isLeft ? '-18px' : '18px') : '0px'
        }))`
      }}
    >
      {/* 關閉按鈕 X */}
      <AnimatePresence>
        {hovered && !isEmbed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleCloseDock}
            className={cn(
              'absolute -top-2.5 z-30 flex size-5 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md hover:bg-muted pointer-events-auto',
              isLeft ? '-right-2.5' : '-left-2.5'
            )}
            title="隱藏懸浮按鈕"
          >
            <XIcon size={10} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drag Handle 拖曳把手 */}
      <div
        onDoubleClick={handleTogglePlacement}
        className="text-muted-foreground py-0.5 transition-colors cursor-grab active:cursor-grabbing hover:text-foreground flex items-center justify-center select-none"
        title={isLeft ? '按住拖曳可搬移至右側，或按兩下快速切換至右側' : '按住拖曳可搬移至左側，或按兩下快速切換至左側'}
      >
        <GripVerticalIcon size={12} className="rotate-90 pointer-events-none" />
      </div>

      {/* 1. 聊天按鈕 (Lucide MessageSquareText) */}
      <Button
        onClick={handleToggleApp}
        className={cn(
          'relative z-20 size-10 border-0 bg-primary p-0 text-xs text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-transform flex items-center justify-center',
          buttonShapeClass
        )}
        title="聊天室"
      >
        <AnimatePresence>
          {hasUnreadQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={cn(
                'absolute -top-1 z-30 flex size-4 items-center justify-center',
                isLeft ? '-left-1' : '-right-1'
              )}
            >
              <span className="absolute inline-flex size-full animate-ping rounded-full opacity-75 bg-orange-400"></span>
              <span className="relative inline-flex size-2 rounded-full bg-orange-500"></span>
            </motion.div>
          )}
        </AnimatePresence>

        <MessageSquareTextIcon size={19} strokeWidth={2} className="relative z-20 text-primary-foreground" />
      </Button>

      {enableAi && (
        <Button
          onClick={handleToggleSummary}
          className={cn(
            'relative z-20 size-10 border-0 bg-secondary p-0 text-xs text-secondary-foreground shadow-md shadow-secondary/20 hover:bg-secondary/90 transition-transform flex items-center justify-center',
            buttonShapeClass
          )}
          title="網頁摘要與對話"
        >
          <SparklesIcon size={19} strokeWidth={2} className="relative z-20 text-secondary-foreground" />
        </Button>
      )}

      {/* 3. 主題切換按鈕 (太陽/月亮) */}
      <Button
        onClick={handleSwitchTheme}
        className={cn(
          'relative z-20 size-10 border-0 bg-muted hover:bg-muted/80 text-muted-foreground p-0 text-xs shadow-sm hover:text-foreground transition-transform flex items-center justify-center',
          buttonShapeClass
        )}
        title="切換主題"
      >
        {isDarkMode ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      </Button>

      {isEmbed && (
        <Button
          asChild
          className={cn(
            'relative z-20 size-10 border-0 bg-muted p-0 text-xs text-muted-foreground shadow-sm transition-transform hover:bg-muted/80 hover:text-foreground',
            buttonShapeClass
          )}
          title="在 Chrome 安裝 WebTalk 333"
        >
          <a
            href={WEBTALK_CHROME_WEB_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="在 Chrome 安裝 WebTalk 333"
          >
            <ChromeIcon size={17} />
          </a>
        </Button>
      )}

      {!isEmbed && (
        <Button
          onClick={handleOpenOptionsPage}
          className={cn(
            'relative z-20 size-10 border-0 bg-muted hover:bg-muted/80 text-muted-foreground p-0 text-xs shadow-sm hover:text-foreground transition-transform flex items-center justify-center',
            buttonShapeClass
          )}
          title="設定"
        >
          <SettingsIcon size={16} />
        </Button>
      )}
    </div>
  )
}

AppButton.displayName = 'AppButton'

export default AppButton
