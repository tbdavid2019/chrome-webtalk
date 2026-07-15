import '@webcomponents/custom-elements'
import Header from '@/app/content/views/Header'
import Footer from '@/app/content/views/Footer'
import Main from '@/app/content/views/Main'
import AppButton from '@/app/content/views/AppButton'
import AppMain from '@/app/content/views/AppMain'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'
import ChatRoomDomain from '@/domain/ChatRoom'
import UserInfoDomain from '@/domain/UserInfo'
import Setup from '@/app/content/views/Setup'
import MessageListDomain from '@/domain/MessageList'
import { useEffect, useRef, useState } from 'react'
import { SummaryPanel } from '@/components/SummaryPanel'
import { Toaster } from 'sonner'
import DanmakuContainer from './components/DanmakuContainer'
import DanmakuDomain from '@/domain/Danmaku'
import AppStatusDomain from '@/domain/AppStatus'
import { checkDarkMode, cn, generateRandomAvatar, getSiteInfo } from '@/utils'
import VirtualRoomDomain from '@/domain/VirtualRoom'
import { MAX_AVATAR_SIZE } from '@/constants/config'

const OVERLAY_BASE_Z_INDEX = 2147482000

export interface AppProps {
  enableVirtualRoom?: boolean
}

if (import.meta.env.FIREFOX) {
  window.requestAnimationFrame = window.requestAnimationFrame.bind(window)
}

