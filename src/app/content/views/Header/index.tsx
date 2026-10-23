import { useEffect, useState, type FC } from 'react'
import { BugIcon, Globe2Icon, LockIcon, MoonIcon, SunIcon, UsersIcon, XIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/HoverCard'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Button } from '@/components/ui/Button'
import { checkDarkMode, cn, getSiteInfo, getUiText, subscribeDarkModeChange } from '@/utils'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'
import ChatRoomDomain from '@/domain/ChatRoom'
import VirtualRoomDomain, { FromInfo, RoomUser } from '@/domain/VirtualRoom'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Virtuoso } from 'react-virtuoso'
import AvatarCircles from '@/components/magicui/AvatarCircles'
import Link from '@/components/Link'
import AppStatusDomain from '@/domain/AppStatus'
import UserInfoDomain from '@/domain/UserInfo'

const Header: FC = () => {
  const send = useRemeshSend()
  const siteInfo = getSiteInfo()
  const chatRoomDomain = useRemeshDomain(ChatRoomDomain())
  const virtualRoomDomain = useRemeshDomain(VirtualRoomDomain())
  const appStatusDomain = useRemeshDomain(AppStatusDomain())
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const chatUserList = useRemeshQuery(chatRoomDomain.query.UserListQuery())
  const virtualUserList = useRemeshQuery(virtualRoomDomain.query.UserListQuery())
  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())
  const text = getUiText(userInfo?.language)
  const privateChatTarget = useRemeshQuery(chatRoomDomain.query.PrivateChatTargetQuery())
  const chatOnlineCount = chatUserList.length
  const developerMode = userInfo?.developerMode === true
  const cappedChatOnlineCount = Math.min(chatOnlineCount, 99)

  const [detectedIsDark, setDetectedIsDark] = useState(() => checkDarkMode())

  useEffect(() => {
    return subscribeDarkModeChange(setDetectedIsDark)
  }, [])

  const isDark =
    userInfo?.themeMode === 'dark'
      ? true
      : userInfo?.themeMode === 'light'
        ? false
        : detectedIsDark

  const handleToggleTheme = () => {
    if (!userInfo) return
    send(
      userInfoDomain.command.UpdateUserInfoCommand({
        ...userInfo,
        themeMode: isDark ? 'light' : 'dark'
      })
    )
  }

  const virtualOnlineGroup = virtualUserList
    .flatMap((user) => user.fromInfos.map((from) => ({ from, user })))
    .reduce<(FromInfo & { users: RoomUser[] })[]>((acc, item) => {
      const existSite = acc.find((group) => group.origin === item.from.origin)
      if (existSite) {
        const existUser = existSite.users.find((user) => user.userId === item.user.userId)
        !existUser && existSite.users.push(item.user)
      } else {
        acc.push({ ...item.from, users: [item.user] })
      }
      return acc
    }, [])
    .sort((a, b) => b.users.length - a.users.length)

  const [chatUserListScrollParentRef, setChatUserListScrollParentRef] = useState<HTMLDivElement | null>(null)
  const [chatUserListOpen, setChatUserListOpen] = useState(false)
  const [virtualOnlineGroupScrollParentRef, setVirtualOnlineGroupScrollParentRef] = useState<HTMLDivElement | null>(
    null
  )

  const handleClose = () => {
    send(appStatusDomain.command.UpdateOpenCommand(false))
  }

  return (
    <div className="relative z-10 flex h-15 items-center justify-between border-b-2 border-[#17324d]/15 dark:border-[#2b4a6b] bg-[#fff9e8] dark:bg-[#13273c] px-4 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-[#ffb010]">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#17324d] bg-[#ffb010] p-1 shadow-[0_2px_0_#17324d] dark:border-[#ffb010] dark:bg-[#1b3450] dark:shadow-none">
          <Avatar className="size-full rounded-md">
            <AvatarImage src={siteInfo.icon} alt="favicon" className="size-full object-contain" />
            <AvatarFallback className="bg-transparent">
              <Globe2Icon className="size-3.5 text-foreground" strokeWidth={1.8} />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3
              className="truncate font-sans text-[15px] font-bold tracking-tight text-foreground"
              title={siteInfo.hostname}
            >
              {siteInfo.hostname.replace(/^www\./i, '')}
            </h3>
            {privateChatTarget && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-saffron/30 bg-saffron/15 px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                <LockIcon size={10} strokeWidth={2} />
                私聊
              </span>
            )}
          </div>
          <p
            className="truncate font-sans text-xs font-medium leading-tight text-muted-foreground mt-0.5"
            title={privateChatTarget ? `私聊對象: @${privateChatTarget.username}` : (siteInfo.title || siteInfo.hostname)}
          >
            {privateChatTarget ? `與 @${privateChatTarget.username} 私聊` : (siteInfo.title || '網頁即時聊天室')}
          </p>
        </div>
        {developerMode && virtualOnlineGroup.length > 1 && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                className="h-7 gap-1 rounded-md px-2 font-mono text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                variant="ghost"
              >
                <BugIcon size={13} strokeWidth={1.8} />
                <span>Sites</span>
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 rounded-2xl p-0">
              <ScrollArea
                type="scroll"
                className="max-h-96 min-h-[72px] p-2"
                ref={setVirtualOnlineGroupScrollParentRef}
              >
                <Virtuoso
                  data={virtualOnlineGroup}
                  defaultItemHeight={56}
                  customScrollParent={virtualOnlineGroupScrollParentRef!}
                  itemContent={(_index, site) => (
                    <Link
                      underline={false}
                      href={site.origin}
                      className="grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-2 rounded-xl px-2 py-2 hover:bg-accent hover:text-accent-foreground"
                    >
                      <Avatar className="size-10 rounded-sm">
                        <AvatarImage src={site.icon} alt="favicon" />
                        <AvatarFallback>
                          <Globe2Icon size="100%" className="text-muted-foreground" strokeWidth={1.8} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid items-center gap-y-1">
                        <div className="flex items-center gap-x-2 overflow-hidden">
                          <h4 className="flex-1 truncate font-mono text-xs font-semibold text-foreground">
                            {site.hostname.replace(/^www\./i, '')}
                          </h4>
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground font-medium">
                            <UsersIcon size={12} strokeWidth={1.8} />
                            <span>{site.users.length}</span>
                          </span>
                        </div>
                        <AvatarCircles max={9} size="xs" avatarUrls={site.users.map((user) => user.userAvatar)} />
                      </div>
                    </Link>
                  )}
                ></Virtuoso>
              </ScrollArea>
            </HoverCardContent>
          </HoverCard>
        )}
      </div>

      {/* 右側：精緻的一體化 Action Capsule 控制組 */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* 主題切換按鈕（Lucide Sun / Moon，strokeWidth 1.8） */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#17324d] bg-[#fffefa] text-[#2b251a] transition-all hover:bg-[#ffb010] active:translate-y-0.5 shadow-[0_2px_0_#17324d] dark:border-[#2b4a6b] dark:bg-[#1b3450] dark:text-[#fff9e8] dark:shadow-none dark:hover:border-[#ffb010] dark:hover:bg-[#ffb010] dark:hover:text-[#0b1826] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={isDark ? '切換為亮色模式' : '切換為深色模式'}
          aria-label="切換深淺模式"
        >
          {isDark ? <SunIcon size={14} strokeWidth={1.8} /> : <MoonIcon size={14} strokeWidth={1.8} />}
        </button>

        {/* 多人在線狀態（僅在 >= 2 人時顯示，使用 Lucide Users，Zero-Noise Presence） */}
        {chatUserList.length >= 2 && (
          <Popover open={chatUserListOpen} onOpenChange={setChatUserListOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border-[1.5px] border-[#17324d] bg-[#ffb010] px-3 font-sans text-xs font-bold text-[#2b251a] transition-all hover:bg-[#f2a600] active:translate-y-0.5 shadow-[0_2px_0_#17324d] dark:border-[#ffb010] dark:bg-[#ffb010]/20 dark:text-[#ffb010] dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={text.peopleOnline}
                title={`${text.peopleOnline} (${cappedChatOnlineCount}) - 點擊查看在線名單`}
              >
                <UsersIcon size={13} strokeWidth={1.8} className="text-current shrink-0" />
                <span className="tabular-nums font-mono font-semibold">
                  {cappedChatOnlineCount}
                  {chatOnlineCount > 99 && '+'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 rounded-xl border border-border/80 bg-popover p-1.5 shadow-lg">
              <div className="flex items-center justify-between border-b border-border/40 px-2 py-1.5 font-mono text-xs font-semibold text-muted-foreground mb-1">
                <span className="flex items-center gap-1">
                  <UsersIcon size={12} strokeWidth={1.8} />
                  在線成員
                </span>
                <span className="tabular-nums font-mono text-xs font-normal">{chatUserList.length} 人</span>
              </div>
              <ScrollArea type="scroll" className="max-h-[220px] min-h-9" ref={setChatUserListScrollParentRef}>
                <Virtuoso
                  data={chatUserList}
                  defaultItemHeight={32}
                  customScrollParent={chatUserListScrollParentRef!}
                  itemContent={(_index, user) => {
                    const isMe = user.userId === userInfo?.id
                    const isSelected = privateChatTarget?.userId === user.userId
                    return (
                      <div
                        onClick={() => {
                          if (isMe) return
                          if (isSelected) {
                            send(chatRoomDomain.command.SelectPrivateChatTargetCommand(null))
                          } else {
                            send(chatRoomDomain.command.SelectPrivateChatTargetCommand(user))
                          }
                          setChatUserListOpen(false)
                        }}
                        className={cn(
                          'my-0.5 flex items-center gap-x-2 rounded-lg px-2 py-1.5 outline-none select-none transition-colors text-xs',
                          !isMe && 'cursor-pointer hover:bg-muted/70 active:bg-muted',
                          isSelected && 'bg-primary/10 border border-primary/20 text-primary font-semibold'
                        )}
                        title={isMe ? undefined : isSelected ? '取消私聊' : '點擊開始私聊'}
                      >
                        <Avatar className="size-5 shrink-0 rounded-full">
                          <AvatarImage className="size-full" src={user.userAvatar} alt="avatar" />
                          <AvatarFallback>{user.username.at(0)}</AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            'flex-1 truncate font-medium text-foreground/80',
                            isSelected && 'text-primary font-semibold'
                          )}
                        >
                          {user.username} {isMe && <span className="font-mono text-xs text-muted-foreground font-normal">(我)</span>}
                        </div>
                        {isSelected && (
                          <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                            私聊中
                          </span>
                        )}
                      </div>
                    )
                  }}
                ></Virtuoso>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}

        {/* 關閉按鈕（Lucide X，strokeWidth 2） */}
        <button
          onClick={handleClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#17324d] bg-[#fffefa] text-[#2b251a] transition-all hover:bg-[#ffb010] active:translate-y-0.5 shadow-[0_2px_0_#17324d] dark:border-[#2b4a6b] dark:bg-[#1b3450] dark:text-[#fff9e8] dark:shadow-none dark:hover:border-[#ffb010] dark:hover:bg-[#ffb010] dark:hover:text-[#0b1826] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="關閉聊天"
          aria-label="關閉聊天"
        >
          <XIcon size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

Header.displayName = 'Header'

export default Header
