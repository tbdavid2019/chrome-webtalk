import { useState, type FC } from 'react'
import { BugIcon, Globe2Icon, XIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/HoverCard'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Button } from '@/components/ui/Button'
import { cn, getSiteInfo } from '@/utils'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'
import ChatRoomDomain from '@/domain/ChatRoom'
import VirtualRoomDomain, { FromInfo, RoomUser } from '@/domain/VirtualRoom'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Virtuoso } from 'react-virtuoso'
import AvatarCircles from '@/components/magicui/AvatarCircles'
import Link from '@/components/Link'
import NumberFlow from '@number-flow/react'
import AppStatusDomain from '@/domain/AppStatus'
import UserInfoDomain from '@/domain/UserInfo'
import { getUiText } from '@/utils'

const PresenceCount: FC<{ count: number; capped?: boolean; label?: string }> = ({ count, capped, label }) => {
  const displayCount = capped ? `${count}+` : String(count)

  return (
    <span
      role="status"
      aria-label={`${label ? `${label}: ` : ''}${displayCount}`}
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-[4px] border border-border/80 bg-muted/40 px-2 text-xs font-semibold leading-none tabular-nums text-foreground transition-colors"
    >
      <span className="inline-flex items-center">
        {import.meta.env.FIREFOX ? displayCount : <NumberFlow className="tabular-nums" willChange value={count} />}
        {capped && import.meta.env.FIREFOX === false && <span>+</span>}
      </span>
    </span>
  )
}

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
    <div className="z-10 flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar className="size-8 rounded-md">
          <AvatarImage src={siteInfo.icon} alt="favicon" />
          <AvatarFallback>
            <Globe2Icon size="100%" className="text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <span className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-foreground">
            {siteInfo.hostname.replace(/^www\./i, '')}
          </span>
          <span className="block truncate text-xs leading-4 text-muted-foreground">
            {privateChatTarget ? `Private with @${privateChatTarget.username}` : siteInfo.title}
          </span>
        </div>
        {developerMode && virtualOnlineGroup.length > 1 && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                className="h-8 gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:no-underline hover:text-foreground"
                variant="ghost"
              >
                <BugIcon size={14} />
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
                          <Globe2Icon size="100%" className="text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid items-center gap-y-1">
                        <div className="flex items-center gap-x-2 overflow-hidden">
                          <h4 className="flex-1 truncate text-sm font-semibold text-foreground">
                            {site.hostname.replace(/^www\./i, '')}
                          </h4>
                <PresenceCount count={site.users.length} label={text.peopleOnline} />
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
      <div className="flex items-center gap-2">
        <Popover open={chatUserListOpen} onOpenChange={setChatUserListOpen}>
          <PopoverTrigger asChild>
            <Button
              className="rounded-[4px] p-0 hover:no-underline animate-in fade-in"
              variant="link"
              aria-label={text.peopleOnline}
            >
              <PresenceCount count={cappedChatOnlineCount} capped={chatOnlineCount > 99} label={text.peopleOnline} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 rounded-md p-0">
            <ScrollArea type="scroll" className="max-h-[204px] min-h-9 p-1" ref={setChatUserListScrollParentRef}>
              <Virtuoso
                data={chatUserList}
                defaultItemHeight={28}
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
                        'my-0.5 flex items-center gap-x-2 rounded-xl px-2 py-1.5 outline-none select-none',
                        !isMe && 'cursor-pointer hover:bg-accent/70 active:bg-accent transition-colors',
                        isSelected &&
                          'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/50'
                      )}
                      title={isMe ? undefined : isSelected ? '取消私聊' : '點擊開始私聊'}
                    >
                      <Avatar className="size-4 shrink-0">
                        <AvatarImage className="size-full" src={user.userAvatar} alt="avatar" />
                        <AvatarFallback>{user.username.at(0)}</AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'flex-1 truncate text-sm text-slate-500 dark:text-slate-50',
                          isSelected && 'text-indigo-600 dark:text-indigo-400 font-semibold'
                        )}
                      >
                        {user.username} {isMe && '(me)'}
                      </div>
                      {isSelected && (
                        <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded font-bold shrink-0">
                          🔒 私聊
                        </span>
                      )}
                    </div>
                  )
                }}
              ></Virtuoso>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        <button
          onClick={handleClose}
          className="flex size-7 items-center justify-center rounded-[4px] border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground shrink-0"
          title="關閉聊天"
          aria-label="關閉聊天"
        >
          <XIcon size={14} />
        </button>
      </div>
    </div>
  )
}

Header.displayName = 'Header'

export default Header