export default function App({ enableVirtualRoom = true }: AppProps) {
  const send = useRemeshSend()

  const chatRoomDomain = useRemeshDomain(ChatRoomDomain())
  const virtualRoomDomain = useRemeshDomain(VirtualRoomDomain())
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const messageListDomain = useRemeshDomain(MessageListDomain())
  const danmakuDomain = useRemeshDomain(DanmakuDomain())
  const appStatusDomain = useRemeshDomain(AppStatusDomain())

  const danmakuIsEnabled = useRemeshQuery(danmakuDomain.query.IsEnabledQuery())
  const userInfoSetFinished = useRemeshQuery(userInfoDomain.query.UserInfoSetIsFinishedQuery())
  const messageListLoadFinished = useRemeshQuery(messageListDomain.query.LoadIsFinishedQuery())
  const userInfoLoadFinished = useRemeshQuery(userInfoDomain.query.UserInfoLoadIsFinishedQuery())
  const appStatusLoadIsFinished = useRemeshQuery(appStatusDomain.query.StatusLoadIsFinishedQuery())
  const appOpenStatus = useRemeshQuery(appStatusDomain.query.OpenQuery())
  const buttonsHidden = useRemeshQuery(appStatusDomain.query.ButtonsHiddenQuery())
  const chatRoomJoinIsFinished = useRemeshQuery(chatRoomDomain.query.JoinIsFinishedQuery())
  const virtualRoomJoinIsFinished = useRemeshQuery(virtualRoomDomain.query.JoinIsFinishedQuery())
  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())
  const notUserInfo = userInfoLoadFinished && !userInfoSetFinished

  const [showSummary, setShowSummary] = useState(false)
  const [topPanel, setTopPanel] = useState<'main' | 'summary' | null>(null)

  const joinRoom = () => {
    send(chatRoomDomain.command.JoinRoomCommand())
    if (enableVirtualRoom) {
      send(virtualRoomDomain.command.JoinRoomCommand())
    }
  }

  const leaveRoom = () => {
    if (chatRoomJoinIsFinished) send(chatRoomDomain.command.LeaveRoomCommand())
    if (enableVirtualRoom && virtualRoomJoinIsFinished) send(virtualRoomDomain.command.LeaveRoomCommand())
  }

  // 🧠 綁定事件：接收「toggle-ai-summary-panel」來顯示／關閉面板
  useEffect(() => {
    const handler = () => setShowSummary((prev) => !prev)
    window.addEventListener('toggle-ai-summary-panel', handler)
    return () => window.removeEventListener('toggle-ai-summary-panel', handler)
  }, [])

  useEffect(() => {
    const handler = () => setShowSummary(true)
    window.addEventListener('open-ai-summary-panel', handler)
    return () => window.removeEventListener('open-ai-summary-panel', handler)
  }, [])

  useEffect(() => {
    if (!showSummary) {
      return
    }
    setTopPanel('summary')
    if (appOpenStatus) {
      send(appStatusDomain.command.UpdateOpenCommand(false))
    }
  }, [showSummary, appOpenStatus, appStatusDomain, send])

  const previousAppOpenStatusRef = useRef(appOpenStatus)

  useEffect(() => {
    const previous = previousAppOpenStatusRef.current
    previousAppOpenStatusRef.current = appOpenStatus

    if (!previous && appOpenStatus && showSummary) {
      setShowSummary(false)
    }
  }, [appOpenStatus, showSummary])

  // 🧠 初始化與同步不同網站使用不同頭像 (Room-specific avatar)
  useEffect(() => {
    if (!userInfoLoadFinished || !userInfo) return

    const handleRoomAvatarInit = async () => {
      let needsUpdate = false
      const updatedUserInfo = { ...userInfo }

      // 1. 初始化欄位
      if (updatedUserInfo.roomAvatarsEnabled === undefined) {
        updatedUserInfo.roomAvatarsEnabled = true
        needsUpdate = true
      }
      if (!updatedUserInfo.globalAvatar) {
        updatedUserInfo.globalAvatar = updatedUserInfo.avatar
        needsUpdate = true
      }
      if (!updatedUserInfo.roomAvatars) {
        updatedUserInfo.roomAvatars = {}
        needsUpdate = true
      }

      if (updatedUserInfo.roomAvatarsEnabled) {
        const hostname = getSiteInfo().hostname
        const currentRoomAvatar = updatedUserInfo.roomAvatars[hostname]

        if (!currentRoomAvatar) {
          // 為該網站生成新頭像
          const newAvatar = await generateRandomAvatar(MAX_AVATAR_SIZE)
          updatedUserInfo.roomAvatars[hostname] = newAvatar
          updatedUserInfo.avatar = newAvatar
          needsUpdate = true
        } else if (updatedUserInfo.avatar !== currentRoomAvatar) {
          updatedUserInfo.avatar = currentRoomAvatar
          needsUpdate = true
        }
      } else {
        // 使用全域預設頭像
        if (updatedUserInfo.avatar !== updatedUserInfo.globalAvatar) {
          updatedUserInfo.avatar = updatedUserInfo.globalAvatar
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        send(userInfoDomain.command.UpdateUserInfoCommand(updatedUserInfo))
      }
    }

    handleRoomAvatarInit()
  }, [userInfoLoadFinished, userInfo, send, userInfoDomain])

  // 🧠 綁定事件：接收「reset-buttons-hidden」來重置按鈕隱藏狀態
  useEffect(() => {
    const handler = () => {
      send(appStatusDomain.command.UpdateButtonsHiddenCommand(false))
    }
    window.addEventListener('reset-buttons-hidden', handler)
    return () => window.removeEventListener('reset-buttons-hidden', handler)
  }, [send, appStatusDomain])

  // 🧠 綁定事件：接收「toggle-buttons-hidden」來切換按鈕隱藏狀態
  useEffect(() => {
    const handler = () => {
      send(appStatusDomain.command.UpdateButtonsHiddenCommand(!buttonsHidden))
    }
    window.addEventListener('toggle-buttons-hidden', handler)
    return () => window.removeEventListener('toggle-buttons-hidden', handler)
  }, [send, appStatusDomain, buttonsHidden])

  useEffect(() => {
    if (messageListLoadFinished) {
      if (userInfoSetFinished) {
        joinRoom()
      } else {
        send(messageListDomain.command.ClearListCommand())
      }
    }
    return () => leaveRoom()
  }, [userInfoSetFinished, messageListLoadFinished])

  const danmakuContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (danmakuIsEnabled) {
      send(danmakuDomain.command.MountCommand(danmakuContainerRef.current!))
    }
    return () => {
      if (danmakuIsEnabled) {
        send(danmakuDomain.command.UnmountCommand())
      }
    }
  }, [danmakuIsEnabled])

  useEffect(() => {
    window.addEventListener('beforeunload', leaveRoom)
    return () => {
      window.removeEventListener('beforeunload', leaveRoom)
    }
  }, [])

  const themeMode =
    userInfo?.themeMode === 'system'
      ? checkDarkMode()
        ? 'dark'
        : 'light'
      : (userInfo?.themeMode ?? (checkDarkMode() ? 'dark' : 'light'))
  const getPanelZIndex = (panel: 'main' | 'summary') =>
    topPanel === panel ? OVERLAY_BASE_Z_INDEX + 1 : OVERLAY_BASE_Z_INDEX

  return (
    <div id="app" className={cn('contents', themeMode)}>
      {appStatusLoadIsFinished && (
        <>
          <AppMain zIndex={getPanelZIndex('main')} onMouseDown={() => setTopPanel('main')}>
            <Header />
            <div className="flex size-full flex-1 overflow-hidden">
              <Main key="chat-main" />
            </div>
            <Footer />
            {notUserInfo && <Setup />}
            <Toaster
              richColors
              theme={themeMode}
              offset="70px"
              visibleToasts={1}
              toastOptions={{
                classNames: {
                  toast: 'dark:bg-slate-950 border dark:border-slate-600'
                }
              }}
              position="top-center"
            />
          </AppMain>
        </>
      )}
      {showSummary && (
        <div
          onMouseDown={() => setTopPanel('summary')}
          style={{
            zIndex: getPanelZIndex('summary'),
            position: 'fixed',
            top: 0,
            right: 0,
            width: 'auto',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <SummaryPanel key="summary-panel" onClose={() => setShowSummary(false)} />
        </div>
      )}
      {!buttonsHidden && <AppButton />}
      <DanmakuContainer ref={danmakuContainerRef} style={{ opacity: userInfo?.danmakuOpacity ?? 0.8 }} />
    </div>
  )
}
